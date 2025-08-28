import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth)
  const router = inject(Router);

  // If user is not authenticated redirect to login
  if (!authService.isSuperAdmin()) {
    router.navigate(['/']);
    return false;
  } else {
    return true;
  }
};
