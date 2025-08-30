import { Component, inject } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Auth } from '../../../services/auth.service';
import { User } from '../../../model/user.interface';
import { Groups } from '../../../services/groups.service';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  /* Services */
  protected usersService = inject(UsersService);
  protected authService = inject(Auth);
  protected groupsService = inject(Groups);

  /* Data Variables */
  superAdminUsers: User[] = [];
  groupAdminUsers: User[] = [];
  memberUsers: User[] = [];
  joinRequests: User[] = [];
  protected loading = false;
  protected error = '';
  private lastGroupId: number | null = null;

  /* Effect to load users on group selection */
  private userListEffect = effect(() => {
    const id = this.groupsService.selectedGroupId();
    if (!id) {
      this.superAdminUsers = [];
      this.groupAdminUsers = [];
      this.memberUsers = [];
      this.loading = false;
      return;
    }
    if (id === this.lastGroupId) return;
    this.lastGroupId = id;
    this.loadGroupUsers(id);
  });

  /* Actual user loading logic */
  private loadGroupUsers(id: number): void {
    this.loading = true;
    this.error = '';

    const group = this.groupsService.getGroup(id);
    if (!group) return console.error('Failed to get group from id: ', id);

    const ownerId = group.owner;
    const adminSet = new Set(group.admins);
    const memberSet = new Set(group.members);
    const ids = Array.from(new Set([ownerId, ...group.admins, ...group.members]));

    this.usersService.getUsers(ids).subscribe({
      next: (users) => {
        this.superAdminUsers = users.filter((u) => u.roles?.includes('superadmin'));
        this.groupAdminUsers = users.filter(
          (u) => !u.roles?.includes('superadmin') && adminSet.has(u.id)
        );
        this.memberUsers = users.filter(
          (u) => !u.roles?.includes('superadmin') && !adminSet.has(u.id) && memberSet.has(u.id)
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users: ', error);
        this.error = 'Failed to load users';
        this.loading = false;
      },
    });
  }

  /* Functions for User group requests */
  approveRequest(id: number): void {
    const u = this.joinRequests.find((r) => r.id === id);
    if (!u) return;
    this.joinRequests = this.joinRequests.filter((r) => r.id !== id);
    this.memberUsers = [...this.memberUsers, u];
  }

  rejectRequest(id: number): void {
    this.joinRequests = this.joinRequests.filter((r) => r.id !== id);
  }
}
