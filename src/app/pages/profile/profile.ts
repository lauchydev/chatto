import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { Auth } from '../../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit, OnDestroy {
  protected authService = inject(Auth);
  protected userService = inject(UsersService);
  protected router = inject(Router);

  @ViewChild('profileForm') profileForm!: NgForm;

  // User data
  protected user: User | null = null;
  protected editMode: boolean = false;
  protected originalUser: User | null = null;

  // Username validation
  protected isCheckingUsername = false;
  protected usernameError = '';

  ngOnDestroy(): void {}
  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (userId) {
      this.userService.getUser(userId).subscribe({
        next: (user) => {
          this.user = user;
          this.originalUser = { ...this.user };
        },
        error: (error) => {
          console.error('Failed to load user: ', error);
        },
      });
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    // Clear any username errors when entering edit mode
    if (this.editMode) {
      this.usernameError = '';
    }
  }

  checkUsername(): void {
    if (!this.user || !this.user.username || this.user.username.length < 3) {
      this.usernameError = '';
      return;
    }

    // Don't check if username hasn't changed
    if (this.originalUser && this.user.username === this.originalUser.username) {
      this.usernameError = '';
      return;
    }

    this.isCheckingUsername = true;
    this.usernameError = '';

    this.userService.checkUsername(this.user.username).subscribe({
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

  onSaveChanges(): void {
    // Check if form is valid and no username errors before saving
    if (
      this.profileForm &&
      this.profileForm.valid &&
      !this.usernameError &&
      !this.isCheckingUsername
    ) {
      this.saveChanges();
    } else {
      // Mark all fields as touched to show validation errors
      if (this.profileForm) {
        Object.keys(this.profileForm.controls).forEach((key) => {
          this.profileForm.controls[key].markAsTouched();
        });
      }
      if (this.usernameError) {
        console.log('Username error: ' + this.usernameError);
      } else if (this.isCheckingUsername) {
        console.log('Still checking username availability...');
      } else {
        console.log('Form is invalid. Please fill in all required fields.');
      }
    }
  }

  saveChanges(): void {
    if (this.user && this.originalUser) {
      this.userService.updateUser(this.user).subscribe({
        next: (updatedUser) => {
          this.user = { ...updatedUser };
          this.originalUser = { ...this.user };
          this.editMode = false;
        },
        error: (error) => {
          console.error('Failed to save user: ', error);
        },
      });
    }
  }

  cancelChanges(): void {
    if (this.originalUser) {
      this.user = { ...this.originalUser };
      this.editMode = false;
    }
  }

  deleteProfile(): void {
    if (this.user) {
      const confirmed = confirm('Are you sure you want to delete your profile?');
      if (confirmed) {
        this.userService.deleteUser(this.user.id).subscribe({
          next: () => {
            this.authService.logout();
          },
          error: (error) => {
            console.error('Failed to delete user: ', error);
          },
        });
      }
    }
  }
}
