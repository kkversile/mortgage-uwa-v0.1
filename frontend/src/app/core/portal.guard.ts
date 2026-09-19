import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export function portalGuard(portal: 'consumer' | 'operations' | 'admin'): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user() as any;
    if (!auth.isLoggedIn()) return router.parseUrl('/login');
    if (user?.portal === portal || (portal === 'operations' && user?.accountType === 'INTERNAL')) return true;
    return router.parseUrl(user?.portal === 'consumer' ? '/consumer/dashboard' : user?.portal === 'admin' ? '/admin/overview' : '/operations/dashboard');
  };
}
