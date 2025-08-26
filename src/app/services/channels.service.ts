import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Channel } from '../model/channel.interface';
import { Groups } from './groups.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private http = inject(HttpClient);
  private groupsService = inject(Groups);
  channels = signal<Channel[]>([]);
  selectedChannel = signal<number | null>(null);

  loadChannels(groupId: number): void {
    this.http
      .get<Channel[]>(`http://localhost:3000/api/channels?groupId=${groupId}`)
      .subscribe((channels) => {
        this.channels.set(channels);
      });
  }

  createChannel(name: string, groupId: number): void {
    this.http
      .post<Channel>(`http://localhost:3000/api/channels`, {
        name,
        groupId,
      })
      .subscribe((channel) => {
        this.channels.update((prev) => [...prev, channel]);
      });
  }

  selectChannel(channelId: number): void {
    this.selectedChannel.set(channelId);
  }

  getSelectedChannel(): Channel | null {
    const selectedId = this.selectedChannel();
    return this.channels().find((channel) => channel.id === selectedId) || null;
  }

  deleteChannel(channelId: number): void {
    this.http.delete(`http://localhost:3000/api/channels/${channelId}`).subscribe(() => {
      this.channels.update((prev) => prev.filter((channel) => channel.id !== channelId));
    });
  }
}
