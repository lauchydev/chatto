import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../services/socket.service';
import { Message } from '../../../model/message';
import { Auth } from '../../../services/auth.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit {
  protected channelsService = inject(ChannelsService);
  protected socketService = inject(SocketService);
  protected authService = inject(Auth);

  messageout = signal<string>('');
  messagein = signal<string[]>([]);

  ngOnInit(): void {
    this.socketService.onMessage().subscribe((message) => {
      this.messagein.update((messages) => [...messages, message]);
    });
  }

  send(): void {
    this.socketService.sendMessage(this.messageout());
    this.messageout.set('');
  }
}
