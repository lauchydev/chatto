import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { UsersService } from './users.service';
import { User } from '../model/user.interface';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user'],
    password: 'password123',
    valid: true,
    banned: false,
    birthdate: new Date('1990-01-01'),
    image: 'default.jpg',
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 2,
      username: 'testuser2',
      email: 'test2@example.com',
      roles: ['user'],
      password: 'password456',
      valid: true,
      banned: false,
      birthdate: new Date('1985-05-15'),
      image: 'default.jpg',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
      const result = service.getCurrentUser();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.username).toBe(mockUser.username);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when no user in localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const result = service.getCurrentUser();
      expect(result).toBeNull();
    });

    it('should return null when localStorage data is invalid JSON', () => {
      spyOn(localStorage, 'getItem').and.returnValue('invalid json');
      spyOn(console, 'error');
      const result = service.getCurrentUser();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should fetch a single user by ID', () => {
      service.getUser(1).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should fetch multiple users by IDs', () => {
      const userIds = [1, 2];

      service.getUsers(userIds).subscribe((users) => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/?ids=1,2');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });
  });

  describe('getAllUsers', () => {
    it('should fetch all users', () => {
      service.getAllUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });
  });

  describe('updateUser', () => {
    it('should update a user', () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };

      service.updateUser(updatedUser).subscribe((user) => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedUser);
      req.flush(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', () => {
      service.deleteUser(1).subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockUser);
    });
  });

  describe('checkUsername', () => {
    it('should check if username exists', () => {
      const response = { exists: true };

      service.checkUsername('testuser').subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/check-username/testuser');
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });
});
