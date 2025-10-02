export interface Message {
  id: number;
  message: string;
  channelId: number;
  userId: number;
  username: string;
  userImage: string;
  dateSent: Date;
  isSystemMessage?: boolean;
  systemMessageType?: 'channel_created' | 'user_joined' | 'user_left';
}
