import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GroupList } from './group-list';

describe('GroupList', () => {
  let component: GroupList;
  let fixture: ComponentFixture<GroupList>;

  beforeEach(async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      groups: [1, 2],
      valid: true,
      banned: false,
    };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

    await TestBed.configureTestingModule({
      imports: [GroupList, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up localStorage mock
    (localStorage.getItem as jasmine.Spy).and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render profile dropdown toggle', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('img')).toBeTruthy();
  });

  it('should render group list container', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.space-y-2')).toBeTruthy();
  });

  it('should have discover groups modal', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-discover-groups-modal')).toBeTruthy();
  });

  it('should toggle profile dropdown state', () => {
    const initialState = component.isProfileDropdown;
    component.toggleProfileDropdown();
    expect(component.isProfileDropdown).toBe(!initialState);
  });
});
