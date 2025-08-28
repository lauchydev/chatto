import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-user-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.css'
})
export class CreateUserModal {
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

  /* Modal Signals */
  isOpen = signal(false);

  openModal(): void {
    this.isOpen.set(true);
    this.resetForm();
  }

  closeModal(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      birthdate: '',
      age: null,
    };
    this.errorMessage = '';
    this.isCheckingUsername = false;
    this.usernameError = '';
  }

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
        this.closeModal();
        setTimeout(() => {
          window.location.reload();
        }, 50)
      },
      error: (error) => {
        console.error('Failed to create user:', error);
        this.errorMessage = 'Failed to create account. Please try again.';
      },
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