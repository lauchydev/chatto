const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

/**
 *
 *        GET
 *
 */

/**
 *  Get global group lists
 */
router.get('/', async (req, res) => {
  const userId = Number(req.query.userId);

  if (!Number.isInteger(userId)) {
    return res.fail(400, 'User ID Required');
  }

  try {
    const db = getDB();
    const usersColl = db.collection('users');
    const groupsColl = db.collection('groups');

    const user = await usersColl.findOne({ id: userId });
    if (!user) {
      return res.fail(404, 'User not found');
    }

    let filter = {};
    if (Array.isArray(user.roles) && user.roles.includes('superadmin')) {
      filter = {};
    } else if (Array.isArray(user.roles) && user.roles.includes('groupadmin')) {
      filter = { $or: [{ owner: user.id }, { admins: userId }, { members: userId }] };
    } else {
      filter = { members: userId };
    }

    const filteredGroups = await groupsColl.find(filter).toArray();
    console.log(`SERVER | Loaded ${filteredGroups.length} groups`);
    return res.success(filteredGroups);
  } catch (error) {
    console.error('Error loading groups from MongoDB: ', error);
    return res.fail(500, 'Failed to load groups');
  }
});

/**
 *  Get list of servers able to request to join
 */
router.get('/discover', async (req, res) => {
  const userId = Number(req.query.userId);
  /* Validate User ID */
  if (!Number.isInteger(userId)) return res.fail(400, 'User ID Required');

  /* Get list of groups user is not a member of and not banned from */
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const filter = {
      members: { $nin: [userId] },
      banned: { $nin: [userId] },
    };

    const availGroups = await groupsColl.find(filter).toArray();
    console.log(`DISCOVER | Loaded ${availGroups.length} groups`);
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
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    const usersColl = db.collection('users');

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

    /* Find all users with super admin role and only return id (1 = true | 0 = false) */
    const superAdmins = await usersColl
      .find({ roles: 'superadmin' }, { projection: { id: 1 } })
      .toArray();

    const superAdminIds = superAdmins.map((u) => u.id);

    /**
     *  Get last group ID by:
     *  Get list of group ID's -> sort it from last to first -> limit to 1 group
     */
    const last = await groupsColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newId = (last[0]?.id || 0) + 1;

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

    await groupsColl.insertOne(newGroup);
    return res.created(newGroup);
  } catch (error) {
    console.error('Error creating group: ', error);
    return res.fail(500, 'Failed to create group');
  }
});

/**
 * Update a group
 */
router.put('/:id', async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Invalid group ID');
  }
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });

    if (!group) {
      return res.fail(404, 'Group not found');
    }

    const { name, icon } = req.body || {};
    const update = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.fail(400, 'Group name is required');
      }
      update.name = trimmed;
    }

    if (icon !== undefined) {
      update.icon = icon;
    }

    /* Check if there arent any updated to process and return */
    if (Object.keys(update).length === 0) {
      return res.success(group);
    }

    /* Process the updates */
    const result = await groupsColl.findOneAndUpdate(
      { id: groupId },
      /* Name and Icon are the only modifiable fields (At the moment) */
      { $set: { name: update.name, icon: update.icon } },
      /* Return after so the updated group is visible immediately */
      { returnDocument: 'after' }
    );

    return res.success(result.value);
  } catch (error) {
    console.error('Error updating group: ', error);
    return res.fail(500, 'Failed to update group');
  }
});

/**
 *  Add user to groups join requests
 */
router.post('/:groupId/requests', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const { userId } = req.body;
  const uid = Number(userId);

  /* Validate User ID and Group ID */
  if (!Number.isInteger(uid) || !Number.isInteger(groupId)) {
    return res.fail(400, 'Invalid group or user ID');
  }
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    /* Get the group being requested */
    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');
    if (group.banned.includes(uid)) return res.fail(403, 'User is banned from this group');
    if (group.members.includes(uid)) return res.fail(400, 'User is already a member');

    /* Add user to group join requests list */
    await groupsColl.updateOne({ id: groupId }, { $addToSet: { requests: uid } });

    return res.created({ ok: true });
  } catch (error) {
    console.error('Error saving join request: ', error);
    return res.fail(500, 'Failed to save join request');
  }
});

/**
 *  Approve a users group join request
 */
router.post('/:groupId/requests/:userId/approve', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');
    if (group.banned.includes(userId)) {
      return res.fail(403, 'User is banned from this group');
    }

    /* Add user to group and remove request from list */
    const result = await groupsColl.findOneAndUpdate(
      { id: groupId, requests: userId },
      /* Pull user request from list, add user to members list */
      { $pull: { requests: userId }, $addToSet: { members: userId } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.fail(400, 'No pending request for this user');
    }

    return res.success({ ok: true });
  } catch (error) {
    console.error('Error approving join request: ', error);
    return res.fail(500, 'Failed to approve join request');
  }
});

/**
 *  Ban a user from a group
 */
router.post('/:groupId/ban/:userId', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');
    if (group.owner === userId) return res.fail(400, 'Cannot ban the group owner');

    const result = await groupsColl.findOneAndUpdate(
      { id: groupId, banned: { $ne: userId } },
      {
        $pull: { requests: userId, members: userId, admins: userId },
        $addToSet: { banned: userId },
      },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.fail(400, 'User already banned');

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
router.delete('/:groupId/users/:userId', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');

    if (group.owner === userId) {
      return res.fail(400, 'Cannot remove the group owner');
    }

    await groupsColl.updateOne({ id: groupId }, { $pull: { members: userId, admins: userId } });

    return res.success({ message: 'User removed from group' });
  } catch (error) {
    console.error('Error removing user from group: ', error);
    return res.fail(500, 'Failed to remove user from group');
  }
});

/**
 *  Remove a user from all groups (User Deleted)
 */
router.delete('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) return res.fail(400, 'Invalid user ID');

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    await groupsColl.updateMany(
      {},
      { $pull: { members: userId, admins: userId, requests: userId } }
    );

    return res.success({ message: 'User removed from all groups' });
  } catch (error) {
    console.error('Error deleting user: ', error);
    return res.fail(500, 'Failed to remove user from groups');
  }
});

/**
 * Delete a group
 */
router.delete('/delete/:groupId', async (req, res) => {
  const groupId = Number(req.params.groupId);
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    await groupsColl.deleteOne({ id: groupId });
    return res.success({ message: 'Group deleted' });
  } catch (error) {
    console.error('Error deleting group: ', error);
    return res.fail(500, 'Failed to delete group');
  }
});

/**
 *  Reject a group join request
 */
router.delete('/:groupId/requests/:userId', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');

    const result = await groupsColl.updateOne(
      { id: groupId, requests: userId },
      { $pull: { requests: userId } }
    );

    if (result.matchedCount === 0) return res.fail(400, 'User has no join request');

    return res.success({ ok: true });
  } catch (error) {
    console.error('Error rejecting join request: ', error);
    return res.fail(500, 'Failed to reject join request');
  }
});

/**
 *  Unban a user from a group
 */
router.delete('/:groupId/ban/:userId', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.fail(400, 'Invalid group or user ID');
  }

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group not found');

    const result = await groupsColl.updateOne(
      { id: groupId, banned: userId },
      { $pull: { banned: userId } }
    );

    if (result.matchedCount === 0) return res.fail(400, 'User is not banned');
    return res.success({ ok: true });
  } catch (error) {
    console.error('Error unbanning user: ', error);
    return res.fail(500, 'Failed to unban user');
  }
});

module.exports = router;
