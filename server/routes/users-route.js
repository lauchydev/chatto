const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));
const groups = JSON.parse(require('../read-json.js').readJsonAsString('./data/groups/groups.json'));

// GET /api/users/1
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find((user) => user.id === userId);
  return user ? res.success(user) : res.fail(404, 'User not found');
});

// GET /api/users
router.get('/', (req, res) => {
  const { ids } = req.query;

  if (ids) {
    // GET /api/users?ids=1,2,3
    const userIds = ids.split(',').map((id) => parseInt(id));
    const filteredUsers = users.filter((user) => userIds.includes(user.id));
    return res.success(filteredUsers);
  }
  // GET /api/users
  return res.success(users);
});

// GET /api/users/check-username/:username
router.get('/check-username/:username', (req, res) => {
  const username = req.params.username.toLowerCase().trim();

  if (!username) {
    return res.fail(400, 'Username is required');
  }
  const existingUser = users.find((user) => user.username.toLowerCase() === username);
  return res.success({ exists: !!existingUser });
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return res.fail(404, 'User not found');
  }
  users[userIndex] = { ...users[userIndex], ...req.body };
  const usersPath = path.join(__dirname, '../data/users/users.json');
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  return res.success(users[userIndex]);
});

// POST /api/users (Create new user)
router.post('/', (req, res) => {
  try {
    const { username, email, password, birthdate, age, roles, groups } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.fail(400, 'Username, email, and password are required');
    }

    // Check if username already exists
    const existingUser = users.find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return res.fail(400, 'Username already exists');
    }

    // Generate new ID
    const newId = Math.max(...users.map((u) => u.id), 0) + 1;

    // Create new user
    const newUser = {
      id: newId,
      username: username,
      email: email,
      password: password,
      birthdate: birthdate || '',
      age: age || null,
      roles: roles || ['user'],
      valid: true,
      banned: false,
      reported: false,
    };

    // Add to users array
    users.push(newUser);

    // Save to file
    const usersPath = path.join(__dirname, '../data/users/users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    // Return user without password
    const { password: _, ...userResponse } = newUser;
    return res.created(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.fail(500, 'Failed to create user');
  }
});

router.post('/:id/report', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return res.fail(404, 'User not found');

  users[userIndex].reported = true;

  const usersPath = path.join(__dirname, '../data/users/users.json');
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  return res.success({ ok: true });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return res.fail(404, 'User not found');
  }

  // 1. Remove user from users array
  users.splice(userIndex, 1);

  // 2. Remove user from all groups (members, admins, and handle ownership)
  const groupsPath = path.join(__dirname, '../data/groups/groups.json');
  let groupsToDelete = [];

  groups.forEach((group, index) => {
    // Remove from members array
    group.members = group.members.filter((memberId) => memberId !== userId);

    // Remove from admins array
    if (group.admins) {
      group.admins = group.admins.filter((adminId) => adminId !== userId);
    }

    if (group.owner === userId) {
      groupsToDelete.push(index);
    }
  });

  groupsToDelete.reverse().forEach((index) => {
    groups.splice(index, 1);
  });

  // 3. Save both files
  const usersPath = path.join(__dirname, '../data/users/users.json');
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

  return res.success({ message: 'User deleted successfully' });
});

module.exports = router;
