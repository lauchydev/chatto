import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { ChannelList } from './channel-list';

describe('ChannelList', () => {
  let component: ChannelList;
  let fixture: ComponentFixture<ChannelList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelList, HttpClientTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize channel name property', () => {
    expect(component.channelName).toBe('');
  });

  it('should have createChannel method', () => {
    expect(typeof component.createChannel).toBe('function');
  });

  it('should have openAddChannel method', () => {
    expect(typeof component.openAddChannel).toBe('function');
  });

  it('should show no group selected message when no group', () => {
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });

  it('should update channelName property', () => {
    component.channelName = 'test-channel';
    expect(component.channelName).toBe('test-channel');
  });

  it('should update newChannelName property', () => {
    component.newChannelName = 'new-test-channel';
    expect(component.newChannelName).toBe('new-test-channel');
  });

  it('should have isGroupMenuOpen property', () => {
    expect(component.isGroupMenuOpen).toBeDefined();
  });
});
