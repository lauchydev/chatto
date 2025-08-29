import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { Ban, Crown, Plus, Shield, ShieldMinus, ShieldOff, Trash2, Undo2, XCircle } from 'lucide-angular/src/icons';
import { User } from '../../model/user.interface';
import { UsersService } from '../../services/users.service';
import { CreateUserModal } from '../../components/create-user-modal/create-user-modal';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, LucideAngularModule, CreateUserModal, ConfirmModal],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  @ViewChild(CreateUserModal) createUserModal!: CreateUserModal;
  @ViewChild('deleteConfirm') deleteConfirm!: ConfirmModal;

  /* Services */
  protected router = inject(Router);
  protected authService = inject(Auth);
  protected userService = inject(UsersService);

  /* Icons */
  readonly ShieldIcon = Shield;
  readonly ShieldOffIcon = ShieldOff;
  readonly ShieldMinusIcon = ShieldMinus;
  readonly CrownIcon = Crown;
  readonly BanIcon = Ban;
  readonly TrashIcon = Trash2;
  readonly XCircleIcon = XCircle;
  readonly Undo2Icon = Undo2;
  readonly PlusIcon = Plus;

  /* Data Arrays */
  protected users: User[] = [];
  protected reportedUsers: User[] = [];
  protected bannedUsers: User[] = [];

  /* Variables */
  private pendingDeleteUserId: number | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.reportedUsers = users.filter(u => u.reported === true);
        this.bannedUsers = users.filter(u => u.banned === true);
      },
      error: (error) => {
        console.error('Failed to load users', error);
        this.users = [];
        this.reportedUsers = [];
        this.bannedUsers = [];
      }
    })
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  openCreateUserModal(): void {
    this.createUserModal.openModal();

  }

  promoteToGroupAdmin(userId: number): void {
    const target = this.users.find(u => u.id === userId);
    if (!target) {
      console.error('User not found: ', userId);
      return;
    }

    if (target.roles.includes('groupadmin') || target.roles.includes('superadmin')) {
      return;
    }

    const updatedUser: User = {
      ...target,
      roles: [...target.roles, 'groupadmin']
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to update user roles: ', error);

      }
    })
  }
  demoteToUser(userId: number): void {
    const target = this.users.find(u => u.id === userId);
    if (!target) {
      return console.log('User not found: ', userId);
    }

    if (target.roles.includes('superadmin') || !target.roles.includes('groupadmin')) {
      return;
    }

    const updatedUser: User = {
      ...target,
      roles: (() => {
        const next = target.roles.filter(role => role !== 'groupadmin');
        if (!next.includes('user')) next.push('user');
        return next;
      }) ()
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to update user roles: ', error);
      }
    })
  }
  promoteToSuperAdmin(userId: number): void {
    const target = this.users.find(u => u.id === userId);

    if (!target) {
      return console.log('User not found: ', userId);
    }

    if (!target.roles.includes('groupadmin') || target.roles.includes('superadmin')){
      return;
    }

    const updatedUser: User = {
      ...target,
      roles: [...target.roles, 'superadmin']

    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to update user roles: ', error);
      }
    })
  }
  demoteToGroupAdmin(userId: number): void {
    const target = this.users.find(u => u.id === userId);

    if (!target) {
      return console.log('User not found: ', userId);
    }

    if (!target.roles.includes('superadmin')) {
      return;
    }

    const updatedUser: User = {
      ...target,
      roles: (() => {
        const next = target.roles.filter(role => role !== 'superadmin');
        if (!next.includes('groupadmin')) next.push('groupadmin');
        return next;
      })()
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to update user roles: ', error);
      }
    })

  }

  banUser(userId: number): void {
    const target = this.users.find(u => u.id === userId);
    if (!target || target.banned === true) return;

    const updatedUser: User = { ...target, banned: true };
    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to ban user: ', error);
      }
    });
  }
  unbanUser(userId: number): void {
    const target = this.users.find(u=> u.id === userId);
    if (!target ||  target.banned === false) return;

    const updatedUser: User = {...target, banned: false };
    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => { 
        console.error('Failed to unban user: ', error);
      }
    });
  }
  removeReport(userId: number): void {
    const target = this.users.find(u => u.id === userId);
    if (!target || target.reported === false) return;

    const updatedUser: User = { ...target, reported: false};
    this.userService.updateUser(updatedUser).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        console.error('Failed to remove report: ', error);
      }
    });
  }


  confirmDeleteUser(userId: number, username: string): void {
    this.pendingDeleteUserId = userId;

      this.deleteConfirm.title = 'Delete User';
      this.deleteConfirm.message = `Are you sure you want to delete “${username}”?`;
      this.deleteConfirm.confirmText = 'Delete';
      this.deleteConfirm.cancelText = 'Cancel';
      this.deleteConfirm.destructive = true;

      this.deleteConfirm.openModal();
  }
  
  onConfirmDeleteUser(): void {
    if (this.pendingDeleteUserId == null) return;
    this.userService.deleteUser(this.pendingDeleteUserId).subscribe({
      next: () => {
        this.pendingDeleteUserId = null;
        this.loadUsers();
      },
      error: (err) => console.error('Failed to delete user:', err),
    });
  }

}
