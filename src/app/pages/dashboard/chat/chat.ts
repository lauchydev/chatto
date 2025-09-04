import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit {
  protected channelsService = inject(ChannelsService);

  messageout = signal('');
  messagein = signal<string[]>([]);

  messages: string[] = [];

  ngOnInit(): void {
    //
  }
}
