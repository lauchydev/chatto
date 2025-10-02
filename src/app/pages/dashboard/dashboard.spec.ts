import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

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
      imports: [Dashboard, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    (localStorage.getItem as jasmine.Spy).and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dashboard layout', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.flex')).toBeTruthy();
  });

  it('should contain group list component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-group-list')).toBeTruthy();
  });

  it('should contain channel list component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-channel-list')).toBeTruthy();
  });

  it('should contain chat component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-chat')).toBeTruthy();
  });

  it('should contain user list component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-user-list')).toBeTruthy();
  });

  it('should have proper layout structure', () => {
    const compiled = fixture.nativeElement;
    const mainContainer = compiled.querySelector('.flex.h-screen');
    expect(mainContainer).toBeTruthy();
  });
});
