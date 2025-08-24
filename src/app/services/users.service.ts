import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { User } from '../model/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);

  // Get a single user by ID
  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`http://localhost:3000/api/users/${userId}`);
  }

  // Get multiple users by their ID's
  getUsers(userIds: number[]): Observable<User[]> {
    const users = userIds.join(',');
    return this.http.get<User[]>(`http://localhost:3000/api/users?ids=${users}`);
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error getting current user: ', error);
      return null;
    }
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`http://localhost:3000/api/users`);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`http://localhost:3000/api/users/${user.id}`, user);
  }

  deleteUser(userId: number): Observable<User> {
    return this.http.delete<User>(`http://localhost:3000/api/users/${userId}`);
  }
}
