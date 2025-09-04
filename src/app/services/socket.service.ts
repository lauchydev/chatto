import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  messages = signal<string[]>([]);
  private SERVER_API = process.env['SERVER_API'];

  constructor() {
    this.socket = io(this.SERVER_API);
  }
}
