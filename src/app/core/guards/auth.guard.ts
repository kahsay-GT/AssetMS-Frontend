import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Redirects unauthenticated users to /login */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Redirects already-authenticated users away from /login to /dashboard */
export const loggedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

/** Restricts access to users with specific roles */
export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn) { router.navigate(['/login']); return false; }
    if (auth.hasAnyRole(...roles)) return true;
    router.navigate(['/403']);
    return false;
  };
};
