import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelsService } from '../../../services/channels.service';
import { Groups } from '../../../services/groups.service';
import { Auth } from '../../../services/auth.service';

@Component({
  selector: 'app-channel-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-list.html',
  styleUrl: './channel-list.css',
})
export class ChannelList implements OnInit {
  protected channelsService = inject(ChannelsService);
  protected groupsService = inject(Groups);
  protected authService = inject(Auth);

  channelName = '';
  showDropdownId: number | null = null;

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
}
