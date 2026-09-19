import { PrismaClient, Role, ApplicationStatus, DocumentStatus, RuleMetric, MembershipRole, AccountType, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const password = 'Mortgage@123';

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const users = [
    ['admin@mortgage-uwa.local', 'System Admin', Role.ADMIN, AccountType.PLATFORM_ADMIN],
    ['loan.officer@mortgage-uwa.local', 'Olivia Carter', Role.LOAN_OFFICER, AccountType.INTERNAL],
    ['underwriter@mortgage-uwa.local', 'Sarah Williams', Role.UNDERWRITER, AccountType.INTERNAL],
    ['manager@mortgage-uwa.local', 'Daniel Brooks', Role.UNDERWRITING_MANAGER, AccountType.INTERNAL],
    ['auditor@mortgage-uwa.local', 'Ava Thompson', Role.AUDITOR, AccountType.INTERNAL],
    ['processor@mortgage-uwa.local', 'Priya Shah', Role.READ_ONLY, AccountType.INTERNAL],
    ['consumer@mortgage-uwa.local', 'Alex Morgan', Role.READ_ONLY, AccountType.CONSUMER],
    ['tenant.admin@mortgage-uwa.local', 'Jordan Lee', Role.ADMIN, AccountType.INTERNAL],
    ['second.underwriter@mortgage-uwa.local', 'Taylor Brooks', Role.UNDERWRITER, AccountType.INTERNAL],
  ] as const;
  for (const [email, displayName, role, accountType] of users) {
    await prisma.user.upsert({ where: { email }, update: { displayName, role, accountType, passwordHash, active: true }, create: { email, displayName, role, accountType, passwordHash } });
  }

  const dcb = await prisma.tenant.upsert({ where: { code: 'DCB' }, update: { name: 'Demo Community Bank', slug: 'demo-community-bank', status: TenantStatus.ACTIVE }, create: { id: 'tenant-demo-community-bank', code: 'DCB', slug: 'demo-community-bank', name: 'Demo Community Bank', status: TenantStatus.ACTIVE } });
  const fnm = await prisma.tenant.upsert({ where: { code: 'FNM' }, update: { name: 'First National Mortgage', slug: 'first-national-mortgage', status: TenantStatus.ACTIVE }, create: { id: 'tenant-first-national-mortgage', code: 'FNM', slug: 'first-national-mortgage', name: 'First National Mortgage', status: TenantStatus.ACTIVE } });
  const dcbAustin = await prisma.branch.upsert({ where: { tenantId_code: { tenantId: dcb.id, code: 'AUSTIN' } }, update: { name: 'Austin Central', active: true }, create: { id: 'branch-dcb-austin', tenantId: dcb.id, code: 'AUSTIN', name: 'Austin Central', city: 'Austin', state: 'TX' } });
  await prisma.branch.upsert({ where: { tenantId_code: { tenantId: dcb.id, code: 'DALLAS' } }, update: { name: 'Dallas North', active: true }, create: { id: 'branch-dcb-dallas', tenantId: dcb.id, code: 'DALLAS', name: 'Dallas North', city: 'Dallas', state: 'TX' } });
  const fnmDenver = await prisma.branch.upsert({ where: { tenantId_code: { tenantId: fnm.id, code: 'DENVER' } }, update: { name: 'Denver Main', active: true }, create: { id: 'branch-fnm-denver', tenantId: fnm.id, code: 'DENVER', name: 'Denver Main', city: 'Denver', state: 'CO' } });
  const dcbRetail = await prisma.businessChannel.upsert({ where: { tenantId_code: { tenantId: dcb.id, code: 'RETAIL' } }, update: { name: 'Retail', active: true }, create: { id: 'channel-dcb-retail', tenantId: dcb.id, code: 'RETAIL', name: 'Retail' } });
  const fnmRetail = await prisma.businessChannel.upsert({ where: { tenantId_code: { tenantId: fnm.id, code: 'RETAIL' } }, update: { name: 'Retail', active: true }, create: { id: 'channel-fnm-retail', tenantId: fnm.id, code: 'RETAIL', name: 'Retail' } });
  const dcbProduct = await prisma.loanProduct.upsert({ where: { tenantId_code: { tenantId: dcb.id, code: 'CONVENTIONAL_30_FIXED' } }, update: { active: true }, create: { id: 'product-dcb-conventional', tenantId: dcb.id, code: 'CONVENTIONAL_30_FIXED', name: 'Conventional 30-year fixed', productType: 'CONVENTIONAL', loanPurpose: 'PURCHASE' } });
  await prisma.loanProduct.upsert({ where: { tenantId_code: { tenantId: fnm.id, code: 'CONVENTIONAL_30_FIXED' } }, update: { active: true }, create: { id: 'product-fnm-conventional', tenantId: fnm.id, code: 'CONVENTIONAL_30_FIXED', name: 'Conventional 30-year fixed', productType: 'CONVENTIONAL', loanPurpose: 'PURCHASE' } });

  const user = async (email: string) => prisma.user.findUniqueOrThrow({ where: { email } });
  const membership = async (email: string, tenantId: string, role: MembershipRole, branchId?: string) => prisma.tenantMembership.upsert({ where: { tenantId_userId_role: { tenantId, userId: (await user(email)).id, role } }, update: { active: true, branchId }, create: { tenantId, userId: (await user(email)).id, role, branchId } });
  await membership('admin@mortgage-uwa.local', dcb.id, MembershipRole.TENANT_ADMIN, dcbAustin.id);
  await membership('tenant.admin@mortgage-uwa.local', dcb.id, MembershipRole.TENANT_ADMIN, dcbAustin.id);
  await membership('loan.officer@mortgage-uwa.local', dcb.id, MembershipRole.LOAN_OFFICER, dcbAustin.id);
  await membership('underwriter@mortgage-uwa.local', dcb.id, MembershipRole.UNDERWRITER, dcbAustin.id);
  await membership('manager@mortgage-uwa.local', dcb.id, MembershipRole.UNDERWRITING_MANAGER, dcbAustin.id);
  await membership('auditor@mortgage-uwa.local', dcb.id, MembershipRole.AUDITOR, dcbAustin.id);
  await membership('processor@mortgage-uwa.local', dcb.id, MembershipRole.LOAN_PROCESSOR, dcbAustin.id);
  await membership('consumer@mortgage-uwa.local', dcb.id, MembershipRole.READ_ONLY, dcbAustin.id);
  await membership('second.underwriter@mortgage-uwa.local', fnm.id, MembershipRole.UNDERWRITER, fnmDenver.id);
  const consumer = await user('consumer@mortgage-uwa.local');
  const consumerApplication = await prisma.mortgageApplication.findUnique({ where: { applicationNumber: 'MUA-2026-000001' } });
  if (consumerApplication && consumerApplication.consumerUserId !== consumer.id) await prisma.mortgageApplication.update({ where: { id: consumerApplication.id }, data: { consumerUserId: consumer.id } });

  const rules = [
    { code: 'CREDIT_SCORE', name: 'Credit score', metric: RuleMetric.CREDIT_SCORE, approveThreshold: 700, reviewThreshold: 650, version: '2026.1' },
    { code: 'DTI_RATIO', name: 'Debt-to-income ratio', metric: RuleMetric.DTI_RATIO, approveThreshold: 36, reviewThreshold: 45, version: '2026.1' },
    { code: 'LTV_RATIO', name: 'Loan-to-value ratio', metric: RuleMetric.LTV_RATIO, approveThreshold: 80, reviewThreshold: 90, version: '2026.1' },
  ];
  for (const tenant of [dcb, fnm]) for (const rule of rules) await prisma.underwritingRule.upsert({ where: { tenantId_code_version: { tenantId: tenant.id, code: rule.code, version: rule.version } }, update: { ...rule, tenantId: tenant.id }, create: { ...rule, tenantId: tenant.id } });

  const existing = await prisma.mortgageApplication.findUnique({ where: { applicationNumber: 'FNM-2026-000001' } });
  if (!existing) {
    const app = await prisma.mortgageApplication.create({ data: {
      applicationNumber: 'FNM-2026-000001', status: ApplicationStatus.READY_FOR_UNDERWRITING, tenantId: fnm.id, branchId: fnmDenver.id, channelId: fnmRetail.id, requestedLoanAmount: 280000, loanPurpose: 'PURCHASE', loanOfficerId: (await user('second.underwriter@mortgage-uwa.local')).id,
      applicant: { create: { firstName: 'Casey', lastName: 'Nguyen', email: 'casey.nguyen@example.test', country: 'USA', city: 'Denver', state: 'CO' } },
      employment: { create: { employmentType: 'SALARIED', employerName: 'Synthetic Mountain Labs', jobTitle: 'Product Manager', monthsEmployed: 48, annualIncome: 132000, grossMonthlyIncome: 11000, otherMonthlyIncome: 0 } },
      liabilities: { create: [{ type: 'EXISTING_DEBT', outstandingBalance: 24000, monthlyPayment: 1200 }] },
      assets: { create: [{ type: 'SAVINGS', institution: 'Synthetic First Bank', currentValue: 70000 }] },
      property: { create: { address: '200 Demo Mountain Way, Denver, CO', propertyType: 'SINGLE_FAMILY', purchasePrice: 350000, estimatedValue: 350000, occupancyType: 'PRIMARY_RESIDENCE' } },
      loan: { create: { termMonths: 360, interestRate: 6.5, downPayment: 70000, productName: 'Conventional 30-year fixed', loanProductId: (await prisma.loanProduct.findUniqueOrThrow({ where: { id: 'product-fnm-conventional' } })).id } },
      creditReports: { create: { creditScore: 735, riskBand: 'GOOD', latePayments: 0, openAccounts: 5, utilizationPct: 24, outstandingDebt: 24000 } },
      auditEvents: { create: { action: 'APPLICATION_SEEDED', entityType: 'MortgageApplication', details: { source: 'synthetic-demo', tenant: fnm.slug } } },
    } });
    console.log(`Seeded ${app.applicationNumber}`);
  }

  for (const application of await prisma.mortgageApplication.findMany({ where: { tenantId: dcb.id }, include: { loan: true } })) {
    await prisma.mortgageApplication.update({ where: { id: application.id }, data: { branchId: application.branchId ?? dcbAustin.id, channelId: application.channelId ?? dcbRetail.id } });
    if (application.loan) await prisma.loan.update({ where: { id: application.loan.id }, data: { loanProductId: application.loan.loanProductId ?? dcbProduct.id } });
  }
  for (const report of await prisma.creditReport.findMany({ include: { tradelines: true } })) {
    if (report.tradelines.length) continue;
    await prisma.creditTradeline.createMany({ data: [
      { creditReportId: report.id, creditorName: 'Synthetic Auto Finance', accountType: 'INSTALLMENT', balance: Math.max(Number(report.outstandingDebt) * .55, 1000), creditLimit: 0, monthlyPayment: 420, latePayments: report.latePayments > 0 ? 1 : 0 },
      { creditReportId: report.id, creditorName: 'Synthetic Card Services', accountType: 'REVOLVING', balance: Math.max(Number(report.outstandingDebt) * .45, 1000), creditLimit: 30000, monthlyPayment: 280, latePayments: report.latePayments > 0 ? report.latePayments - 1 : 0 },
    ] });
  }
  console.log('Seeded V0.2 tenants, memberships, products, rules and demo scenarios');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
