import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Group, GroupApi } from '../model/group.interface';
import { Auth } from './auth.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class Groups {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private _groups = signal<GroupApi[]>([]);
  private _loading = signal(false);
  private _error = signal('');
  private _selectedGroupId = signal<number | null>(null);
  private authService = inject(Auth);
  private groupsRefreshedSubject = new Subject<void>();
  readonly groups = this._groups.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedGroupId = this._selectedGroupId.asReadonly();

  localurl = 'http://localhost:3000';

  constructor() {
    this.socketService.onGroupsUpdated().subscribe(() => {
      this.refreshGroups();
    });

    this.socketService.onGroupCreated().subscribe((group: GroupApi) => {
      this._groups.update((prev) => [...prev, group]);
    });

    this.socketService.onGroupDeleted().subscribe((data: any) => {
      const wasSelected = this._selectedGroupId() === data.groupId;
      this._groups.update((prev) => prev.filter((g) => g.id !== data.groupId));
      if (wasSelected) {
        const next = this._groups()[0]?.id ?? null;
        this._selectedGroupId.set(next);
      }
    });

    this.socketService.onUserJoinedGroup().subscribe(() => {
      this.refreshGroups();
    });

    /* Switch view to another group if they were kicked from currently selected group */
    this.socketService.onUserKicked().subscribe((data: any) => {
      const currentUserId = this.authService.getUserId();
      const currentSelectedGroupId = this._selectedGroupId();

      if (
        currentUserId &&
        data.userId === currentUserId &&
        data.groupId === currentSelectedGroupId
      ) {
        this.switchToFirstAvailableGroup();
      }

      this.refreshGroups();
    });

    /* Switch view to another group if they were banned from the currently selected group */
    this.socketService.onUserBanned().subscribe((data: any) => {
      const currentUserId = this.authService.getUserId();
      const currentSelectedGroupId = this._selectedGroupId();

      if (
        currentUserId &&
        data.userId === currentUserId &&
        data.groupId === currentSelectedGroupId
      ) {
        this.switchToFirstAvailableGroup();
      }

      this.refreshGroups();
    });

    this.socketService.onUserUnbanned().subscribe((data: any) => {
      this.refreshGroups();
    });

    this.socketService.onNewJoinRequest().subscribe((data: any) => {
      this.refreshGroups();
    });

    this.socketService.onJoinRequestSent().subscribe((data: any) => {
      console.log('Join request sent successfully');
    });

    this.socketService.onJoinRequestRejected().subscribe((data: any) => {
      this.refreshGroups();
    });

    this.socketService.onUserLeftGroup().subscribe((data: any) => {
      this.refreshGroups();
    });

    this.socketService.onOperationError().subscribe((error: string) => {
      console.error('Group operation error:', error);
      this._error.set(error);
    });
  }

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
        // Restore last selected group if available and valid
        const saved = localStorage.getItem('selectedGroupId');
        const savedId = saved ? parseInt(saved) : NaN;
        const hasSaved = Number.isInteger(savedId) && groups.some((g) => g.id === savedId);
        if (hasSaved) {
          this._selectedGroupId.set(savedId);
        } else if (!this._selectedGroupId() && groups && groups.length > 0) {
          this._selectedGroupId.set(groups[0].id);
        }
        this._loading.set(false);
        this.groupsRefreshedSubject.next();
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
    try {
      localStorage.setItem('selectedGroupId', String(groupId));
    } catch {}
  }

  isGroupSelected(groupId: number): boolean {
    return this._selectedGroupId() === groupId;
  }

  getSelectedGroup(): GroupApi | null {
    const selectedId = this._selectedGroupId();
    if (!selectedId) return null;
    return this._groups().find((group) => group.id === selectedId) || null;
  }

  getDiscoverGroups(): Observable<GroupApi[]> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No user is logged in');
    return this.http.get<GroupApi[]>(`${this.localurl}/api/groups/discover?userId=${userId}`);
  }

  getGroup(groupId: number): GroupApi | null {
    return this._groups().find((group) => group.id === groupId) || null;
  }

  createGroup(name: string, ownerId: number, image?: string): void {
    this.socketService.createGroup(name, ownerId, image);
  }

  updateGroup(group: GroupApi): Observable<GroupApi> {
    return this.http.put<GroupApi>(`${this.localurl}/api/groups/${group.id}`, group);
  }

  deleteGroup(groupId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.socketService.deleteGroup(groupId, currentUser.id);
  }

  leaveGroup(groupId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      throw new Error('No user is logged in');
    }
    this.socketService.leaveGroup(groupId, userId);
  }

  refreshGroups(): void {
    this.loadGroups();
  }

  clearSelection(): void {
    this._selectedGroupId.set(null);
  }

  /* Logic to swap view */
  switchToFirstAvailableGroup(): void {
    const currentGroups = this._groups();
    if (currentGroups && currentGroups.length > 0) {
      this.selectGroup(currentGroups[0].id);
    } else {
      this.clearSelection();
    }
  }

  onGroupsRefreshed(): Observable<void> {
    return this.groupsRefreshedSubject.asObservable();
  }

  /**
   *
   *  USER OPERATIONS
   *
   */

  kickUser(groupId: number, userId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    this.socketService.kickUser(groupId, userId, currentUser.id);
  }

  banUser(groupId: number, userId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    this.socketService.banUser(groupId, userId, currentUser.id);
  }

  unbanUser(groupId: number, userId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.socketService.unbanUser(groupId, userId, currentUser.id);
  }

  /**
   *
   *  USER HELPER FUNCTIONS
   *
   */
  isGroupAdmin(): boolean {
    const group = this.getSelectedGroup();
    const userId = this.authService.getUserId();
    if (!group) return false;

    if (userId) {
      return this.authService.isSuperAdmin() || group.admins.includes(userId);
    }
    return false;
  }

  rejectRequest(groupId: number, userId: number): void {
    this.socketService.rejectJoinRequest(groupId, userId);
  }

  approveRequest(groupId: number, userId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    this.socketService.approveJoinRequest(groupId, userId, currentUser.id);
  }

  requestToJoin(groupId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No user is logged in');
    this.socketService.joinGroupRequest(groupId, userId);
  }
}
