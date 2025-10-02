import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Message } from '../model/message';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private currentChannelId: number | null = null;
  private SERVER_API = 'http://localhost:3000';
  private newJoinRequestSubject = new Subject<any>();

  constructor() {
    this.socket = io(this.SERVER_API);

    this.socket.on('connect', () => {
      this.socket.on('new-join-request', (data) => {
        this.newJoinRequestSubject.next(data);
      });
    });
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

  /* Group Management */
  createGroup(name: string, ownerId: number, image?: string): void {
    this.socket.emit('create-group', { name, ownerId, image });
  }

  joinGroupRequest(groupId: number, userId: number): void {
    this.socket.emit('join-group-request', { groupId, userId });
  }

  approveJoinRequest(groupId: number, userId: number, approverId: number): void {
    this.socket.emit('approve-join-request', { groupId, userId, approverId });
  }

  rejectJoinRequest(groupId: number, userId: number): void {
    this.socket.emit('reject-join-request', { groupId, userId });
  }

  kickUser(groupId: number, userId: number, kickerId: number): void {
    this.socket.emit('kick-user', { groupId, userId, kickerId });
  }

  banUser(groupId: number, userId: number, bannerId: number): void {
    this.socket.emit('ban-user', { groupId, userId, bannerId });
  }

  unbanUser(groupId: number, userId: number, unbannerId: number): void {
    this.socket.emit('unban-user', { groupId, userId, unbannerId });
  }

  deleteGroup(groupId: number, userId: number): void {
    this.socket.emit('delete-group', { groupId, userId });
  }

  leaveGroup(groupId: number, userId: number): void {
    this.socket.emit('leave-group', { groupId, userId });
  }

  /* Channel Management */
  createChannel(name: string, groupId: number, creatorId: number): void {
    this.socket.emit('create-channel', { name, groupId, creatorId });
  }

  deleteChannel(channelId: number, userId: number): void {
    this.socket.emit('delete-channel', { channelId, userId });
  }

  /* Group/Channel Event Observables */
  onGroupCreated(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('group-created', (data) => {
        observer.next(data);
      });
    });
  }

  onGroupsUpdated(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('groups-updated', (data) => {
        observer.next(data);
      });
    });
  }

  onGroupDeleted(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('group-deleted', (data) => {
        observer.next(data);
      });
    });
  }

  onChannelCreated(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('channel-created', (data) => {
        observer.next(data);
      });
    });
  }

  onChannelDeleted(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('channel-deleted', (data) => {
        observer.next(data);
      });
    });
  }

  onUserJoinedGroup(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-joined-group', (data) => {
        observer.next(data);
      });
    });
  }

  onUserKicked(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-kicked', (data) => {
        observer.next(data);
      });
    });
  }

  onUserBanned(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-banned', (data) => {
        observer.next(data);
      });
    });
  }

  onUserUnbanned(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-unbanned', (data) => {
        observer.next(data);
      });
    });
  }

  onNewJoinRequest(): Observable<any> {
    return this.newJoinRequestSubject.asObservable();
  }

  onJoinRequestSent(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('join-request-sent', (data) => {
        observer.next(data);
      });
    });
  }

  onJoinRequestRejected(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('join-request-rejected', (data) => {
        observer.next(data);
      });
    });
  }

  onUserLeftGroup(): Observable<any> {
    return new Observable<any>((observer) => {
      this.socket.on('user-left-group', (data) => {
        observer.next(data);
      });
    });
  }

  onOperationError(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('operation-error', (error: string) => {
        observer.next(error);
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
