import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverGroupsModal } from './discover-groups-modal';

describe('DiscoverGroupsModal', () => {
  let component: DiscoverGroupsModal;
  let fixture: ComponentFixture<DiscoverGroupsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverGroupsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoverGroupsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
