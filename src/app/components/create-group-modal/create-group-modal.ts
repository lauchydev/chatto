import { Component, inject, signal } from '@angular/core';
import { Groups } from '../../services/groups.service';
import { Auth } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-group-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-group-modal.html',
  styleUrl: './create-group-modal.css',
})
export class CreateGroupModal {
  private groupService = inject(Groups);
  private authService = inject(Auth);

  /* Modal Signals */
  isOpen = signal(false);
  isLoading = signal(false);
  error = signal('');

  /* Group Properties */
  groupName = '';
  groupImage = '';

  /* Form Validation Logic */
  openModal(): void {
    this.isOpen.set(true);
    this.resetForm();
  }
  closeModal(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.groupName = '';
    this.groupImage = '';
    this.error.set('');
  }

  createGroup(): void {
    if (!this.groupName.trim()) {
      this.error.set('Group name is required');
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.error.set('User not authenticated');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    this.groupService.createGroup(this.groupName, currentUser.id, this.groupImage);
    this.closeModal();
    this.isLoading.set(false);
  }
}
