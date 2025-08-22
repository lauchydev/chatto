import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Channel } from '../model/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  private http = inject(HttpClient);

  // Get Channel by ID
  getChannel(channelId: number): Observable<Channel> {
    return this.http.get<Channel>(`http://localhost:3000/api/channels/${channelId}`);
  }
  // Get multiple channels by ID
  getChannels(channelIds: number[]): Observable<Channel[]> {
    const channels = channelIds.join(',');
    return this.http.get<Channel[]>(`http://localhost:3000/api/channels?ids=${channels}`);
  }
}
