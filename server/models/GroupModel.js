const { getDB } = require('../db');

class GroupModel {
  // Group schema definition
  static schema = {
    id: 'int',
    name: 'string',
    icon: 'string',
    owner: 'int',
    members: 'Array',
    admins: 'Array',
    requests: 'Array',
    banned: 'Array',
    channels: 'Array',
  };

  /* Object for a new empty group to mutate */
  static newGroup(groupData) {
    return {
      id: groupData.id || 0,
      name: groupData.name || 'New Group',
      icon: groupData.icon || '',
      owner: groupData.owner || 1,
      members: Array.isArray(groupData.members) ? groupData.members : [],
      admins: Array.isArray(groupData.admins) ? groupData.admins : [],
      requests: Array.isArray(groupData.requests) ? groupData.requests : [],
      banned: Array.isArray(groupData.banned) ? groupData.banned : [],
      channels: Array.isArray(groupData.channels) ? groupData.channels : [],
    };
  }
}

module.exports = GroupModel;
