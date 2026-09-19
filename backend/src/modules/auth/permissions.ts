import { MembershipRole, Role } from '@prisma/client';

export const permissionsByRole: Record<string, string[]> = {
  TENANT_ADMIN: ['application.read', 'application.create', 'application.update', 'application.assign', 'document.read', 'document.upload', 'credit.read', 'verification.read', 'aus.read', 'underwriting.read', 'condition.create', 'condition.review', 'user.manage', 'branch.manage', 'policy.manage', 'audit.read'],
  LOAN_OFFICER: ['application.create', 'application.read', 'application.update', 'document.read', 'document.upload', 'credit.read', 'verification.read', 'aus.read', 'underwriting.read'],
  LOAN_PROCESSOR: ['application.read', 'application.update', 'document.read', 'document.upload', 'document.review', 'verification.read', 'verification.run', 'condition.review', 'task.manage'],
  UNDERWRITER: ['application.read', 'document.read', 'credit.run', 'credit.read', 'verification.read', 'aus.run', 'aus.read', 'underwriting.run', 'underwriting.read', 'condition.create', 'condition.review', 'decision.approve', 'decision.deny'],
  SENIOR_UNDERWRITER: ['application.read', 'document.read', 'credit.run', 'credit.read', 'verification.read', 'aus.run', 'aus.read', 'underwriting.run', 'underwriting.read', 'condition.create', 'condition.review', 'decision.approve', 'decision.deny', 'decision.suspend'],
  UNDERWRITING_MANAGER: ['application.read', 'application.assign', 'document.read', 'credit.run', 'credit.read', 'verification.read', 'aus.run', 'aus.read', 'underwriting.run', 'underwriting.read', 'condition.create', 'condition.review', 'decision.approve', 'decision.deny', 'decision.suspend', 'policy.manage'],
  AUDITOR: ['application.read', 'document.read', 'credit.read', 'verification.read', 'aus.read', 'underwriting.read', 'audit.read'],
  READ_ONLY: ['application.read', 'document.read', 'credit.read', 'verification.read', 'aus.read', 'underwriting.read'],
};

export function permissionsFor(roles: Array<MembershipRole | Role | string>) {
  return [...new Set(roles.flatMap(role => permissionsByRole[role] ?? (role === Role.ADMIN ? ['*'] : [])))];
}
