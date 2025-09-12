import { Component, inject } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Auth } from '../../../services/auth.service';
import { User } from '../../../model/user.interface';
import { Groups } from '../../../services/groups.service';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Check, LucideAngularModule, MoreHorizontal, X } from 'lucide-angular';

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
  readonly MoreIcon = MoreHorizontal;

  /* Data Variables */
  superAdminUsers: User[] = [];
  groupAdminUsers: User[] = [];
  memberUsers: User[] = [];
  joinRequests: User[] = [];
  bannedUsers: User[] = [];
  protected loading = false;
  protected error = '';
  private lastGroupId: number | null = null;
  showUserDropdownId: number | null = null;

  /* Effect to load users on group selection */
  private userListEffect = effect(() => {
    const id = this.groupsService.selectedGroupId();
    if (!id) {
      this.superAdminUsers = [];
      this.groupAdminUsers = [];
      this.memberUsers = [];
      this.bannedUsers = [];
      this.loading = false;
      return;
    }
    if (id === this.lastGroupId) return;
    this.lastGroupId = id;
    this.loadAllGroupData(id);
  });

  /* Consolidated loading logic */
  private loadAllGroupData(id: number): void {
    this.loading = true;
    this.error = '';

    const group = this.groupsService.getGroup(id);
    if (!group) {
      console.error('Failed to get group from id: ', id);
      this.superAdminUsers = [];
      this.groupAdminUsers = [];
      this.memberUsers = [];
      this.joinRequests = [];
      this.bannedUsers = [];
      this.loading = false;
      return;
    }

    const ownerId = group.owner;
    const admins = Array.isArray(group.admins) ? group.admins : [];
    const members = Array.isArray(group.members) ? group.members : [];
    const requests = Array.isArray((group as any).requests)
      ? ((group as any).requests as number[])
      : [];
    const banned = Array.isArray((group as any).banned) ? ((group as any).banned as number[]) : [];

    const adminSet = new Set(admins);
    const memberSet = new Set(members);
    const requestSet = new Set(requests);
    const bannedSet = new Set(banned);

    const ids = Array.from(new Set([ownerId, ...admins, ...members, ...requests, ...banned]));

    if (ids.length === 0) {
      this.superAdminUsers = [];
      this.groupAdminUsers = [];
      this.memberUsers = [];
      this.joinRequests = [];
      this.bannedUsers = [];
      this.loading = false;
      return;
    }

    this.usersService.getUsers(ids).subscribe({
      next: (users) => {
        this.superAdminUsers = users.filter((u) => u.roles?.includes('superadmin'));
        this.groupAdminUsers = users.filter(
          (u) => !u.roles?.includes('superadmin') && adminSet.has(u.id)
        );
        this.memberUsers = users.filter(
          (u) => !u.roles?.includes('superadmin') && !adminSet.has(u.id) && memberSet.has(u.id)
        );
        this.joinRequests = users.filter((u) => requestSet.has(u.id));
        this.bannedUsers = users.filter((u) => bannedSet.has(u.id));
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load group data: ', error);
        this.error = 'Failed to load users';
        this.loading = false;
      },
    });
  }

  onUserClick(userId: number): void {
    this.toggleUserDropdown(userId);
  }

  toggleUserDropdown(userId: number): void {
    this.showUserDropdownId = this.showUserDropdownId === userId ? null : userId;
  }

  closeUserDropdown(): void {
    this.showUserDropdownId = null;
  }

  isUserBanned(userId: number): boolean {
    return this.bannedUsers.some((user) => user.id === userId);
  }

  onReportUser(user: User): void {
    this.closeUserDropdown();
    this.usersService.reportUser(user.id).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Failed to report user: ', error);
        this.error = 'Failed to report user';
      },
    });
  }

  onKickUser(user: User): void {
    this.closeUserDropdown();
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) return;

    const wasAdmin = this.groupAdminUsers.some((u) => u.id === user.id);
    const prevAdmins = this.groupAdminUsers;
    const prevMembers = this.memberUsers;

    this.groupAdminUsers = this.groupAdminUsers.filter((u) => u.id !== user.id);
    this.memberUsers = this.memberUsers.filter((u) => u.id !== user.id);

    this.groupsService.kickUser(groupId, user.id).subscribe({
      next: () => this.groupsService.refreshGroups(),
      error: (error) => {
        console.error('Failed to kick user: ', error);
        this.error = 'Failed to kick user';
        this.groupAdminUsers = prevAdmins;
        this.memberUsers = prevMembers;
      },
    });
  }

  onBanUser(user: User): void {
    this.closeUserDropdown();
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) return;

    const prevAdmins = this.groupAdminUsers;
    const prevMembers = this.memberUsers;
    const prevBanned = this.bannedUsers;

    this.groupAdminUsers = this.groupAdminUsers.filter((u) => u.id !== user.id);
    this.memberUsers = this.memberUsers.filter((u) => u.id !== user.id);
    this.bannedUsers = [...this.bannedUsers, user];

    this.groupsService.banUser(groupId, user.id).subscribe({
      next: () => this.groupsService.refreshGroups(),
      error: (err) => {
        console.error('Ban failed: ', err);
        // Check if user is already banned
        if (err.error?.error === 'User already banned') {
          this.error = 'User is already banned';
          // Don't rollback state since user is actually banned
          this.groupsService.refreshGroups();
        } else {
          this.error = 'Failed to ban user';
          // Rollback optimistic updates
          this.groupAdminUsers = prevAdmins;
          this.memberUsers = prevMembers;
          this.bannedUsers = prevBanned;
        }
      },
    });
  }

  onUnbanUser(user: User): void {
    this.closeUserDropdown();
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) return;

    const prevBanned = this.bannedUsers;
    this.bannedUsers = this.bannedUsers.filter((u) => u.id !== user.id);

    this.groupsService.unbanUser(groupId, user.id).subscribe({
      next: () => {
        this.groupsService.refreshGroups();
      },
      error: (err) => {
        console.error('Unban failed: ', err);
        this.error = 'Failed to unban user';
        this.bannedUsers = prevBanned;
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
