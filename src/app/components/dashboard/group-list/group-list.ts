import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Groups } from '../../../services/groups.service';
import { Group, GroupApi } from '../../../model/group.interface';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LogOut, Plus, Settings, Shield, User } from 'lucide-angular/src/icons';
import { Auth } from '../../../services/auth.service';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './group-list.html',
  styleUrl: './group-list.css',
})
export class GroupList implements OnInit {
  private groupsService = inject(Groups);
  private authService = inject(Auth);
  private router = inject(Router);

  // Icons
  readonly SettingsIcon = Settings;
  readonly ShieldIcon = Shield;
  readonly LogOutIcon = LogOut;
  readonly UserIcon = User;
  readonly PlusIcon = Plus;

  groups: GroupApi[] = [];
  loading = false;
  error = '';
  isProfileDropdown = false;
  activeGroupId: number | null = null;

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.error = '';

    this.groupsService.getUserGroups().subscribe({
      next: (groups: GroupApi[]) => {
        this.groups = groups;
        this.loading = false;
      },

      error: (error) => {
        console.error('Error loading groups: ', error);
        this.error = 'Failed loading groups';
        this.loading = false;
      },
    });
  }

  selectGroup(groupId: number): void {
    this.activeGroupId = groupId;
  }

  isGroupActive(groupId: number): boolean {
    return this.activeGroupId == groupId;
  }

  /**
   *
   *  User Getter Functions
   *
   */

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }
  get currentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   *
   *  Button Functionality
   *
   */

  toggleProfileDropdown(): void {
    this.isProfileDropdown = !this.isProfileDropdown;
  }

  closeProfileDropdown(): void {
    this.isProfileDropdown = false;
  }

  goToSettings(): void {
    this.closeProfileDropdown();
    this.router.navigate(['settings']);
  }

  goToAdmin(): void {
    this.closeProfileDropdown();
    this.router.navigate(['admin']);
  }

  goToProfile(): void {
    this.closeProfileDropdown();
    this.router.navigate(['profile']);
  }

  logout(): void {
    this.isProfileDropdown = false;
    localStorage.removeItem('user');
    this.router.navigate(['login']);
  }
}
