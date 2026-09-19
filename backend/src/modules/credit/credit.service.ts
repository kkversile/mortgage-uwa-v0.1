import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';
import { MockCreditProvider } from './credit.provider';

@Injectable()
export class CreditService {
  private readonly provider = new MockCreditProvider();
  constructor(private readonly prisma: PrismaService) {}
  async run(applicationId: string, context: AuthContext) {
    const where = canAccessAllTenants(context) ? { id: applicationId } : { id: applicationId, tenantId: context.tenantId };
    const app = await this.prisma.mortgageApplication.findFirst({ where, include: { applicant: true, liabilities: true } });
    if (!app) throw new NotFoundException('Application not found');
    if (!app.applicant) throw new ForbiddenException('Application has no borrower identity');
    const outstandingDebt = app.liabilities.reduce((sum, item) => sum + Number(item.outstandingBalance), 0);
    const result = await this.provider.check({ email: app.applicant.email, outstandingDebt });
    const riskBand = result.score >= 740 ? 'VERY_GOOD' : result.score >= 700 ? 'GOOD' : result.score >= 650 ? 'FAIR' : 'WEAK';
    return this.prisma.$transaction(async tx => {
      const report = await tx.creditReport.create({ data: { applicationId, provider: 'MOCK_CREDIT_PROVIDER', creditScore: result.score, riskBand, latePayments: result.latePayments, openAccounts: result.tradelines.length, utilizationPct: result.utilizationPct, outstandingDebt, tradelines: { create: result.tradelines } }, include: { tradelines: true } });
      await tx.auditEvent.create({ data: { applicationId, userId: context.userId, action: 'CREDIT_CHECK_COMPLETED', entityType: 'CreditReport', entityId: report.id, details: { provider: 'MOCK_CREDIT_PROVIDER', tenantId: app.tenantId, tradelines: report.tradelines.length } } });
      return report;
    });
  }
}
