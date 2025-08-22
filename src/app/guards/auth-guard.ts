import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // If user is not authenticated redirect to login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  } else {
    return true;
  }
};
