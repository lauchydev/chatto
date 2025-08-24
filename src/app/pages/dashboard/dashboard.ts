import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupList } from './group-list/group-list';
import { ChannelList } from './channel-list/channel-list';
import { Chat } from './chat/chat';
import { UserList } from './user-list/user-list';
import { Groups } from '../../services/groups.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, GroupList, ChannelList, Chat, UserList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
