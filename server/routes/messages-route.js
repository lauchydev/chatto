const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { emitToChannel } = require('../socket');

/**
 * Get messages for a specific channel
 */
router.get('/', async (req, res) => {
  const channelId = Number(req.query.channelId);
  const limit = Number(req.query.limit) || 50;

  if (!Number.isInteger(channelId)) return res.fail(400, 'Channel ID is required');

  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const channelsColl = db.collection('channels');

    const channel = await channelsColl.findOne({ id: channelId });
    if (!channel) return res.fail(404, 'Channel not found');

    const messages = await messagesColl
      .find({ channelId: channelId })
      .sort({ dateSent: -1 })
      .limit(limit)
      .toArray();

    messages.reverse();

    const cleanMessages = messages.map(({ _id, ...message }) => message);
    console.log(`MESSAGES | Loaded ${cleanMessages.length} messages for channel ${channelId}`);
    return res.success(cleanMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.fail(500, 'Failed to fetch messages');
  }
});

/**
 * Create a new message
 */
router.post('/', async (req, res) => {
  const { message, channelId, userId } = req.body;

  if (!message || !message.trim()) return res.fail(400, 'Message is empty');

  if (!Number.isInteger(Number(channelId))) {
    return res.fail(400, 'Valid channel ID is required');
  }

  if (!Number.isInteger(Number(userId))) {
    return res.fail(400, 'Valid user ID is required');
  }

  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const channelsColl = db.collection('channels');
    const usersColl = db.collection('users');

    /* Check channel and user exist */
    const [channel, user] = await Promise.all([
      channelsColl.findOne({ id: Number(channelId) }),
      usersColl.findOne({ id: Number(userId) }),
    ]);

    if (!channel) return res.fail(404, 'Channel not found');
    if (!user) return res.fail(404, 'User not found');

    /* Get ID for message */
    const last = await messagesColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newId = (last[0]?.id || 0) + 1;

    /* New Message object */
    const newMessage = {
      id: newId,
      message: message.trim(),
      channelId: Number(channelId),
      userId: Number(userId),
      username: user.username,
      userImage: user.image || '',
      dateSent: new Date(),
    };

    await messagesColl.insertOne(newMessage);

    const { _id, ...cleanMessage } = newMessage;
    console.log(`MESSAGE | User ${user.username} sent message in channel ${channelId}`);

    /* Emit message to channel */
    try {
      emitToChannel(channelId, 'new-message', cleanMessage);
    } catch (socketError) {
      console.warn('Socket emission failed:', socketError.message);
    }
    return res.created(cleanMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.fail(500, 'Failed to create message');
  }
});

/**
 * Delete a message
 */
router.delete('/:id', async (req, res) => {
  const messageId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!Number.isInteger(messageId)) {
    return res.fail(400, 'Valid message ID is required');
  }

  if (!Number.isInteger(userId)) {
    return res.fail(400, 'Valid user ID is required');
  }

  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const usersColl = db.collection('users');

    // Find the message
    const message = await messagesColl.findOne({ id: messageId });
    if (!message) return res.fail(404, 'Message not found');

    // Find the user
    const user = await usersColl.findOne({ id: userId });
    if (!user) return res.fail(404, 'User not found');

    // Check permissions (message owner or superadmin)
    const isOwner = message.userId === userId;
    const isSuper = user.roles?.includes('superadmin');

    if (!isOwner && !isSuper) {
      return res.fail(403, 'Not authorized to delete this message');
    }

    // Delete the message
    await messagesColl.deleteOne({ id: messageId });

    console.log(`MESSAGE | Message ${messageId} deleted by ${user.username}`);

    /* Emit message deletion to channel */
    try {
      emitToChannel(message.channelId, 'message-deleted', {
        messageId,
        channelId: message.channelId,
        deletedBy: userId,
        timestamp: new Date(),
      });
    } catch (socketError) {
      console.warn('Socket emission failed:', socketError.message);
    }

    return res.success({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.fail(500, 'Failed to delete message');
  }
});

module.exports = router;
