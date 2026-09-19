import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConditionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

@Injectable()
export class ConditionsService {
  constructor(private readonly prisma: PrismaService) {}
  private async application(id: string, context: AuthContext) {
    const app = await this.prisma.mortgageApplication.findFirst({ where: canAccessAllTenants(context) ? { id } : { id, tenantId: context.tenantId, ...(context.accountType === 'CONSUMER' ? { consumerUserId: context.userId } : {}) }, select: { id: true, tenantId: true } });
    if (!app) throw new NotFoundException('Application not found');
    if (!app.tenantId) throw new ForbiddenException('Application has no tenant');
    return app;
  }
  async list(applicationId: string, context: AuthContext) { await this.application(applicationId, context); return this.prisma.underwritingCondition.findMany({ where: { applicationId }, orderBy: { createdAt: 'asc' }, include: { history: { orderBy: { createdAt: 'asc' } } } }); }
  async create(applicationId: string, body: { code: string; title: string; description: string; required?: boolean }, context: AuthContext) { const app = await this.application(applicationId, context); return this.prisma.$transaction(async tx => { const condition = await tx.underwritingCondition.create({ data: { tenantId: app.tenantId!, applicationId, code: body.code, title: body.title, description: body.description, required: body.required !== false, history: { create: { toStatus: ConditionStatus.OPEN, changedById: context.userId } } }, include: { history: true } }); await tx.mortgageApplication.update({ where: { id: applicationId }, data: { status: 'CONDITIONS_PENDING' } }); return condition; }); }
  async transition(id: string, status: ConditionStatus, context: AuthContext) { const condition = await this.prisma.underwritingCondition.findFirst({ where: canAccessAllTenants(context) ? { id } : { id, tenantId: context.tenantId, application: context.accountType === 'CONSUMER' ? { consumerUserId: context.userId } : undefined } }); if (!condition) throw new NotFoundException('Condition not found'); return this.prisma.$transaction(async tx => { const updated = await tx.underwritingCondition.update({ where: { id }, data: { status, satisfiedAt: status === ConditionStatus.SATISFIED ? new Date() : null }, include: { history: true } }); await tx.conditionHistory.create({ data: { conditionId: id, fromStatus: condition.status, toStatus: status, changedById: context.userId } }); await tx.auditEvent.create({ data: { applicationId: condition.applicationId, userId: context.userId, action: 'CONDITION_STATUS_CHANGED', entityType: 'UnderwritingCondition', entityId: id, details: { from: condition.status, to: status, tenantId: condition.tenantId } } }); return updated; }); }
}
