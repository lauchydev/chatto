import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ChannelsService } from './channels.service';
import { Channel } from '../model/channel.interface';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let httpMock: HttpTestingController;

  const mockChannels: Channel[] = [
    { id: 1, name: 'General', members: [1], groupId: 1 },
    { id: 2, name: 'Random', members: [1, 2], groupId: 1 },
  ];

  beforeEach(() => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      groups: [1],
      valid: true,
      banned: false,
    };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ChannelsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    (localStorage.getItem as jasmine.Spy).and.stub();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('should initialize with empty channels array', () => {
      expect(service.channels()).toEqual([]);
    });

    it('should initialize with no selected channel', () => {
      expect(service.selectedChannel()).toBeNull();
    });
  });

  describe('loadChannels', () => {
    it('should load channels for a group', () => {
      service.loadChannels(1);

      const req = httpMock.expectOne('http://localhost:3000/api/channels?groupId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockChannels);

      expect(service.channels()).toEqual(mockChannels);
    });

    it('should select first channel after loading', () => {
      service.loadChannels(1);

      const req = httpMock.expectOne('http://localhost:3000/api/channels?groupId=1');
      req.flush(mockChannels);

      expect(service.selectedChannel()).toBe(1);
    });
  });

  describe('selectChannel', () => {
    it('should update selected channel', () => {
      service.selectChannel(2);
      expect(service.selectedChannel()).toBe(2);
    });
  });

  describe('createChannel', () => {
    it('should call createChannel method', () => {
      spyOn(service, 'createChannel');
      service.createChannel('New Channel', 1);
      expect(service.createChannel).toHaveBeenCalledWith('New Channel', 1);
    });
  });

  describe('deleteChannel', () => {
    it('should call deleteChannel method', () => {
      spyOn(service, 'deleteChannel');
      service.deleteChannel(1);
      expect(service.deleteChannel).toHaveBeenCalledWith(1);
    });
  });
});
