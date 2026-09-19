import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

@Injectable()
export class AusService {
  constructor(private readonly prisma: PrismaService) {}
  async run(applicationId: string, context: AuthContext) {
    if (context.accountType === 'CONSUMER') throw new ForbiddenException('AUS is not available in the consumer portal');
    const app = await this.prisma.mortgageApplication.findFirst({ where: canAccessAllTenants(context) ? { id: applicationId } : { id: applicationId, tenantId: context.tenantId }, include: { applicant: true, employment: true, property: true, liabilities: true, creditReports: { orderBy: { retrievedAt: 'desc' }, take: 1 }, financialAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 } } });
    if (!app) throw new NotFoundException('Application not found');
    const score = app.creditReports[0]?.creditScore ?? 0;
    const dti = Number(app.financialAssessments[0]?.debtToIncomeRatio ?? (app.employment ? app.liabilities.reduce((n, x) => n + Number(x.monthlyPayment), 0) / Number(app.employment.grossMonthlyIncome) * 100 : 999));
    const recommendation = score < 650 || dti > 45 ? 'DECLINE' : score < 700 || dti > 36 ? 'REFER' : 'ACCEPT';
    const request = { applicationNumber: app.applicationNumber, loanPurpose: app.loanPurpose, loanAmount: Number(app.requestedLoanAmount), propertyValue: Number(app.property?.estimatedValue ?? 0), creditScore: score, dti };
    const response = { recommendation, findings: recommendation === 'ACCEPT' ? ['No adverse demo findings'] : recommendation === 'REFER' ? ['Manual review of debt-to-income or credit profile'] : ['Demo AUS hard stop: credit or debt ratio outside policy'] };
    return this.prisma.$transaction(async tx => { const submission = await tx.ausSubmission.create({ data: { tenantId: app.tenantId!, applicationId, provider: 'DEMO_AUS', recommendation, requestJson: request, responseJson: response } }); await tx.auditEvent.create({ data: { applicationId, userId: context.userId, action: 'AUS_SUBMITTED', entityType: 'AusSubmission', entityId: submission.id, details: { provider: 'DEMO_AUS', recommendation, tenantId: app.tenantId } } }); return submission; });
  }
  list(applicationId: string, context: AuthContext) {
    if (context.accountType === 'CONSUMER') throw new ForbiddenException('AUS is not available in the consumer portal');
    return this.prisma.ausSubmission.findMany({ where: canAccessAllTenants(context) ? { applicationId } : { applicationId, tenantId: context.tenantId }, orderBy: { createdAt: 'desc' } });
  }
}
