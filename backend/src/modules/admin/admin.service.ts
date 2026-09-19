import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext } from '../auth/auth-context';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  private async assertAdmin(context: AuthContext) {
    if (context.accountType === 'PLATFORM_ADMIN') return;
    if (!context.tenantId || !context.roles.includes('TENANT_ADMIN')) throw new ForbiddenException('Tenant administration permission is required');
  }
  async overview(context: AuthContext) {
    await this.assertAdmin(context);
    const tenantWhere = context.accountType === 'PLATFORM_ADMIN' ? {} : { id: context.tenantId };
    const applicationWhere = context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId };
    const [tenants, branches, products, policies, users, applications] = await Promise.all([
      this.prisma.tenant.findMany({ where: tenantWhere, orderBy: { name: 'asc' }, include: { _count: { select: { applications: true, memberships: true, branches: true } } } }),
      this.prisma.branch.findMany({ where: context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }, orderBy: [{ tenantId: 'asc' }, { code: 'asc' }], include: { tenant: { select: { name: true, code: true } } } }),
      this.prisma.loanProduct.findMany({ where: context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }, orderBy: { code: 'asc' }, include: { tenant: { select: { name: true, code: true } } } }),
      this.prisma.underwritingRule.findMany({ where: context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }, orderBy: [{ tenantId: 'asc' }, { code: 'asc' }, { version: 'desc' }], include: { tenant: { select: { name: true, code: true } } } }),
      this.prisma.user.findMany({ where: { memberships: { some: { active: true, ...(context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }) } } }, select: { id: true, email: true, displayName: true, accountType: true, active: true, memberships: { where: { active: true, ...(context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }) }, include: { tenant: { select: { name: true, code: true } }, branch: { select: { name: true, code: true } } } } }, orderBy: { displayName: 'asc' } }),
      this.prisma.mortgageApplication.count({ where: applicationWhere }),
    ]);
    return { tenants, branches, products, policies, users, applications };
  }

  async users(context: AuthContext) {
    await this.assertAdmin(context);
    return this.prisma.user.findMany({
      where: { memberships: { some: { active: true, ...(context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }) } } },
      select: {
        id: true,
        email: true,
        displayName: true,
        accountType: true,
        active: true,
        memberships: {
          where: { active: true, ...(context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId }) },
          include: {
            tenant: { select: { id: true, name: true, code: true } },
            branch: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async branches(context: AuthContext) {
    await this.assertAdmin(context);
    return this.prisma.branch.findMany({
      where: context.accountType === 'PLATFORM_ADMIN' ? {} : { tenantId: context.tenantId },
      orderBy: [{ tenantId: 'asc' }, { code: 'asc' }],
      include: { tenant: { select: { id: true, name: true, code: true } } },
    });
  }
}
