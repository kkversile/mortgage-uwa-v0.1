import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Recommendation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';
import { DecisionDto } from './dto/decision.dto';
import { aggregateRecommendation, evaluateRule } from './underwriting-engine';
import { calculateDti, calculateLtv } from './financial-engine';

@Injectable()
export class UnderwritingService {
  constructor(private readonly prisma: PrismaService) {}

  private applicationWhere(applicationId: string, context: AuthContext) {
    return canAccessAllTenants(context) ? { id: applicationId } : { id: applicationId, tenantId: context.tenantId };
  }

  async underwrite(applicationId: string, context: AuthContext) {
    const app = await this.prisma.mortgageApplication.findFirst({ where: this.applicationWhere(applicationId, context), include: { applicant: true, employment: true, liabilities: true, assets: true, property: true, creditReports: { orderBy: { retrievedAt: 'desc' }, take: 1 }, documents: true } });
    if (!app) throw new NotFoundException('Application not found');
    if (!app.employment || !app.property || !app.creditReports[0]) throw new BadRequestException('Application is missing financial, property, or credit data');
    if (!canAccessAllTenants(context) && !context.tenantId) throw new ForbiddenException('An active lender membership is required');

    const grossMonthlyIncome = Number(app.employment.grossMonthlyIncome) + Number(app.employment.otherMonthlyIncome);
    const monthlyDebt = app.liabilities.reduce((sum, l) => sum + Number(l.monthlyPayment), 0);
    const totalAssets = app.assets.reduce((sum, a) => sum + Number(a.currentValue), 0);
    const dti = calculateDti(monthlyDebt, grossMonthlyIncome);
    const ltv = calculateLtv(Number(app.requestedLoanAmount), Number(app.property.estimatedValue));
    const creditScore = app.creditReports[0].creditScore;
    const rules = await this.prisma.underwritingRule.findMany({ where: { enabled: true, tenantId: app.tenantId }, orderBy: { code: 'asc' } });
    if (!rules.length) throw new BadRequestException('No active underwriting policy is configured for this lender');
    const evals = rules.map(rule => evaluateRule({ code: rule.code as any, value: rule.code === 'CREDIT_SCORE' ? creditScore : rule.code === 'DTI_RATIO' ? dti : ltv, approveThreshold: Number(rule.approveThreshold), reviewThreshold: Number(rule.reviewThreshold) }));
    const recommendation = aggregateRecommendation(evals);
    const snapshot = { applicationNumber: app.applicationNumber, tenantId: app.tenantId, applicant: app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : null, grossMonthlyIncome, monthlyDebt, totalAssets, dti, ltv, creditScore, verifiedDocuments: app.documents.filter(d => d.status === 'VERIFIED').length, totalDocuments: app.documents.length };

    return this.prisma.$transaction(async tx => {
      const financial = await tx.financialAssessment.create({ data: { applicationId, grossMonthlyIncome, monthlyDebt, debtToIncomeRatio: dti, loanToValueRatio: ltv, totalAssets } });
      const run = await tx.underwritingRun.create({ data: { applicationId, recommendation: recommendation as Recommendation, policyVersion: rules[0]?.version ?? '2026.1', engineVersion: '0.2.0', inputSnapshot: snapshot, evaluations: { create: evals.map(e => ({ ruleCode: e.ruleCode, inputValue: e.inputValue, outcome: e.outcome, explanation: e.explanation })) } }, include: { evaluations: true } });
      await tx.mortgageApplication.update({ where: { id: applicationId }, data: { status: recommendation === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' : 'UNDERWRITING' } });
      await tx.auditEvent.create({ data: { applicationId, userId: context.userId, action: 'UNDERWRITING_EXECUTED', entityType: 'UnderwritingRun', entityId: run.id, details: { recommendation, financialAssessmentId: financial.id, tenantId: app.tenantId } } });
      return run;
    });
  }

  async decide(applicationId: string, dto: DecisionDto, context: AuthContext) {
    const app = await this.prisma.mortgageApplication.findFirst({ where: this.applicationWhere(applicationId, context), select: { id: true, tenantId: true } });
    if (!app) throw new NotFoundException('Application not found');
    const latestRun = await this.prisma.underwritingRun.findFirst({ where: { applicationId }, orderBy: { createdAt: 'desc' } });
    if (!latestRun) throw new BadRequestException('Run underwriting before making a decision');
    const mapped = dto.finalDecision === 'APPROVED' ? 'APPROVE' : dto.finalDecision === 'DECLINED' ? 'DECLINE' : 'MANUAL_REVIEW';
    const override = mapped !== latestRun.recommendation;
    return this.prisma.$transaction(async tx => {
      const decision = await tx.decision.create({ data: { applicationId, decidedById: context.userId, finalDecision: dto.finalDecision, systemRecommendation: latestRun.recommendation, reason: dto.reason, override } });
      const status = dto.finalDecision === 'APPROVED' ? 'FINAL_APPROVAL' : dto.finalDecision === 'DECLINED' ? 'DENIED' : 'CONDITIONS_PENDING';
      await tx.mortgageApplication.update({ where: { id: applicationId }, data: { status } });
      await tx.auditEvent.create({ data: { applicationId, userId: context.userId, action: 'FINAL_DECISION_RECORDED', entityType: 'Decision', entityId: decision.id, details: { finalDecision: dto.finalDecision, override, reason: dto.reason, tenantId: app.tenantId } } });
      return decision;
    });
  }
}
