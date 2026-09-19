import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async get(context: AuthContext) {
    const where = canAccessAllTenants(context) ? {} : context.accountType === 'CONSUMER' ? { tenantId: context.tenantId, consumerUserId: context.userId } : { tenantId: context.tenantId };
    const [total, approved, declined, manualReview, ready, recent] = await Promise.all([
      this.prisma.mortgageApplication.count({ where }),
      this.prisma.mortgageApplication.count({ where: { ...where, status: { in: ['APPROVED', 'FINAL_APPROVAL', 'FUNDED', 'COMPLETED'] } } }),
      this.prisma.mortgageApplication.count({ where: { ...where, status: { in: ['DECLINED', 'DENIED'] } } }),
      this.prisma.mortgageApplication.count({ where: { ...where, status: { in: ['MANUAL_REVIEW', 'UNDER_REVIEW', 'CONDITIONS_REVIEW'] } } }),
      this.prisma.mortgageApplication.count({ where: { ...where, status: { in: ['UNDERWRITING_READY', 'READY_FOR_UNDERWRITING'] } } }),
      this.prisma.mortgageApplication.findMany({ where, take: 6, orderBy: { updatedAt: 'desc' }, include: { applicant: true, tenant: true, branch: true, underwriter: { select: { displayName: true } } } }),
    ]);
    return { metrics: { total, approved, declined, manualReview, ready }, recent };
  }
}
