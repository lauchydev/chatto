import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { Auth } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
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

  // User data
  protected user: User | null = null;
  protected editMode: boolean = false;
  protected originalUser: User | null = null;

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
