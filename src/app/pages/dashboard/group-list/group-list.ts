import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Groups } from '../../../services/groups.service';
import { Group, GroupApi } from '../../../model/group.interface';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LogOut, Plus, Settings, Shield, User } from 'lucide-angular/src/icons';
import { Auth } from '../../../services/auth.service';
import { CreateGroupModal } from '../../../components/create-group-modal/create-group-modal';
import { ChannelsService } from '../../../services/channels.service';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule, LucideAngularModule, CreateGroupModal],
  templateUrl: './group-list.html',
  styleUrl: './group-list.css',
})
export class GroupList implements OnInit {
  @ViewChild(CreateGroupModal) createGroupModal!: CreateGroupModal;

  protected groupService = inject(Groups);
  protected authService = inject(Auth);
  private router = inject(Router);
  private channelsService = inject(ChannelsService);

  // Icons
  readonly SettingsIcon = Settings;
  readonly ShieldIcon = Shield;
  readonly LogOutIcon = LogOut;
  readonly UserIcon = User;
  readonly PlusIcon = Plus;

  isProfileDropdown = false;

  error = this.groupService.error;
  loading = this.groupService.loading;
  groups = this.groupService.groups;
  selectedGroupId = this.groupService.selectedGroupId;

  ngOnInit(): void {
    this.groupService.loadGroups();

    // Wait until a group is auto-selected, then load its channels once
    const watchSelection = setInterval(() => {
      const autoId = this.selectedGroupId();
      if (autoId) {
        this.channelsService.loadChannels(autoId);
        clearInterval(watchSelection);
      }
    }, 50);
  }
  setSelectedGroup(groupId: number): void {
    this.groupService.selectGroup(groupId);
    this.channelsService.loadChannels(groupId);
  }

  isSelectedGroup(groupId: number): boolean {
    return this.selectedGroupId() === groupId;
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdown = !this.isProfileDropdown;
  }

  closeProfileDropdown(): void {
    this.isProfileDropdown = false;
  }

  openCreateGroupModal(): void {
    this.createGroupModal.openModal();
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
