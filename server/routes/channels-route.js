const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

/* Routes */

/**
 * Get Channels
 */
router.get('/', async (req, res) => {
  const groupId = Number(req.query.groupId, 10);
  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Group ID is required');
  }

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    const channelsColl = db.collection('channels');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group does not exist');

    const channels = await channelsColl.find({ groupId: groupId }).toArray();
    console.log(`GROUP  | ${group.name} | ${channels.length} channels loaded`);
    return res.success(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.fail(500, 'Internal server error');
  }
});

/**
 * Create Channel
 */
router.post('/', async (req, res) => {
  let name = (req.body.name || '').trim();
  name = name.replace(' ', '-');
  const groupId = Number(req.body.groupId, 10);

  if (!name) {
    return res.fail(400, 'Name is invalid');
  }

  if (!Number.isInteger(groupId)) {
    return res.fail(400, 'Group ID is invalid');
  }

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    const channelsColl = db.collection('channels');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return res.fail(404, 'Group does not exist');

    const channels = await channelsColl.find({ groupId: groupId }).toArray();
    const last = await channelsColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const newId = (last[0]?.id || 0) + 1;

    const newChannel = { id: newId, name, groupId };
    await channelsColl.insertOne(newChannel);

    // Update the group document to include the new channel ID
    await groupsColl.updateOne({ id: groupId }, { $addToSet: { channels: newId } });

    console.log(`GROUP  | ${group.name} | Channel '${newChannel.name}' created`);
    return res.created(newChannel);
  } catch (error) {
    console.error('CHANNEL | Error creating channel: ', error);
    return res.fail(500, 'Internal server error');
  }
});

/**
 * Delete Channel
 */
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id, 10);
  const userId = Number(req.query.userId, 10); // pass from frontend

  if (!Number.isInteger(id)) {
    return res.fail(400, 'Channel ID is invalid');
  }
  if (!Number.isInteger(userId)) {
    return res.fail(400, 'User ID is invalid');
  }

  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    const channelsColl = db.collection('channels');
    const usersColl = db.collection('users');

    // Find the specific channel to delete
    const channelToDelete = await channelsColl.findOne({ id: id });
    if (!channelToDelete) {
      return res.fail(404, 'Channel not found');
    }

    /* Load user */
    const user = await usersColl.findOne({ id: userId });
    if (!user) return res.fail(404, 'User not found');

    const group = await groupsColl.findOne({ id: channelToDelete.groupId });
    if (!group) return res.fail(404, 'Parent group not found');

    const isSuper = user.roles?.includes('superadmin');
    const isOwner = group.owner === userId;
    const isAdmin = Array.isArray(group.admins) && group.admins.includes(userId);
    if (!isSuper && !isOwner && !isAdmin) {
      return res.fail(403, 'Not authorized to delete this channel');
    }

    // Remove channel from database
    await channelsColl.deleteOne({ id: id });

    // Remove channel reference from group
    await groupsColl.updateOne({ id: channelToDelete.groupId }, { $pull: { channels: id } });

    console.log(`GROUP  | ${group.name} | Channel '${channelToDelete.name}' deleted`);
    return res.noContent();
  } catch (error) {
    console.error('CHANNEL | Error deleting channel:', error);
    return res.fail(500, 'Internal server error');
  }
});

module.exports = router;
