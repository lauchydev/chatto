import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { Ban, Crown, Plus, Shield, ShieldMinus, ShieldOff, Trash2, Undo2, XCircle } from 'lucide-angular/src/icons';
import { User } from '../../model/user.interface';
import { UsersService } from '../../services/users.service';
import { CreateUserModal } from '../../components/create-user-modal/create-user-modal';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, LucideAngularModule, CreateUserModal],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  @ViewChild(CreateUserModal) createUserModal!: CreateUserModal;
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

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        // this.reportedUsers = users.filter(u => u.reported === true));
        // this.bannedUsers = users.filter(u => u.banned === true));
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

  promoteToGroupAdmin(userId: number): void {}
  demoteToUser(userId: number): void {}
  promoteToSuperAdmin(userId: number): void {}
  demoteToGroupAdmin(userId: number): void {}
  banUser(userId: number): void {}
  unbanUser(userId: number): void {}
  deleteUser(userId: number): void {}
  removeReport(userId: number): void {}
}
