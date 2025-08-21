import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // If user is already authenticated redirect to dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['']);
    return false;
  } else {
    return true;
  }
};
