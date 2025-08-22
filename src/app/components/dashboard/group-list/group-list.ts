import { Component, inject, OnInit } from '@angular/core';
import { Groups } from '../../../services/groups.service';
import { Group, GroupApi } from '../../../model/group.interface';

@Component({
  selector: 'app-group-list',
  imports: [],
  templateUrl: './group-list.html',
  styleUrl: './group-list.css',
})
export class GroupList implements OnInit {
  private groupsService = inject(Groups);

  groups: GroupApi[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.error = '';

    this.groupsService.getUserGroups().subscribe({
      next: (groups: GroupApi[]) => {
        this.groups = groups;
        this.loading = false;
      },

      error: (error) => {
        console.error('Error loading groups: ', error);
        this.error = 'Failed loading groups';
        this.loading = false;
      },
    });
  }
}
