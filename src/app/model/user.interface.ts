export interface User {
  id: number;
  username: string;
  email: string;
  image?: string;
  birthdate?: Date;
  age?: number;
  roles: string[];
  password: string;
  valid: boolean;
}
