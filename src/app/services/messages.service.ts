import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../model/message';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api/messages';

  /* Get messages for a channel */
  getMessages(channelId: number, limit: number = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}?channelId=${channelId}&limit=${limit}`);
  }

  /* Create a new message */
  createMessage(message: string, channelId: number, userId: number): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, {
      message,
      channelId,
      userId,
    });
  }

  /* Delete a message */
  deleteMessage(messageId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${messageId}?userId=${userId}`);
  }
}
