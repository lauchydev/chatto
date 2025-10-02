import { Component, inject, signal } from '@angular/core';
import { Groups } from '../../services/groups.service';
import { GroupApi } from '../../model/group.interface';
import { Auth } from '../../services/auth.service';

@Component({
  selector: 'app-discover-groups-modal',
  imports: [],
  templateUrl: './discover-groups-modal.html',
  styleUrl: './discover-groups-modal.css',
})
export class DiscoverGroupsModal {
  /* Services */
  private groupsService = inject(Groups);
  private authService = inject(Auth);

  /* Signals */
  isOpen = signal(false);
  loading = signal(false);
  error = signal('');
  groups = signal<GroupApi[]>([]);
  requested = signal<Set<number>>(new Set());

  /* Modal Functions */
  openModal(): void {
    this.isOpen.set(true);
    this.load();
  }

  closeModal(): void {
    this.isOpen.set(false);
    this.error.set('');
    this.groups.set([]);
    this.requested.set(new Set());
  }

  /* Load discoverable groups into local variable from group service */
  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.groupsService.getDiscoverGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load discoverable groups', error);
        this.error.set('Failed to load servers');
        this.loading.set(false);
      },
    });
  }

  /*  */
  requestToJoin(group: GroupApi): void {
    if (this.isRequested(group.id)) return;
    this.groupsService.requestToJoin(group.id);

    const set = new Set(this.requested());
    set.add(group.id);
    this.requested.set(set);
  }

  isRequested(groupId: number): boolean {
    const userId = this.authService.getUserId();
    if (!userId) return false;

    const group = this.groups().find((g) => g.id === groupId);
    const serverRequested = group?.requests?.includes(userId) === true;
    const locallyRequested = this.requested().has(groupId);
    return serverRequested || locallyRequested;
  }
}
