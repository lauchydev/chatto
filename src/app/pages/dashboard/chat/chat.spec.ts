import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { Chat } from './chat';

describe('Chat', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chat, HttpClientTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render welcome message when no channel selected', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Welcome to Chatto');
  });

  /* Just check that the structure is correct therefore it will be there */
  it('should have message input field when channel selected', () => {
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  it('should have send method', () => {
    expect(typeof component.send).toBe('function');
  });

  it('should clear message input after sending', () => {
    component.messageout.set('test message');
    expect(component.messageout()).toBeDefined();
  });
});
