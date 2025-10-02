const { Server } = require('socket.io');
const { getDB } = require('./db');

let io;

function initializeSocket(server) {
  const options = {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  };

  io = new Server(server, options);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /* Join a channel */
    socket.on('join-channel', (channelId) => {
      socket.join(`channel-${channelId}`);
      console.log(`Socket ${socket.id} joined channel ${channelId}`);

      /* Emit to other users about join */
      socket.to(`channel-${channelId}`).emit('user-joined-channel', {
        socketId: socket.id,
        channelId: channelId,
        timestamp: new Date(),
      });
    });

    /* Leave channel */
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel-${channelId}`);
      console.log(`Socket ${socket.id} left channel ${channelId}`);

      /* Emit to toher users about leave */
      socket.to(`channel-${channelId}`).emit('user-left-channel', {
        socketId: socket.id,
        channelId: channelId,
        timestamp: new Date(),
      });
    });

    /* Handle messages */
    socket.on('new-message', async (data) => {
      try {
        const { message, channelId, userId } = data;

        if (!message || !message.trim()) {
          socket.emit('message-error', 'Message content is required');
          return;
        }

        if (!Number.isInteger(Number(channelId)) || !Number.isInteger(Number(userId))) {
          socket.emit('message-error', 'Valid channel and user IDs are required');
          return;
        }

        const savedMessage = await saveMessageToDatabase(
          message.trim(),
          Number(channelId),
          Number(userId)
        );

        if (savedMessage) {
          /* Emit message to channel */
          io.to(`channel-${channelId}`).emit('new-message', savedMessage);
          console.log(`Message sent to channel ${channelId} by user ${userId}`);
        } else {
          socket.emit('message-error', 'Failed to save message');
        }
      } catch (error) {
        console.error('Error handling socket message:', error);
        socket.emit('message-error', 'Failed to send message');
      }
    });

    /* Typing indicator (pretty cool) */
    socket.on('typing', (data) => {
      const { channelId, userId, username } = data;
      socket.to(`channel-${channelId}`).emit('user-typing', {
        userId,
        username,
        channelId,
        socketId: socket.id,
      });
    });

    socket.on('stop-typing', (data) => {
      const { channelId, userId } = data;
      socket.to(`channel-${channelId}`).emit('user-stop-typing', {
        userId,
        channelId,
        socketId: socket.id,
      });
    });

    /* Handle message deletion for all users */
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, userId, channelId } = data;

        /* Permission check */
        const deleted = await deleteMessageFromDatabase(messageId, userId);

        if (deleted) {
          /* Emit message deletion */
          io.to(`channel-${channelId}`).emit('message-deleted', {
            messageId,
            channelId,
            deletedBy: userId,
            timestamp: new Date(),
          });
          console.log(`Message ${messageId} deleted by user ${userId}`);
        } else {
          socket.emit('delete-error', 'Failed to delete message or insufficient permissions');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('delete-error', 'Failed to delete message');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/* Save message to databse */
async function saveMessageToDatabase(message, channelId, userId) {
  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const channelsColl = db.collection('channels');
    const usersColl = db.collection('users');

    /* Check channel and user exist */
    const [channel, user] = await Promise.all([
      channelsColl.findOne({ id: channelId }),
      usersColl.findOne({ id: userId }),
    ]);

    if (!channel || !user) {
      console.error('Channel or user not found');
      return null;
    }

    /* New message ID */
    const last = await messagesColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newId = (last[0]?.id || 0) + 1;

    /* Message object */
    const newMessage = {
      id: newId,
      message: message,
      channelId: channelId,
      userId: userId,
      username: user.username,
      userImage: user.image || '',
      dateSent: new Date(),
    };

    await messagesColl.insertOne(newMessage);

    const { _id, ...cleanMessage } = newMessage;
    return cleanMessage;
  } catch (error) {
    console.error('Error saving message to database:', error);
    return null;
  }
}

/* Same as above but to delete a message */
async function deleteMessageFromDatabase(messageId, userId) {
  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const usersColl = db.collection('users');

    const [message, user] = await Promise.all([
      messagesColl.findOne({ id: messageId }),
      usersColl.findOne({ id: userId }),
    ]);

    if (!message || !user) {
      return false;
    }

    /* Permission check (Must be owner of message or a admin (group or super)) */
    const isOwner = message.userId === userId;
    const isAdmin = user.roles?.includes('superadmin') && user.roles?.includes('groupadmin');

    if (!isOwner && !isAdmin) {
      return false;
    }

    const result = await messagesColl.deleteOne({ id: messageId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting message from database:', error);
    return false;
  }
}

/* Instance of sockets */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
}

/* Emit to channel function */
function emitToChannel(channelId, event, data) {
  if (io) {
    io.to(`channel-${channelId}`).emit(event, data);
  }
}

/* Emit to all function */
function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToChannel,
  emitToAll,
};
