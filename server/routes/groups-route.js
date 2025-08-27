const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Group = require('../data/groups/group.js');
const groups = JSON.parse(require('../read-json.js').readJsonAsString('./data/groups/groups.json'));

// Get group list
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    return res.status(400).send({ error: 'User ID Required' });
  }

  const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
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

  res.send(filteredGroups);
});

/* Create a group */
router.post('/', (req, res) => {
  try {
    const { name, id, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Group owner ID is not valid' });
    }

    const newId = Math.max(...groups.map((g) => g.id), 0) + 1;

    const newGroup = {
      id: newId,
      name: name.trim(),
      icon: image || '',
      owner: id,
      members: [id],
      admins: [id],
      channels: [],
    };

    groups.push(newGroup);

    const groupsPath = path.join(__dirname, '../data/groups/groups.json');
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group: ', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Delete a user from a group
router.delete('/:groupId/users/:userId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.params.userId);

  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.members = group.members.filter((m) => m !== userId);
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

  res.status(200).json({ message: 'User removed from group' });
});

// Delete a user from all groups
router.delete('/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  groups.forEach((group) => {
    group.members = group.members.filter((m) => m !== userId);
  });
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  res.status(200).json({ message: 'User removed from all groups' });
});

// Delete a group
router.delete('/:groupId', (req, res) => {
  const groupId = parseInt(req.params.groupId);
  groups = groups.filter((g) => g.id !== groupId);
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
  res.status(200).json({ message: 'Group deleted' });
});

// get group by id

module.exports = router;
