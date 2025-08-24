import { Channel } from './channel.interface';
import { User } from './user.interface';

export interface GroupApi {
  id: number;
  name: string;
  icon?: string;
  owner: number;
  members: number[];
  admins: number[];
  channels: number[];
}
export interface Group {
  id: number;
  name: string;
  icon?: string;
  owner: number;
  members: User[];
  admins: User[];
  channels: Channel[];
}
