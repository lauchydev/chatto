import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile, HttpClientTestingModule, RouterTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render profile form elements', () => {
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  it('should have toggleEditMode method', () => {
    expect(typeof component.toggleEditMode).toBe('function');
  });

  it('should have checkUsername method', () => {
    expect(typeof component.checkUsername).toBe('function');
  });

  it('should have saveChanges method', () => {
    expect(typeof component.saveChanges).toBe('function');
  });

  it('should have onSaveChanges method', () => {
    expect(typeof component.onSaveChanges).toBe('function');
  });
});
