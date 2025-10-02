const express = require('express');
const router = express.Router();
const { getDB } = require('../db.js');

// GET /api/users/1
router.get('/:id', async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const db = getDB();
    const usersColl = db.collection('users');

    const user = await usersColl.findOne({ id: userId });
    return user ? res.success(user) : res.fail(404, 'User not found');
  } catch (error) {
    console.error('Failed to get user from id: ', userId);
    return res.fail(500, 'Failed to fetch user');
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  const { ids } = req.query;
  try {
    const db = getDB();
    const usersColl = db.collection('users');

    if (ids) {
      // GET /api/users?ids=1,2,3
      const userIds = ids.split(',').map((id) => Number(id));
      const filteredUsers = await usersColl.find({ id: { $in: userIds } }).toArray();
      return res.success(filteredUsers);
    }
    // GET /api/users
    const allUsers = await usersColl.find({}).toArray();
    console.log(`USERS  | Loaded ${allUsers.length} users`);
    return res.success(allUsers);
  } catch (error) {
    console.error('Error fetching users: ', error);
    return res.fail(500, 'Failed to fetch users');
  }
});

// GET /api/users/check-username/:username
router.get('/check-username/:username', async (req, res) => {
  const username = req.params.username.toLowerCase().trim();
  if (!username) return res.fail(400, 'Username is required');

  try {
    const db = getDB();
    const usersColl = db.collection('users');

    const existingUser = await usersColl.findOne({ username: username });
    return res.success({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking username: ', error);
    res.fail(500, 'Failed to check username');
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const db = getDB();
    const usersColl = db.collection('users');

    // Check if user exists
    const existingUser = await usersColl.findOne({ id: userId });
    if (!existingUser) return res.fail(404, 'User not found');

    // Update the user in MongoDB
    const updateResult = await usersColl.updateOne({ id: userId }, { $set: req.body });

    if (updateResult.modifiedCount === 0) return res.fail(400, 'No changes made');

    // Get the updated user
    const updatedUser = await usersColl.findOne({ id: userId });
    return res.success(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.fail(500, 'Failed to update user');
  }
});

// POST /api/users (Create new user)
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const usersColl = db.collection('users');

    const { username, email, image, password, birthdate, age, roles } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.fail(400, 'Username, email, and password are required');
    }

    // Check if username already exists
    const existingUser = await usersColl.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.fail(400, 'Username already exists');

    // Generate new ID
    const last = await usersColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newId = (last[0]?.id || 0) + 1;

    // Create new user
    const newUser = {
      id: newId,
      username: username,
      email: email,
      image: image || '',
      password: password,
      birthdate: birthdate || '',
      age: age || null,
      roles: roles || ['user'],
      valid: true,
      banned: false,
      reported: false,
    };

    // Add to users array
    await usersColl.insertOne(newUser);
    // Return user without password
    const { password: _, ...userResponse } = newUser;
    console.log(`USER  | User created successfully, ID: ${newUser.id}`);
    return res.created(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.fail(500, 'Failed to create user');
  }
});

router.post('/:id/report', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const db = getDB();
    const usersColl = db.collection('users');

    const existingUser = await usersColl.findOne({ id: userId });
    if (!existingUser) return res.fail(404, 'User not found');

    const updateResult = await usersColl.updateOne({ id: userId }, { $set: { reported: true } });

    if (updateResult.modifiedCount === 0) return res.fail(400, 'No changes made');
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error updating user report: ', error);
    return res.fail(500, 'Failed to set report');
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const db = getDB();
    const usersColl = db.collection('users');
    const groupsColl = db.collection('groups');

    const existingUser = await usersColl.findOne({ id: userId });
    if (!existingUser) return res.fail(404, 'User not found');

    // 1. Remove user from users collection
    await usersColl.deleteOne({ id: userId });

    // 2. Remove user from all groups (members and admins)
    await groupsColl.updateMany(
      {},
      {
        $pull: {
          members: userId,
          admins: userId,
        },
      }
    );

    // 3. Delete groups owned by this user
    const ownedGroups = await groupsColl.find({ owner: userId }).toArray();
    const ownedGroupIds = ownedGroups.map((group) => group.id);

    if (ownedGroupIds.length > 0) {
      const channelsColl = db.collection('channels');
      const messagesColl = db.collection('messages');

      // Get all channels in owned groups
      const groupChannels = await channelsColl.find({ groupId: { $in: ownedGroupIds } }).toArray();
      const channelIds = groupChannels.map((channel) => channel.id);

      // Delete all messages from owned groups
      if (channelIds.length > 0) {
        const deletedMessages = await messagesColl.deleteMany({ channelId: { $in: channelIds } });
        console.log(
          `USER CLEANUP | Deleted ${deletedMessages.deletedCount} messages from user ${userId}'s groups`
        );
      }

      // Delete all channels from owned groups
      const deletedChannels = await channelsColl.deleteMany({ groupId: { $in: ownedGroupIds } });
      console.log(
        `USER CLEANUP | Deleted ${deletedChannels.deletedCount} channels from user ${userId}'s groups`
      );
    }

    await groupsColl.deleteMany({ owner: userId });

    console.log(`USER | User ID ${userId} deleted successfully`);
    return res.success({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.fail(500, 'Failed to delete user');
  }
});

module.exports = router;
