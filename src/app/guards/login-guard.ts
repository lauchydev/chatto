import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const loginGuard = () => {
  const router = inject(Router);
  const authService = inject(Auth);

  // If user is already authenticated redirect to dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['']);
    return false;
  }
  return true;
};
