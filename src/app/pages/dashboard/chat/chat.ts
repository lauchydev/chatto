import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelsService } from '../../../services/channels.service';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../services/socket.service';
import { MessagesService } from '../../../services/messages.service';
import { Message } from '../../../model/message';
import { Auth } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  protected channelsService = inject(ChannelsService);
  protected socketService = inject(SocketService);
  protected messagesService = inject(MessagesService);
  protected authService = inject(Auth);

  /* Signals */
  messageout = signal<string>('');
  messages = signal<Message[]>([]);
  loading = signal<boolean>(false);
  error = signal<string>('');

  /* Subscriptions */
  private subscriptions: Subscription[] = [];
  private lastJoinedChannelId: number | null = null;

  constructor() {
    /* Watch for channel changes */
    effect(() => {
      const selectedChannel = this.channelsService.getSelectedChannel();
      const currentUser = this.authService.getCurrentUser();
      if (selectedChannel && currentUser && selectedChannel.id !== this.lastJoinedChannelId) {
        this.loadChannelMessages(selectedChannel.id);
        this.socketService.joinChannel(selectedChannel.id, currentUser.id, currentUser.username);
        this.lastJoinedChannelId = selectedChannel.id;
      }
    });
  }

  ngOnInit(): void {
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    /* Clean up subscriptions */
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    /* Leave current channel */
    const currentChannelId = this.socketService.getCurrentChannelId();
    if (currentChannelId) {
      this.socketService.leaveChannel(currentChannelId);
    }
    this.lastJoinedChannelId = null;
  }

  /* Load messages for a channel */
  private loadChannelMessages(channelId: number): void {
    this.loading.set(true);
    this.error.set('');

    this.messagesService.getMessages(channelId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.error.set('Failed to load messages');
        this.loading.set(false);
      },
    });
  }

  /* Setup socket event listeners */
  private setupSocketListeners(): void {
    /* New messages */
    const messagesSub = this.socketService.onMessage().subscribe((message: Message) => {
      this.messages.update((messages) => [...messages, message]);
      this.scrollToBottom();
    });

    /* Message errors */
    const errorSub = this.socketService.onMessageError().subscribe((error: string) => {
      this.error.set(error);
      setTimeout(() => this.error.set(''), 3000);
    });

    /* Message deletions */
    const deletedSub = this.socketService.onMessageDeleted().subscribe((data: any) => {
      this.messages.update((messages) => messages.filter((msg) => msg.id !== data.messageId));
    });

    /* User join/leave notifications */
    const joinSub = this.socketService.onUserJoinedChannel().subscribe((data: any) => {
      console.log('User joined channel:', data);
    });

    const leaveSub = this.socketService.onUserLeftChannel().subscribe((data: any) => {
      console.log('User left channel:', data);
    });

    /* Store subscriptions for cleanup */
    this.subscriptions.push(messagesSub, errorSub, deletedSub, joinSub, leaveSub);
  }

  /* Send message */
  send(): void {
    const message = this.messageout().trim();
    const selectedChannel = this.channelsService.getSelectedChannel();
    const currentUser = this.authService.getCurrentUser();

    if (!message || !selectedChannel || !currentUser) {
      return;
    }

    /* Send via socket */
    this.socketService.sendMessage(message, selectedChannel.id, currentUser.id);
    this.messageout.set('');
  }

  /* Delete message */
  deleteMessage(message: Message): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    /* Check if user can delete (owner or admin) */
    const canDelete =
      message.userId === currentUser.id || currentUser.roles?.includes('superadmin');

    if (!canDelete) {
      this.error.set('You cannot delete this message');
      setTimeout(() => this.error.set(''), 3000);
      return;
    }

    /* Delete via socket */
    this.socketService.deleteMessage(message.id, currentUser.id, message.channelId);
  }

  /* Utility methods */
  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  /* Check if message is from current user */
  isOwnMessage(message: Message): boolean {
    return message.userId === this.authService.getCurrentUser()?.id;
  }

  /* Format message timestamp */
  formatDate(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    /**
     * Discord inspired date formatting on messages
     */

    /* Date formatting (Today) */
    if (messageDate.toDateString() === today.toDateString()) {
      return `Today ${timeString}`;
    }

    /* Date formatting (Yesterday) */
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeString}`;
    }

    /* Date formatting (DD-MM-YYYY) */
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear();

    return `${day}-${month}-${year} ${timeString}`;
  }
}
