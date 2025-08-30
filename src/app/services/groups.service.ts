import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Group, GroupApi } from '../model/group.interface';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class Groups {
  private http = inject(HttpClient);
  private _groups = signal<GroupApi[]>([]);
  private _loading = signal(false);
  private _error = signal('');
  private _selectedGroupId = signal<number | null>(null);
  private authService = inject(Auth);
  readonly groups = this._groups.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedGroupId = this._selectedGroupId.asReadonly();

  localurl = 'http://localhost:3000';

  getUserGroups(): Observable<GroupApi[]> {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No user data found');
    }
    const user = JSON.parse(userData);
    const userId = user.id;
    return this.http.get<GroupApi[]>(`${this.localurl}/api/groups?userId=${userId}`);
  }

  loadGroups(): void {
    this._loading.set(true);
    this._error.set('');

    this.getUserGroups().subscribe({
      next: (groups: GroupApi[]) => {
        this._groups.set(groups);
        if (!this._selectedGroupId() && groups && groups.length > 0) {
          this._selectedGroupId.set(groups[0].id);
        }
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Error loading groups: ', error);
        this._error.set('Failed loading groups');
        this._loading.set(false);
      },
    });
  }

  selectGroup(groupId: number): void {
    this._selectedGroupId.set(groupId);
  }

  isGroupSelected(groupId: number): boolean {
    return this._selectedGroupId() === groupId;
  }

  getSelectedGroup(): GroupApi | null {
    const selectedId = this._selectedGroupId();
    if (!selectedId) return null;
    return this._groups().find((group) => group.id === selectedId) || null;
  }

  getGroup(groupId: number): GroupApi | null {
    return this._groups().find((group) => group.id === groupId) || null;
  }

  // CRUD Operations (keep these - they belong here)
  createGroup(name: string, id: Number, image?: string): Observable<GroupApi> {
    return this.http.post<GroupApi>(`${this.localurl}/api/groups`, {
      id,
      name,
      image,
    });
  }

  updateGroup(group: GroupApi): Observable<GroupApi> {
    return this.http.put<GroupApi>(`${this.localurl}/api/groups/${group.id}`, group);
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.localurl}/api/groups/delete/${groupId}`);
  }

  leaveGroup(groupId: number): Observable<void> {
    const userId = this.authService.getUserId();
    if (!userId) {
      throw new Error('No user is logged in');
    }
    return this.http.delete<void>(`${this.localurl}/api/groups/${groupId}/users/${userId}`);
  }

  // Utility methods
  refreshGroups(): void {
    this.loadGroups();
  }

  clearSelection(): void {
    this._selectedGroupId.set(null);
  }

  isGroupAdmin(): boolean {
    const group = this.getSelectedGroup();
    const userId = this.authService.getUserId();
    if (!group) return false;

    if (userId) {
      return this.authService.isSuperAdmin() || group.admins.includes(userId);
    }
    return false;
  }
}
