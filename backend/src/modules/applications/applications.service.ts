import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(context: AuthContext) {
    if (canAccessAllTenants(context)) return {};
    if (context.accountType === 'CONSUMER') return { tenantId: context.tenantId, consumerUserId: context.userId };
    if (!context.tenantId) throw new ForbiddenException('An active lender membership is required');
    return { tenantId: context.tenantId };
  }

  list(context: AuthContext) {
    return this.prisma.mortgageApplication.findMany({
      where: this.scope(context),
      orderBy: { updatedAt: 'desc' },
      include: { applicant: true, branch: true, channel: true, tenant: true, loan: true, documents: true, underwriter: { select: { displayName: true } }, creditReports: { orderBy: { retrievedAt: 'desc' }, take: 1 }, financialAssessments: { orderBy: { calculatedAt: 'desc' }, take: 1 } },
    });
  }

  async get(id: string, context: AuthContext) {
    const app = await this.prisma.mortgageApplication.findFirst({
      where: { id, ...this.scope(context) },
      include: {
        applicant: true, employment: true, liabilities: true, assets: true, property: true, loan: { include: { loanProduct: true } }, documents: true, tasks: { orderBy: { createdAt: 'desc' } }, conditions: { orderBy: { createdAt: 'asc' }, include: { history: { orderBy: { createdAt: 'asc' } } } }, ausSubmissions: { orderBy: { createdAt: 'desc' } },
        tenant: true, branch: true, channel: true,
        loanOfficer: { select: { displayName: true, email: true } }, underwriter: { select: { displayName: true, email: true } }, processor: { select: { displayName: true, email: true } },
        creditReports: { orderBy: { retrievedAt: 'desc' }, include: { tradelines: true } }, financialAssessments: { orderBy: { calculatedAt: 'desc' } },
        underwritingRuns: { orderBy: { createdAt: 'desc' }, include: { evaluations: true } }, decisions: { orderBy: { createdAt: 'desc' }, include: { decidedBy: { select: { displayName: true } } } },
        auditEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async create(dto: CreateApplicationDto, context: AuthContext) {
    if (!context.tenantId) throw new ForbiddenException('Select an active lender workspace before creating an application');
    const year = new Date().getFullYear();
    return this.prisma.$transaction(async tx => {
      const tenant = await tx.tenant.findUnique({ where: { id: context.tenantId! }, include: { branches: { where: { active: true }, orderBy: { code: 'asc' } }, channels: { where: { active: true }, orderBy: { code: 'asc' } }, products: { where: { active: true }, orderBy: { code: 'asc' } } } });
      if (!tenant || tenant.status !== 'ACTIVE') throw new ForbiddenException('Lender workspace is not active');
      const branch = tenant.branches.find(item => item.id === context.branchId) ?? tenant.branches[0];
      const channel = tenant.channels.find(item => item.code === 'RETAIL') ?? tenant.channels[0];
      const product = tenant.products.find(item => item.loanPurpose === dto.loanPurpose) ?? tenant.products[0];
      const sequence = await tx.tenantSequence.upsert({ where: { tenantId_year: { tenantId: tenant.id, year } }, update: { value: { increment: 1 } }, create: { tenantId: tenant.id, year, value: 1 } });
      const applicationNumber = `${tenant.code}-${year}-${String(sequence.value).padStart(6, '0')}`;
      const app = await tx.mortgageApplication.create({
        data: {
          applicationNumber, status: 'APPLICATION_STARTED', tenantId: tenant.id, branchId: branch?.id, channelId: channel?.id, consumerUserId: context.accountType === 'CONSUMER' ? context.userId : undefined,
          requestedLoanAmount: dto.requestedLoanAmount, loanPurpose: dto.loanPurpose, loanOfficerId: context.accountType === 'CONSUMER' ? undefined : context.userId,
          applicant: { create: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email, country: 'USA' } },
          employment: { create: { employmentType: 'SALARIED', employerName: 'To be verified', monthsEmployed: 0, annualIncome: dto.grossMonthlyIncome * 12, grossMonthlyIncome: dto.grossMonthlyIncome } },
          liabilities: { create: [{ type: 'DECLARED_DEBT', outstandingBalance: dto.monthlyDebt * 12, monthlyPayment: dto.monthlyDebt }] },
          property: { create: { address: 'To be confirmed', propertyType: 'SINGLE_FAMILY', purchasePrice: dto.propertyValue, estimatedValue: dto.propertyValue, occupancyType: dto.occupancyType } },
          loan: { create: { termMonths: 360, interestRate: 6.5, downPayment: Math.max(dto.propertyValue - dto.requestedLoanAmount, 0), productName: product?.name ?? 'Conventional 30-year fixed', loanProductId: product?.id } },
        },
      });
      await tx.auditEvent.create({ data: { applicationId: app.id, userId: context.userId, action: 'APPLICATION_CREATED', entityType: 'MortgageApplication', entityId: app.id, details: { source: 'v02-intake', tenantId: tenant.id, applicationNumber } } });
      return app;
    });
  }
}
