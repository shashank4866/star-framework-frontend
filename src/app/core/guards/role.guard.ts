import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const auth = inject(AuthService);

    return auth.checkAuth().pipe(
      take(1),
      map((user: any) => {
        if (user && allowedRoles.includes(user.roleName)) return true;
        return router.createUrlTree(['/dashboard']);
      })
    );
  };
};
