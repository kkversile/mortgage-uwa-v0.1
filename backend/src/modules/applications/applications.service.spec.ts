import { ApplicationsService } from './applications.service';

describe('ApplicationsService tenant scoping', () => {
  it('filters internal users by their authenticated tenant', async () => {
    const prisma: any = { mortgageApplication: { findMany: jest.fn().mockResolvedValue([]) } };
    const context = { id: 'user-a', userId: 'user-a', email: 'a@test', displayName: 'A', role: 'UNDERWRITER', accountType: 'INTERNAL' as const, tenantId: 'tenant-a', roles: ['UNDERWRITER'], permissions: [] };
    await new ApplicationsService(prisma).list(context);
    expect(prisma.mortgageApplication.findMany.mock.calls[0][0].where).toEqual({ tenantId: 'tenant-a' });
  });
  it('filters consumers by tenant and ownership', async () => {
    const prisma: any = { mortgageApplication: { findMany: jest.fn().mockResolvedValue([]) } };
    const context = { id: 'consumer-a', userId: 'consumer-a', email: 'a@test', displayName: 'A', role: 'READ_ONLY', accountType: 'CONSUMER' as const, tenantId: 'tenant-a', roles: ['READ_ONLY'], permissions: [] };
    await new ApplicationsService(prisma).list(context);
    expect(prisma.mortgageApplication.findMany.mock.calls[0][0].where).toEqual({ tenantId: 'tenant-a', consumerUserId: 'consumer-a' });
  });
});
