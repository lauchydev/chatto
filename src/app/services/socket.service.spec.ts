import { TestBed } from '@angular/core/testing';

import { SocketService } from './socket.service';

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('channel management', () => {
    it('should track current channel ID when joining', () => {
      service.joinChannel(1, 1, 'testuser');
      expect(service.getCurrentChannelId()).toBe(1);
    });

    it('should clear current channel ID when leaving', () => {
      service.joinChannel(1, 1, 'testuser');
      service.leaveChannel(1);
      expect(service.getCurrentChannelId()).toBeNull();
    });

    it('should leave previous channel when joining new one', () => {
      service.joinChannel(1, 1, 'testuser');
      expect(service.getCurrentChannelId()).toBe(1);

      service.joinChannel(2, 1, 'testuser');
      expect(service.getCurrentChannelId()).toBe(2);
    });
  });

  describe('observable methods', () => {
    it('should return Observable from onMessage', () => {
      const messageObservable = service.onMessage();
      expect(messageObservable.subscribe).toBeDefined();
    });

    it('should return Observable from onUserJoinedChannel', () => {
      const joinedObservable = service.onUserJoinedChannel();
      expect(joinedObservable.subscribe).toBeDefined();
    });

    it('should return Observable from onGroupCreated', () => {
      const createdObservable = service.onGroupCreated();
      expect(createdObservable.subscribe).toBeDefined();
    });
  });

  describe('message methods', () => {
    it('should have sendMessage method', () => {
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should have deleteMessage method', () => {
      expect(typeof service.deleteMessage).toBe('function');
    });
  });
});
