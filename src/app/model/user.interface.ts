import { Group } from './group.interface';

export interface User {
  id: number;
  username: string;
  email: string;
  birthdate?: Date;
  age?: number;
  groups: number[];
  roles: string[];
  password: string;
  valid: boolean;
}
