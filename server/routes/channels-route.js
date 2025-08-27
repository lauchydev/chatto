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

/* Check if the user is the owner of the group */
const isGroupOwner = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const group = await Groups.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const superAdmin = req.user.roles.includes('superAdmin');
    const ownerId = group.owner?._id ? group.owner._id : group.owner;
    const groupOwner = req.user._id === ownerId;

    if (superAdmin || groupOwner) {
      req.group = group;
      return next();
    }

    return res.status(401).json({ message: 'You do not have permission to modify this group.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error checking group ownership' });
  }
};

/**
 * Get Channels
 */
router.get('/', (req, res) => {
  const groupId = parseInt(req.query.groupId, 10);
  if (!Number.isInteger(groupId)) {
    return res.status(400).send({ error: 'Group ID is required' });
  }

  const group = loadGroups().find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).send({ error: 'Group does not exist' });
  }

  const channels = loadChannels();
  res.send(channels.filter((c) => c.groupId === groupId));
});

/**
 * Create Channel
 */
router.post('/', (req, res) => {
  let name = (req.body.name || '').trim();
  name = name.replace(' ', '-');
  const groupId = parseInt(req.body.groupId, 10);

  if (!name) {
    return res.status(400).send({ error: 'Name is invalid' });
  }

  if (!Number.isInteger(groupId)) {
    return res.status(400).send({ error: 'Group ID is invalid' });
  }

  const groups = loadGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).send({ error: 'Group does not exist' });

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

  res.status(201).json(channel);
});

/**
 * Delete Channel
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId, 10); // pass from frontend

  if (!Number.isInteger(id)) {
    return res.status(400).send({ error: 'Channel ID is invalid' });
  }
  if (!Number.isInteger(userId)) {
    return res.status(400).send({ error: 'User ID is invalid' });
  }

  const channels = loadChannels();
  const index = channels.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).send({ error: 'Channel not found' });
  }
  const removed = channels[index];

  // Load users and groups to check permissions
  const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }

  const groups = loadGroups();
  const group = groups.find((g) => g.id === removed.groupId);
  if (!group) {
    return res.status(404).send({ error: 'Parent group not found' });
  }

  const isSuper = user.roles?.includes('superadmin');
  const isOwner = group.owner === userId;
  const isAdmin = Array.isArray(group.admins) && group.admins.includes(userId);
  if (!isSuper && !isOwner && !isAdmin) {
    return res.status(403).send({ error: 'Not authorized to delete this channel' });
  }

  // Remove channel and persist
  channels.splice(index, 1);
  fs.writeFileSync(channelsPath, JSON.stringify(channels, null, 2));

  // Remove reference from group
  if (Array.isArray(group.channels)) {
    group.channels = group.channels.filter((cid) => cid !== id);
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  }

  return res.sendStatus(204);
});

module.exports = router;
