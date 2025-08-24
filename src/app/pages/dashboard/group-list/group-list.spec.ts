import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupList } from './group-list';

describe('GroupList', () => {
  let component: GroupList;
  let fixture: ComponentFixture<GroupList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
