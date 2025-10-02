import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CreateGroupModal } from './create-group-modal';

describe('CreateGroupModal', () => {
  let component: CreateGroupModal;
  let fixture: ComponentFixture<CreateGroupModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGroupModal, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateGroupModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
