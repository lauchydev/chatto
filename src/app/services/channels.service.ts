import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Channel } from '../model/channel.interface';
import { Groups } from './groups.service';
import { SocketService } from './socket.service';
import { Auth } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private http = inject(HttpClient);
  private groupsService = inject(Groups);
  private socketService = inject(SocketService);
  private authService = inject(Auth);
  channels = signal<Channel[]>([]);
  selectedChannel = signal<number | null>(null);

  constructor() {
    this.socketService.onChannelCreated().subscribe((channel: Channel) => {
      this.channels.update((prev) => [...prev, channel]);
    });

    this.socketService.onChannelDeleted().subscribe((data: any) => {
      const wasSelected = this.selectedChannel() === data.channelId;
      this.channels.update((prev) => prev.filter((c) => c.id !== data.channelId));
      if (wasSelected) {
        const next = this.channels()[0]?.id ?? null;
        this.selectedChannel.set(next);
      }
    });

    this.socketService.onOperationError().subscribe((error: string) => {
      console.error('Channel operation error:', error);
    });
  }

  loadChannels(groupId: number): void {
    this.http
      .get<Channel[]>(`http://localhost:3000/api/channels?groupId=${groupId}`)
      .subscribe((channels) => {
        this.channels.set(channels);
        if (channels.length) {
          this.selectedChannel.set(channels[0].id);
        } else {
          this.selectedChannel.set(null);
        }
      });
  }

  createChannel(name: string, groupId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    this.socketService.createChannel(name, groupId, currentUser.id);
  }

  selectChannel(channelId: number): void {
    this.selectedChannel.set(channelId);
  }

  getSelectedChannel(): Channel | null {
    const selectedId = this.selectedChannel();
    return this.channels().find((channel) => channel.id === selectedId) || null;
  }

  deleteChannel(channelId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    this.socketService.deleteChannel(channelId, currentUser.id);
  }
}
