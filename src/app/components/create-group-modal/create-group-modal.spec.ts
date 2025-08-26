import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupModal } from './create-group-modal';

describe('CreateGroupModal', () => {
  let component: CreateGroupModal;
  let fixture: ComponentFixture<CreateGroupModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGroupModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGroupModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
