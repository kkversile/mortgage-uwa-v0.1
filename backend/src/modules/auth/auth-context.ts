export interface AuthContext {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  accountType: 'INTERNAL' | 'CONSUMER' | 'PLATFORM_ADMIN';
  portal?: string;
  tenantId?: string;
  membershipId?: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
}

export function canAccessAllTenants(context: AuthContext) {
  return context.accountType === 'PLATFORM_ADMIN';
}
