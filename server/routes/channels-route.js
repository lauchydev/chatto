const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const channelsPath = path.join(__dirname, '../data/channels/channels.json');
const groupsPath = path.join(__dirname, '../data/groups/groups.json');

const loadChannels = () =>
  JSON.parse(require('../read-json.js').readJsonAsString('./data/channels/channels.json'));

const loadGroups = () =>
  JSON.parse(require('../read-json.js').readJsonAsString('./data/groups/groups.json'));

/* Routes */

/**
 * Get Channels
 */
router.get('/', (req, res) => {
  const groupId = parseInt(req.query.groupId, 10);
  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Group ID is required');
  }

  const group = loadGroups().find((g) => g.id === groupId);
  if (!group) {
    return res.fail(404, 'Group does not exist');
  }

  const channels = loadChannels();
  return res.success(channels.filter((c) => c.groupId === groupId));
});

/**
 * Create Channel
 */
router.post('/', (req, res) => {
  let name = (req.body.name || '').trim();
  name = name.replace(' ', '-');
  const groupId = parseInt(req.body.groupId, 10);

  if (!name) {
    return res.fail(400, 'Name is invalid');
  }

  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Group ID is invalid');
  }

  const groups = loadGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.fail(404, 'Group does not exist');

  const channels = loadChannels();
  const maxId = channels.length ? Math.max(...channels.map((c) => c.id)) : 0;
  const newId = maxId + 1;

  const channel = { id: newId, name, groupId };
  channels.push(channel);
  fs.writeFileSync(channelsPath, JSON.stringify(channels, null, 2));

  group.channels = Array.isArray(group.channels) ? group.channels : [];
  if (!group.channels.includes(newId)) {
    group.channels.push(newId);
  }

  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

  return res.created(channel);
});

/**
 * Delete Channel
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId, 10); // pass from frontend

  if (!Number.isInteger(id)) {
    return res.fail(400, 'Channel ID is invalid');
  }
  if (!Number.isInteger(userId)) {
    return res.fail(400, 'User ID is invalid');
  }

  const channels = loadChannels();
  const index = channels.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.fail(404, 'Channel not found');
  }
  const removed = channels[index];

  // Load users and groups to check permissions
  const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.fail(404, 'User not found');
  }

  const groups = loadGroups();
  const group = groups.find((g) => g.id === removed.groupId);
  if (!group) {
    return res.fail(404, 'Parent group not found');
  }

  const isSuper = user.roles?.includes('superadmin');
  const isOwner = group.owner === userId;
  const isAdmin = Array.isArray(group.admins) && group.admins.includes(userId);
  if (!isSuper && !isOwner && !isAdmin) {
    return res.fail(403, 'Not authorized to delete this channel');
  }

  // Remove channel and persist
  channels.splice(index, 1);
  fs.writeFileSync(channelsPath, JSON.stringify(channels, null, 2));

  // Remove reference from group
  if (Array.isArray(group.channels)) {
    group.channels = group.channels.filter((cid) => cid !== id);
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  }

  return res.noContent();
});

module.exports = router;
