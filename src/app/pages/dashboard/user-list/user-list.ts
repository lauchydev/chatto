import { Component, inject } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Auth } from '../../../services/auth.service';
import { User } from '../../../model/user.interface';
import { Groups } from '../../../services/groups.service';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Check, LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  /* Services */
  protected usersService = inject(UsersService);
  protected authService = inject(Auth);
  protected groupsService = inject(Groups);

  /* Icons */
  readonly AllowIcon = Check;
  readonly RejectIcon = X;

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
    this.loadGroupRequests();
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

  private loadGroupRequests(): void {
    this.loading = true;
    this.error = '';

    const group = this.groupsService.getSelectedGroup();
    if (!group) {
      this.joinRequests = [];
      this.loading = false;
      return;
    }

    const requestIds: number[] = Array.isArray((group as any).requests)
      ? ((group as any).requests as number[])
      : [];

    if (requestIds.length === 0) {
      this.joinRequests = [];
      this.loading = false;
      return;
    }

    this.usersService.getUsers(requestIds).subscribe({
      next: (users) => {
        this.joinRequests = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load join requests: ', error);
        this.error = 'Failed to load join requests';
        this.loading = false;
      },
    });
  }

  /* Functions for User group requests */
  approveRequest(userId: number): void {
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) {
      console.error('Invalid group ID: ', groupId);
      return;
    }
    const u = this.joinRequests.find((r) => r.id === userId);
    if (!u) return;
    this.joinRequests = this.joinRequests.filter((r) => r.id !== userId);
    this.memberUsers = [...this.memberUsers, u];

    this.groupsService.approveRequest(groupId, userId).subscribe({
      next: () => {
        this.groupsService.refreshGroups();
      },
      error: (err) => {
        console.error('Approve failed: ', err);
        this.memberUsers = this.memberUsers.filter((m) => m.id !== userId);
        this.joinRequests = [...this.joinRequests, u];
        this.error = 'Failed to approve request';
      },
    });
  }

  rejectRequest(userId: number): void {
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) {
      console.error('Invalid group ID: ', groupId);
      return;
    }
    const prev = this.joinRequests;
    this.joinRequests = this.joinRequests.filter((r) => r.id !== userId);

    this.groupsService.rejectRequest(groupId, userId).subscribe({
      next: () => {
        this.groupsService.refreshGroups();
      },
      error: (err) => {
        console.error('Reject failed: ', err);
        this.joinRequests = prev;
        this.error = 'Failed to reject request';
      },
    });
  }
}
