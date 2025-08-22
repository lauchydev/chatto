import { Group } from './group.interface';

export interface User {
  id: number;
  username: string;
  email: string;
  image?: string;
  birthdate?: Date;
  age?: number;
  groups: number[];
  roles: string[];
  password: string;
  valid: boolean;
}
