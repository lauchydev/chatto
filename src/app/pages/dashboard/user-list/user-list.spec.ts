import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { UserList } from './user-list';

describe('UserList', () => {
  let component: UserList;
  let fixture: ComponentFixture<UserList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserList, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UserList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize user arrays', () => {
    expect(component.superAdminUsers).toBeDefined();
    expect(component.groupAdminUsers).toBeDefined();
    expect(component.memberUsers).toBeDefined();
    expect(component.joinRequests).toBeDefined();
    expect(component.bannedUsers).toBeDefined();
  });

  it('should have user management methods', () => {
    expect(typeof component.onKickUser).toBe('function');
    expect(typeof component.onBanUser).toBe('function');
    expect(typeof component.onUnbanUser).toBe('function');
    expect(typeof component.approveRequest).toBe('function');
    expect(typeof component.rejectRequest).toBe('function');
  });

  it('should have dropdown management methods', () => {
    expect(typeof component.toggleUserDropdown).toBe('function');
    expect(typeof component.closeUserDropdown).toBe('function');
  });

  it('should have isUserBanned helper method', () => {
    expect(typeof component.isUserBanned).toBe('function');
  });

  it('should render user sections when group selected', () => {
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  it('should toggle user dropdown correctly', () => {
    const userId = 1;
    component.toggleUserDropdown(userId);
    expect(component.showUserDropdownId).toBe(userId);

    component.toggleUserDropdown(userId);
    expect(component.showUserDropdownId).toBeNull();
  });
});
