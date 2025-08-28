import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private router = inject(Router);
  private usersService = inject(UsersService);

  protected newUser = {
    username: '',
    email: '',
    password: '',
    birthdate: '',
    age: null,
  };

  protected errorMessage: string = '';
  protected isCheckingUsername = false;
  protected usernameError: string = '';

  canSubmit(): boolean {
    return (
      !this.newUser.username ||
      this.newUser.username.length < 3 ||
      !this.newUser.email ||
      !this.newUser.password ||
      this.usernameError !== '' ||
      this.isCheckingUsername
    );
  }

  checkUsername(): void {
    if (!this.newUser.username || this.newUser.username.length < 3) {
      this.usernameError = '';
      return;
    }

    this.isCheckingUsername = true;
    this.usernameError = '';
    this.usersService.checkUsername(this.newUser.username).subscribe({
      next: (result) => {
        if (result.exists) {
          this.usernameError = 'Username already exists';
        } else {
          this.usernameError = '';
        }
        this.isCheckingUsername = false;
      },
      error: (error) => {
        console.error('Username check failed:', error);
        this.usernameError = 'Error checking username';
        this.isCheckingUsername = false;
      },
    });
  }

  createUser(): void {
    const userToCreate = {
      username: this.newUser.username,
      email: this.newUser.email,
      password: this.newUser.password,
      birthdate: this.newUser.birthdate,
      age: this.newUser.age,
      roles: ['user'],
      groups: [],
      valid: true,
    };

    this.usersService.createUser(userToCreate).subscribe({
      next: (createdUser) => {
        console.log('User created successfully:', createdUser);
        this.onCreateAccount();
      },
      error: (error) => {
        console.error('Failed to create user:', error);
        this.errorMessage = 'Failed to create account. Please try again.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onCreateAccount(): void {
    this.router.navigate(['/login'], {
      queryParams: { accountCreated: 'true' },
    });
  }

  onSubmit(): void {
    if (
      !this.newUser.username ||
      this.newUser.username.length < 3 ||
      this.usernameError ||
      this.isCheckingUsername
    ) {
      this.errorMessage = 'Please resolve username errors';
      return;
    }
    if (!this.newUser.email) {
      this.errorMessage = 'Email is required';
      return;
    }
    if (!this.newUser.password || this.newUser.password.length < 3) {
      this.errorMessage = 'Password must be at least 3 characters long';
      return;
    }
    this.createUser();
  }
}