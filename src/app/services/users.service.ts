import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
}
