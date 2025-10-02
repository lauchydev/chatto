import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Message } from '../model/message';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private currentChannelId: number | null = null;
  private SERVER_API = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.SERVER_API);
  }

  /* Channel Management */
  joinChannel(channelId: number, userId?: number, username?: string): void {
    if (this.currentChannelId) {
      this.leaveChannel(this.currentChannelId);
    }
    this.currentChannelId = channelId;

    this.socket.emit('join-channel', {
      channelId,
      userId,
      username,
    });
    console.log(`Joined channel ${channelId}`);
  }

  leaveChannel(channelId: number): void {
    this.socket.emit('leave-channel', channelId);
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null;
    }
    console.log(`Left channel ${channelId}`);
  }

  getCurrentChannelId(): number | null {
    return this.currentChannelId;
  }

  /* Messaging */
  sendMessage(message: string, channelId: number, userId: number): void {
    this.socket.emit('new-message', {
      message,
      channelId,
      userId,
    });
  }

  onMessage(): Observable<Message> {
    return new Observable<Message>((observer) => {
      this.socket.on('new-message', (message: Message) => {
        observer.next(message);
      });
    });
  }

  onMessageError(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('message-error', (error: string) => {
        observer.next(error);
      });
    });
  }

  /* Message Deletion */
  deleteMessage(messageId: number, userId: number, channelId: number): void {
    this.socket.emit('delete-message', {
      messageId,
      userId,
      channelId,
    });
  }

  onMessageDeleted(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('message-deleted', (data) => {
        observer.next(data);
      });
    });
  }

  onDeleteError(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('delete-error', (error: string) => {
        observer.next(error);
      });
    });
  }

  /* Channel Events */
  onUserJoinedChannel(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-joined-channel', (data) => {
        observer.next(data);
      });
    });
  }

  onUserLeftChannel(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-left-channel', (data) => {
        observer.next(data);
      });
    });
  }

  /* Connection Status */
  isConnected(): boolean {
    return this.socket.connected;
  }

  onConnect(): Observable<void> {
    return new Observable<void>((observer) => {
      this.socket.on('connect', () => {
        observer.next();
      });
    });
  }

  onDisconnect(): Observable<void> {
    return new Observable<void>((observer) => {
      this.socket.on('disconnect', () => {
        observer.next();
      });
    });
  }
}
