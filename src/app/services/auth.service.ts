import { Injectable, inject } from '@angular/core';
import { UsersService } from './users.service';
import { User } from '../model/user.interface';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private usersService = inject(UsersService);

  getCurrentUser(): User | null {
    return this.usersService.getCurrentUser();
  }

  isAuthenticated(): boolean {
    let userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const valid: boolean = user.valid;
      return valid;
    }
    return false;
  }

  isSuperAdmin(): boolean {
    const user = this.usersService.getCurrentUser();
    return user?.roles?.includes('superadmin') === true;
  }

  isGroupAdmin(): boolean {
    const user = this.usersService.getCurrentUser();
    return user?.roles?.includes('groupadmin') === true;
  }

  hasRole(role: string): boolean {
    const user = this.usersService.getCurrentUser();
    return user?.roles?.includes(role) === true;
  }

  getUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }
}
