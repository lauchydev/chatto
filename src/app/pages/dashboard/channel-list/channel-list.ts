import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelsService } from '../../../services/channels.service';
import { Groups } from '../../../services/groups.service';
import { Auth } from '../../../services/auth.service';
import { ConfirmModal } from '../../../components/confirm-modal/confirm-modal';
import {
  ChevronDown,
  DoorOpen,
  ListPlus,
  LucideAngularModule,
  MoreHorizontal,
  Trash2,
} from 'lucide-angular';

@Component({
  selector: 'app-channel-list',
  imports: [CommonModule, FormsModule, ConfirmModal, LucideAngularModule],
  templateUrl: './channel-list.html',
  styleUrl: './channel-list.css',
})
export class ChannelList implements OnInit {
  protected channelsService = inject(ChannelsService);
  protected groupsService = inject(Groups);
  protected authService = inject(Auth);
  @ViewChild(ConfirmModal) confirmModal!: ConfirmModal;

  readonly DownIcon = ChevronDown;
  readonly AddChannelIcon = ListPlus;
  readonly LeaveServerIcon = DoorOpen;
  readonly DeleteServerIcon = Trash2;
  readonly MoreIcon = MoreHorizontal;
  readonly DeleteChannelIcon = Trash2;

  channelName = '';
  showDropdownId: number | null = null;

  // Group menu + add channel popover
  isGroupMenuOpen = false;
  isAddChannelOpen = false;
  newChannelName = '';
  private pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    const selectedGroup = this.groupsService.getSelectedGroup();
    if (selectedGroup) {
      this.channelsService.loadChannels(selectedGroup.id);
    }
  }

  createChannel(): void {
    const trimmed = this.channelName.trim();
    if (!trimmed) return;
    const group = this.groupsService.getSelectedGroup();
    if (!group) return;
    this.channelsService.createChannel(trimmed, group.id);
    this.channelName = '';
  }

  toggleDropdown(channelId: number): void {
    this.showDropdownId = this.showDropdownId === channelId ? null : channelId;
  }

  showDropdown(): number | null {
    return this.showDropdownId;
  }

  closeDropdown(): void {
    this.showDropdownId = null;
  }

  deleteChannel(channelId: number): void {
    this.channelsService.deleteChannel(channelId);
    this.showDropdownId = null;
  }

  // Group header dropdown handlers
  toggleGroupMenu(): void {
    this.isGroupMenuOpen = !this.isGroupMenuOpen;
  }

  closeGroupMenu(): void {
    this.isGroupMenuOpen = false;
  }

  openAddChannel(): void {
    this.isGroupMenuOpen = false;
    this.isAddChannelOpen = true;
  }

  cancelAddChannel(): void {
    this.isAddChannelOpen = false;
    this.newChannelName = '';
  }

  submitAddChannel(): void {
    const name = this.newChannelName.trim();
    if (!name) return;
    const group = this.groupsService.getSelectedGroup();
    if (!group) return;
    this.channelsService.createChannel(name, group.id);
    this.cancelAddChannel();
  }

  confirmDeleteGroup(): void {
    const group = this.groupsService.getSelectedGroup();
    if (!group) return;
    this.isGroupMenuOpen = false;
    this.pendingAction = () => {
      this.groupsService.deleteGroup(group.id).subscribe({
        next: () => this.groupsService.refreshGroups(),
        error: (e) => console.error('Failed to delete group', e),
      });
    };
    this.confirmModal.title = 'Delete group';
    this.confirmModal.message = `Are you sure you want to delete "${group.name}"?`;
    this.confirmModal.destructive = true;
    this.confirmModal.openModal();
  }

  confirmLeaveGroup(): void {
    const group = this.groupsService.getSelectedGroup();
    if (!group) return;
    this.isGroupMenuOpen = false;
    this.pendingAction = () => {
      this.groupsService.leaveGroup(group.id).subscribe({
        next: () => this.groupsService.refreshGroups(),
        error: (e) => console.error('Failed to leave group', e),
      });
    };
    this.confirmModal.title = 'Leave group';
    this.confirmModal.message = `Are you sure you want to leave "${group.name}"?`;
    this.confirmModal.destructive = false;
    this.confirmModal.openModal();
  }

  onConfirmModal(): void {
    if (this.pendingAction) this.pendingAction();
    this.pendingAction = null;
  }

  onCancelModal(): void {
    this.pendingAction = null;
  }
}
