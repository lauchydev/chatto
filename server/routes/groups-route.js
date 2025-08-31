const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Group = require('../data/groups/group.js');
const e = require('express');
let groups = JSON.parse(require('../read-json.js').readJsonAsString('./data/groups/groups.json'));
const groupsPath = path.join(__dirname, '../data/groups/groups.json');

/**
 *
 *        GET
 *
 */

/**
 *  Get global group lists
 */
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    return res.fail(400, 'User ID Required');
  }

  const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.fail(404, 'User not found');
  }

  let filteredGroups;

  if (user.roles.includes('superadmin')) {
    // Access to all  groups
    filteredGroups = groups;
  } else if (user.roles.includes('groupadmin')) {
    // Access to groups where admin/owner/member
    filteredGroups = groups.filter(
      (group) =>
        group.owner === user.id || group.admins.includes(userId) || group.members.includes(userId)
    );
  } else {
    // Access to groups where member
    filteredGroups = groups.filter((group) => group.members.includes(userId));
  }

  return res.success(filteredGroups);
});

/**
 *  Get list of servers able to request to join
 */
router.get('/discover', (req, res) => {
  const userId = parseInt(req.query.userId);
  /* Validate User ID */
  if (!userId) return res.fail(400, 'User ID Required');

  /* Get list of groups user is not a member of */
  try {
    const availGroups = groups.filter(
      (g) => !g.members.includes(userId) && !(g.banned || []).includes(userId)
    );
    return res.success(availGroups);
  } catch (error) {
    console.error('Error loading discoverable groups: ', error);
    return res.fail(500, 'Failed to load discoverable groups');
  }
});

/**
 *
 *        POST
 *
 */

/**
 * Create a group
 */
router.post('/', (req, res) => {
  try {
    const { name, id, image } = req.body;

    if (!name || !name.trim()) {
      return res.fail(400, 'Group name is required');
    }

    if (!id) {
      return res.fail(400, 'Group owner ID is not valid');
    }
    const ownerId = Number(id);
    if (!Number.isInteger(ownerId)) {
      return res.fail(400, 'Group owner ID is not valid');
    }

    const users = JSON.parse(
      require('../read-json.js').readJsonAsString('./data/users/users.json')
    );
    const superAdminIds = users.filter((u) => u.roles.includes('superadmin')).map((u) => u.id);

    const newId = Math.max(...groups.map((g) => g.id), 0) + 1;
    const newGroup = {
      id: newId,
      name: name.trim(),
      icon: image || '',
      owner: ownerId,
      members: [ownerId],
      admins: Array.from(new Set([ownerId, ...superAdminIds])),
      channels: [],
      requests: [],
      banned: [],
    };

    groups.push(newGroup);
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

    return res.created(newGroup);
  } catch (error) {
    console.error('Error creating group: ', error);
    return res.fail(500, 'Failed to create group');
  }
});

/**
 * Update a group
 */
router.put('/:id', (req, res) => {
  const groupId = parseInt(req.params.id);
  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Invalid group ID');
  }

  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return res.fail(404, 'Group not found');
  }

  const { name, image, icon } = req.body || {};
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      return res.fail(400, 'Group name is required');
    }
    group.name = trimmed;
  }

  if (image !== undefined) {
    group.icon = image;
  }
  if (icon !== undefined) {
    group.icon = icon;
  }

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.success(group);
  } catch (error) {
    console.error('Error updating group: ', error);
    return res.fail(500, 'Failed to update group');
  }
});

/**
 *  Add user to groups join requests
 */
router.post('/:groupId/requests', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const { userId } = req.body;
  const uid = Number(userId);

  /* Validate User ID and Group ID */
  if (!Number.isInteger(uid) || !Number.isInteger(groupId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  /* Get the group being requested */
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return res.fail(404, 'Group not found');
  }

  group.banned = Array.isArray(group.banned) ? group.banned : [];
  if (group.banned.includes(uid)) {
    return res.fail(403, 'User is banned from this group');
  }

  /* Add user to group join requests list */
  group.requests = Array.isArray(group.requests) ? group.requests : [];
  if (!group.requests.includes(uid)) {
    group.requests.push(uid);
  }

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.created({ ok: true });
  } catch (error) {
    console.error('Error saving join request: ', error);
    return res.fail(500, 'Failed to save join request');
  }
});

/**
 *  Approve a users group join request
 */
router.post('/:groupId/requests/:userId/approve', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group not found');

  group.requests = Array.isArray(group.requests) ? group.requests : [];
  group.members = Array.isArray(group.members) ? group.members : [];
  group.requests = group.requests.filter((id) => id !== userId);
  if (!group.members.includes(userId)) group.members.push(userId);

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error approving join request: ', error);
    return res.fail(500, 'Failed to approve join request');
  }
});

/**
 *  Ban a user from a group
 */
router.post('/:groupId/ban/:userId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group not found');

  if (group.owner === userId) {
    return res.fail(400, 'Cannot ban the group owner');
  }

  group.members = (group.members || []).filter((m) => m !== userId);
  group.admins = (group.admins || []).filter((a) => a !== userId);
  group.requests = (group.requests || []).filter((r) => r !== userId);
  group.banned = Array.isArray(group.banned) ? group.banned : [];
  if (!group.banned.includes(userId)) group.banned.push(userId);

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error banning user: ', error);
    return res.fail(500, 'Failed to ban user');
  }
});

/**
 *
 *        DELETE
 *
 */

/**
 *  Remove a user from a single group
 */
router.delete('/:groupId/users/:userId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);

  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group not found');

  if (group.owner === userId) {
    return res.status(400).json({ error: 'Cannot remove the group owner' });
  }

  group.members = (group.members || []).filter((m) => m !== userId);
  group.admins = (group.admins || []).filter((a) => a !== userId);

  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  return res.success({ message: 'User removed from group' });
});

/**
 *  Remove a user from all groups (User Deleted)
 */
router.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  groups.forEach((group) => {
    group.members = group.members.filter((m) => m !== userId);
  });
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  return res.success({ message: 'User removed from all groups' });
});

/**
 * Delete a group
 */
router.delete('/delete/:groupId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  groups = groups.filter((g) => g.id !== groupId);
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  return res.success({ message: 'Group deleted' });
});

/**
 *  Reject a group join request
 */
router.delete('/:groupId/requests/:userId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }
  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group not found');

  group.requests = Array.isArray(group.requests) ? group.requests : [];
  group.requests = group.requests.filter((id) => id !== userId);

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error rejecting join request: ', error);
    return res.fail(500, 'Failed to reject join request');
  }
});

/**
 *  Unban a user from a group
 */
router.delete('/:groupId/ban/:userId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group not found');

  group.banned = Array.isArray(group.banned) ? group.banned : [];
  group.banned = group.banned.filter((id) => id !== userId);

  try {
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error unbanning user: ', error);
    return res.fail(500, 'Failed to unban user');
  }
});

module.exports = router;
