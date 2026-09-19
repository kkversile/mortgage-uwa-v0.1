import { ApplicationWorkflowService } from './application-workflow.service';

describe('ApplicationWorkflowService', () => {
  const context = { id: 'user-a', userId: 'user-a', email: 'a@test', displayName: 'A', role: 'UNDERWRITER', accountType: 'INTERNAL' as const, tenantId: 'tenant-a', roles: ['UNDERWRITER'], permissions: [] };
  it('allows the submitted transition and audits it', async () => {
    const prisma: any = { mortgageApplication: { findFirst: jest.fn().mockResolvedValue({ id: 'app-a', status: 'APPLICATION_STARTED', tenantId: 'tenant-a' }), update: jest.fn().mockResolvedValue({ id: 'app-a', status: 'APPLICATION_SUBMITTED' }) }, auditEvent: { create: jest.fn() }, $transaction: jest.fn(async (fn: any) => fn(prisma)) };
    const result = await new ApplicationWorkflowService(prisma).transition('app-a', 'APPLICATION_SUBMITTED' as any, context);
    expect(result.status).toBe('APPLICATION_SUBMITTED');
    expect(prisma.mortgageApplication.findFirst).toHaveBeenCalledWith({ where: { id: 'app-a', tenantId: 'tenant-a' }, select: { id: true, status: true, tenantId: true } });
    expect(prisma.auditEvent.create).toHaveBeenCalled();
  });
  it('rejects invalid transitions', async () => {
    const prisma: any = { mortgageApplication: { findFirst: jest.fn().mockResolvedValue({ id: 'app-a', status: 'DENIED', tenantId: 'tenant-a' }) } };
    await expect(new ApplicationWorkflowService(prisma).transition('app-a', 'APPLICATION_STARTED' as any, context)).rejects.toThrow('Invalid application transition');
  });
});
