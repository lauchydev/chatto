import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Group, GroupApi } from '../model/group.interface';

@Injectable({
  providedIn: 'root',
})
export class Groups {
  private http = inject(HttpClient);

  getUserGroups(): Observable<GroupApi[]> {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No user data found');
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    // Get group data
    return this.http.get<GroupApi[]>(`http://localhost:3000/api/groups?userId=${userId}`);
  }
}
