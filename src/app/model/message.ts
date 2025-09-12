import { User } from './user.interface';

export interface Message {
  id: string;
  user: User;
  message: string;
  channel: string;
  group: string;
  dateSent: Date;
}
