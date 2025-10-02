import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Auth } from '../../../services/auth.service';
import { User } from '../../../model/user.interface';
import { Groups } from '../../../services/groups.service';
import { SocketService } from '../../../services/socket.service';
import { effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Check, LucideAngularModule, MoreHorizontal, X } from 'lucide-angular';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit, OnDestroy {
  /* Services */
  protected usersService = inject(UsersService);
  protected authService = inject(Auth);
  protected groupsService = inject(Groups);
  private socketService = inject(SocketService);
  private subscriptions: Subscription[] = [];

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

  ngOnInit(): void {
    this.subscriptions.push(
      this.socketService.onUserKicked().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.socketService.onUserBanned().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.socketService.onUserUnbanned().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.socketService.onUserJoinedGroup().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.socketService.onNewJoinRequest().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.socketService.onJoinRequestRejected().subscribe((data: any) => {
        this.reloadCurrentGroup();
      }),

      this.groupsService.onGroupsRefreshed().subscribe(() => {
        console.log('🔄 UserList: Groups refreshed, reloading current group data');
        const currentGroupId = this.groupsService.selectedGroupId();
        if (currentGroupId) {
          this.loadAllGroupData(currentGroupId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private reloadCurrentGroup(): void {}

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

    this.groupsService.kickUser(groupId, user.id);
  }

  onBanUser(user: User): void {
    this.closeUserDropdown();
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) return;

    this.groupsService.banUser(groupId, user.id);
  }

  onUnbanUser(user: User): void {
    this.closeUserDropdown();
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) return;

    this.groupsService.unbanUser(groupId, user.id);
  }

  /* Functions for User group requests */
  approveRequest(userId: number): void {
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) {
      console.error('Invalid group ID: ', groupId);
      return;
    }

    this.groupsService.approveRequest(groupId, userId);
  }

  rejectRequest(userId: number): void {
    const groupId = this.groupsService.getSelectedGroup()?.id;
    if (!groupId) {
      console.error('Invalid group ID: ', groupId);
      return;
    }

    this.groupsService.rejectRequest(groupId, userId);
  }
}
