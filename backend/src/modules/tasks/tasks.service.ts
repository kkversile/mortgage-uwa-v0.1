import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthContext, canAccessAllTenants } from '../auth/auth-context';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}
  private async application(id: string, context: AuthContext) {
    const where = canAccessAllTenants(context) ? { id } : { id, tenantId: context.tenantId };
    const app = await this.prisma.mortgageApplication.findFirst({ where, select: { id: true, tenantId: true } });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }
  list(context: AuthContext) {
    if (context.accountType === 'CONSUMER') throw new ForbiddenException('Operations tasks are not available in the consumer portal');
    return this.prisma.loanTask.findMany({ where: canAccessAllTenants(context) ? {} : { tenantId: context.tenantId }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], include: { application: { select: { applicationNumber: true, applicant: true, status: true } } } });
  }
  async create(applicationId: string, input: { type: string; title: string; description: string; priority?: TaskPriority; assignedToId?: string }, context: AuthContext) {
    if (context.accountType === 'CONSUMER') throw new ForbiddenException('Operations tasks are not available in the consumer portal');
    const app = await this.application(applicationId, context);
    if (!app.tenantId) throw new ForbiddenException('Application has no tenant');
    return this.prisma.loanTask.create({ data: { applicationId, tenantId: app.tenantId, type: input.type, title: input.title, description: input.description, priority: input.priority ?? TaskPriority.NORMAL, assignedToId: input.assignedToId } });
  }
  async complete(id: string, context: AuthContext) {
    if (context.accountType === 'CONSUMER') throw new ForbiddenException('Operations tasks are not available in the consumer portal');
    const task = await this.prisma.loanTask.findFirst({ where: canAccessAllTenants(context) ? { id } : { id, tenantId: context.tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.loanTask.update({ where: { id }, data: { status: TaskStatus.COMPLETED, completedAt: new Date() } });
  }
}
