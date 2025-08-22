import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  isAuthenticated(): boolean {
    let userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const valid: boolean = user.valid;
      return valid;
    }
    return false;
  }
}
