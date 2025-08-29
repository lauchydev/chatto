import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css'
})
export class ConfirmModal {

  title = 'Confirm action';
  message = 'Are you sure you want to proceed?'
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  destructive = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = signal(false);

  openModal(): void {
    this.isOpen.set(true);
  }

  closeModal(): void {
    this.isOpen.set(false);
  }

  onConfirm():void {
    this.confirmed.emit();
    this.closeModal();
  }
  
  onCancel(): void {
    this.cancelled.emit();
    this.closeModal();
  }

}
