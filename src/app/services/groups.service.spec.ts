import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Groups } from './groups.service';
import { GroupApi } from '../model/group.interface';

describe('Groups', () => {
  let service: Groups;
  let httpMock: HttpTestingController;

  const mockGroups: GroupApi[] = [
    {
      id: 1,
      name: 'Test Group 1',
      channels: [],
      owner: 1,
      members: [1],
      admins: [1],
      requests: [],
      banned: [],
    },
    {
      id: 2,
      name: 'Test Group 2',
      channels: [],
      owner: 2,
      members: [1, 2],
      admins: [2],
      requests: [],
      banned: [],
    },
  ];

  beforeEach(() => {
    // Mock user data in localStorage
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

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Groups);
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
    it('should initialize with empty groups array', () => {
      expect(service.groups()).toEqual([]);
    });
  });

  describe('selectGroup', () => {
    it('should update selected group ID', () => {
      service.selectGroup(1);
      expect(service.selectedGroupId()).toBe(1);
    });

    it('should return selected group object', () => {
      service.loadGroups();
      const req = httpMock.expectOne('http://localhost:3000/api/groups?userId=1');
      req.flush(mockGroups);

      // Then select a group
      service.selectGroup(1);
      const selectedGroup = service.getSelectedGroup();
      expect(selectedGroup?.id).toBe(1);
      expect(selectedGroup?.name).toBe('Test Group 1');
    });
  });

  describe('loadGroups', () => {
    it('should load groups successfully', () => {
      service.loadGroups();

      const req = httpMock.expectOne('http://localhost:3000/api/groups?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockGroups);

      expect(service.groups()).toEqual(mockGroups);
      expect(service.error()).toBe('');
    });

    it('should handle error when loading groups fails', () => {
      service.loadGroups();

      const req = httpMock.expectOne('http://localhost:3000/api/groups?userId=1');
      req.error(new ErrorEvent('Network error'));

      expect(service.error()).toContain('Failed loading groups');
      expect(service.loading()).toBeFalsy();
    });
  });

  describe('refreshGroups', () => {
    it('should reload groups data', () => {
      service.refreshGroups();

      const req = httpMock.expectOne('http://localhost:3000/api/groups?userId=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockGroups);

      expect(service.groups()).toEqual(mockGroups);
    });
  });
});
