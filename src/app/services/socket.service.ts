import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Message } from '../model/message';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  messages = signal<string[]>([]);
  private SERVER_API = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.SERVER_API);
  }

  sendMessage(msg: string) {
    this.socket.emit('new-message', msg);
  }

  onMessage(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('new-message', (message) => {
        observer.next(message);
      });
    });
  }
}
