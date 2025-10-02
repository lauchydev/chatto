import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { Auth } from './auth.service';

describe('Auth', () => {
  let service: Auth;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    service = TestBed.inject(Auth);
    router = TestBed.inject(Router);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should return true for valid authenticated user', () => {
      const mockUser = { id: 1, username: 'test', valid: true, banned: false };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isAuthenticated()).toBeTruthy();
    });

    it('should return false for invalid user', () => {
      const mockUser = { id: 1, username: 'test', valid: false, banned: false };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isAuthenticated()).toBeFalsy();
    });
  });

  describe('role checking', () => {
    it('should return true for super admin user', () => {
      const mockUser = { id: 1, username: 'admin', roles: ['superadmin'] };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isSuperAdmin()).toBeTruthy();
    });

    it('should check specific roles correctly', () => {
      const mockUser = { id: 1, username: 'user', roles: ['user', 'moderator'] };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.hasRole('user')).toBeTruthy();
      expect(service.hasRole('moderator')).toBeTruthy();
      expect(service.hasRole('admin')).toBeFalsy();
    });
  });

  describe('getUserId', () => {
    it('should return user ID when user exists', () => {
      const mockUser = { id: 123, username: 'test' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.getUserId()).toBe(123);
    });

    it('should return null when no user exists', () => {
      expect(service.getUserId()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage and navigate to login', () => {
      const navigateSpy = spyOn(router, 'navigate');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }));

      service.logout();

      expect(localStorage.getItem('user')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });
  });
});
