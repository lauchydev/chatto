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
    socket.on('join-channel', async (data) => {
      const { channelId, userId, username } = data;
      socket.join(`channel-${channelId}`);
      console.log(`Socket ${socket.id} joined channel ${channelId}`);

      try {
        await checkAndCreateFirstJoinMessage(channelId, userId, username);
      } catch (error) {
        console.error('Error checking first join:', error);
      }

      /* Emit to other users about join */
      socket.to(`channel-${channelId}`).emit('user-joined-channel', {
        socketId: socket.id,
        channelId: channelId,
        userId: userId,
        username: username,
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

    /* Group Management Events */
    socket.on('create-group', async (data) => {
      try {
        const result = await handleCreateGroup(data);
        if (result.success) {
          socket.emit('group-created', result.group);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error creating group:', error);
        socket.emit('operation-error', 'Failed to create group');
      }
    });

    socket.on('join-group-request', async (data) => {
      try {
        const result = await handleJoinRequest(data);
        if (result.success) {
          io.emit('new-join-request', result.data);
          socket.emit('join-request-sent', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error handling join request:', error);
        socket.emit('operation-error', 'Failed to send join request');
      }
    });

    socket.on('approve-join-request', async (data) => {
      try {
        const db = getDB();
        const groupsColl = db.collection('groups');
        const currentGroup = await groupsColl.findOne({ id: data.groupId });
        const result = await handleApproveRequest(data);
        if (result.success) {
          io.emit('user-joined-group', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error approving request:', error);
        socket.emit('operation-error', 'Failed to approve request');
      }
    });

    socket.on('reject-join-request', async (data) => {
      try {
        const result = await handleRejectRequest(data);
        if (result.success) {
          io.emit('join-request-rejected', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
        socket.emit('operation-error', 'Failed to reject request');
      }
    });

    socket.on('kick-user', async (data) => {
      try {
        console.log('SOCKET | Kick user request:', data);
        const result = await handleKickUser(data);
        if (result.success) {
          console.log('SOCKET | Kick successful, emitting events:', result.data);
          io.emit('user-kicked', result.data);
          io.emit('groups-updated');
        } else {
          console.log('SOCKET | Kick failed:', result.error);
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error kicking user:', error);
        socket.emit('operation-error', 'Failed to kick user');
      }
    });

    socket.on('ban-user', async (data) => {
      try {
        const result = await handleBanUser(data);
        if (result.success) {
          io.emit('user-banned', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error banning user:', error);
        socket.emit('operation-error', 'Failed to ban user');
      }
    });

    socket.on('unban-user', async (data) => {
      try {
        const result = await handleUnbanUser(data);
        if (result.success) {
          io.emit('user-unbanned', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error unbanning user:', error);
        socket.emit('operation-error', 'Failed to unban user');
      }
    });

    socket.on('create-channel', async (data) => {
      try {
        const result = await handleCreateChannel(data);
        if (result.success) {
          io.emit('channel-created', result.channel);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error creating channel:', error);
        socket.emit('operation-error', 'Failed to create channel');
      }
    });

    socket.on('delete-channel', async (data) => {
      try {
        const result = await handleDeleteChannel(data);
        if (result.success) {
          io.emit('channel-deleted', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error deleting channel:', error);
        socket.emit('operation-error', 'Failed to delete channel');
      }
    });

    socket.on('delete-group', async (data) => {
      try {
        const result = await handleDeleteGroup(data);
        if (result.success) {
          io.emit('group-deleted', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error deleting group:', error);
        socket.emit('operation-error', 'Failed to delete group');
      }
    });

    socket.on('leave-group', async (data) => {
      try {
        const result = await handleLeaveGroup(data);
        if (result.success) {
          io.emit('user-left-group', result.data);
          io.emit('groups-updated');
        } else {
          socket.emit('operation-error', result.error);
        }
      } catch (error) {
        console.error('Error leaving group:', error);
        socket.emit('operation-error', 'Failed to leave group');
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

/* Check if user is joining channel for first time and create welcome message */
async function checkAndCreateFirstJoinMessage(channelId, userId, username) {
  try {
    const db = getDB();
    const messagesColl = db.collection('messages');
    const usersColl = db.collection('users');

    /* See if a message from this user already exists */
    const existingMessage = await messagesColl.findOne({
      channelId: channelId,
      userId: userId,
      isSystemMessage: { $ne: true },
    });

    /* Check if a join message for this user already exists  */
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingJoinMessage = await messagesColl.findOne({
      channelId: channelId,
      userId: userId,
      systemMessageType: 'user_joined',
      dateSent: { $gte: fiveMinutesAgo },
    });

    if (!existingMessage && !existingJoinMessage) {
      const user = await usersColl.findOne({ id: userId });
      if (!user) return;

      const last = await messagesColl
        .find({}, { projection: { id: 1 } })
        .sort({ id: -1 })
        .limit(1)
        .toArray();

      const newMessageId = (last[0]?.id || 0) + 1;

      /* Join message object */
      const joinMessage = {
        id: newMessageId,
        message: `${username} has been added to the channel`,
        channelId: channelId,
        userId: userId,
        username: 'System',
        userImage: '',
        dateSent: new Date(),
        isSystemMessage: true,
        systemMessageType: 'user_joined',
      };

      await messagesColl.insertOne(joinMessage);

      const { _id, ...cleanMessage } = joinMessage;
      if (io) {
        io.to(`channel-${channelId}`).emit('new-message', cleanMessage);
      }
    }
  } catch (error) {
    console.error('Error creating first join message:', error);
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

/* Handler Functions for Socket Events */

async function handleCreateGroup(data) {
  try {
    const { name, ownerId, image } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');
    const usersColl = db.collection('users');

    if (!name || !name.trim()) {
      return { success: false, error: 'Group name is required' };
    }

    if (!ownerId) {
      return { success: false, error: 'Owner ID is required' };
    }

    const superAdmins = await usersColl
      .find({ roles: 'superadmin' }, { projection: { id: 1 } })
      .toArray();
    const superAdminIds = superAdmins.map((u) => u.id);

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
    const { _id, ...cleanGroup } = newGroup;

    console.log(`SOCKET | Group created: ${name} (ID: ${newId})`);
    return { success: true, group: cleanGroup };
  } catch (error) {
    console.error('Error in handleCreateGroup:', error);
    return { success: false, error: 'Failed to create group' };
  }
}

async function handleJoinRequest(data) {
  try {
    const { groupId, userId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) {
      console.log(`SOCKET | Join request failed: Group ${groupId} not found`);
      return { success: false, error: 'Group not found' };
    }
    if (group.banned.includes(userId)) {
      console.log(`SOCKET | Join request failed: User ${userId} is banned from group ${groupId}`);
      return { success: false, error: 'User is banned from this group' };
    }
    if (group.members.includes(userId)) {
      console.log(
        `SOCKET | Join request failed: User ${userId} is already a member of group ${groupId}`
      );
      return { success: false, error: 'User is already a member' };
    }
    if (group.requests.includes(userId)) {
      console.log(
        `SOCKET | Join request failed: User ${userId} already has pending request for group ${groupId}`
      );
      return { success: false, error: 'User already has a pending request' };
    }

    await groupsColl.updateOne({ id: groupId }, { $addToSet: { requests: userId } });
    await groupsColl.findOne({ id: groupId });
    return { success: true, data: { groupId, userId } };
  } catch (error) {
    console.error('Error in handleJoinRequest:', error);
    return { success: false, error: 'Failed to send join request' };
  }
}

async function handleApproveRequest(data) {
  try {
    const { groupId, userId, approverId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');
    const group = await groupsColl.findOne({ id: groupId });
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (!group.requests.includes(userId)) {
      console.log(
        `SOCKET | Approve failed: User ${userId} has no pending request in group ${groupId}`
      );
      return { success: false, error: 'No pending request for this user' };
    }

    if (group.members.includes(userId)) {
      console.log(
        `SOCKET | Approve failed: User ${userId} is already a member of group ${groupId}`
      );
      return { success: false, error: 'User is already a member' };
    }
    const updateResult = await groupsColl.updateOne(
      { id: groupId, requests: userId },
      { $pull: { requests: userId }, $addToSet: { members: userId } }
    );

    if (updateResult.matchedCount === 0) {
      return { success: false, error: 'No matching document found' };
    }
    await groupsColl.findOne({ id: groupId });
    return { success: true, data: { groupId, userId, approverId } };
  } catch (error) {
    console.error('Error in handleApproveRequest:', error);
    return { success: false, error: 'Failed to approve request' };
  }
}

async function handleRejectRequest(data) {
  try {
    const { groupId, userId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');

    const result = await groupsColl.updateOne(
      { id: groupId, requests: userId },
      { $pull: { requests: userId } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'User has no join request' };
    }

    console.log(`SOCKET | Request rejected: User ${userId} from Group ${groupId}`);
    return { success: true, data: { groupId, userId } };
  } catch (error) {
    console.error('Error in handleRejectRequest:', error);
    return { success: false, error: 'Failed to reject request' };
  }
}

async function handleKickUser(data) {
  try {
    const { groupId, userId, kickerId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return { success: false, error: 'Group not found' };
    if (group.owner === userId) return { success: false, error: 'Cannot kick the group owner' };

    await groupsColl.updateOne({ id: groupId }, { $pull: { members: userId, admins: userId } });

    console.log(`SOCKET | User kicked: ${userId} from Group ${groupId} by ${kickerId}`);
    return { success: true, data: { groupId, userId, kickerId } };
  } catch (error) {
    console.error('Error in handleKickUser:', error);
    return { success: false, error: 'Failed to kick user' };
  }
}

async function handleBanUser(data) {
  try {
    const { groupId, userId, bannerId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return { success: false, error: 'Group not found' };
    if (group.owner === userId) return { success: false, error: 'Cannot ban the group owner' };

    const result = await groupsColl.findOneAndUpdate(
      { id: groupId, banned: { $ne: userId } },
      {
        $pull: { requests: userId, members: userId, admins: userId },
        $addToSet: { banned: userId },
      },
      { returnDocument: 'after' }
    );

    if (!result.value) return { success: false, error: 'User already banned' };

    console.log(`SOCKET | User banned: ${userId} from Group ${groupId} by ${bannerId}`);
    return { success: true, data: { groupId, userId, bannerId } };
  } catch (error) {
    console.error('Error in handleBanUser:', error);
    return { success: false, error: 'Failed to ban user' };
  }
}

async function handleUnbanUser(data) {
  try {
    const { groupId, userId, unbannerId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');

    const result = await groupsColl.updateOne(
      { id: groupId, banned: userId },
      { $pull: { banned: userId } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'User is not banned' };
    }

    console.log(`SOCKET | User unbanned: ${userId} from Group ${groupId} by ${unbannerId}`);
    return { success: true, data: { groupId, userId, unbannerId } };
  } catch (error) {
    console.error('Error in handleUnbanUser:', error);
    return { success: false, error: 'Failed to unban user' };
  }
}

async function handleCreateChannel(data) {
  try {
    const { name, groupId, creatorId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');
    const channelsColl = db.collection('channels');

    if (!name || !name.trim()) {
      return { success: false, error: 'Channel name is required' };
    }

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return { success: false, error: 'Group not found' };

    const last = await channelsColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const newId = (last[0]?.id || 0) + 1;

    const channelName = name.trim().replace(' ', '-');
    const newChannel = { id: newId, name: channelName, groupId };

    await channelsColl.insertOne(newChannel);
    await groupsColl.updateOne({ id: groupId }, { $addToSet: { channels: newId } });

    const messagesColl = db.collection('messages');
    const lastMessage = await messagesColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newMessageId = (lastMessage[0]?.id || 0) + 1;
    const systemMessage = {
      id: newMessageId,
      message: `New channel #${channelName} was created`,
      channelId: newId,
      userId: 0,
      username: 'System',
      userImage: '',
      dateSent: new Date(),
      isSystemMessage: true,
      systemMessageType: 'channel_created',
    };

    await messagesColl.insertOne(systemMessage);

    const { _id, ...cleanChannel } = newChannel;
    console.log(`SOCKET | Channel created: ${channelName} in Group ${groupId}`);
    return { success: true, channel: cleanChannel };
  } catch (error) {
    console.error('Error in handleCreateChannel:', error);
    return { success: false, error: 'Failed to create channel' };
  }
}

async function handleDeleteChannel(data) {
  try {
    const { channelId, userId } = data;
    const db = getDB();
    const channelsColl = db.collection('channels');
    const groupsColl = db.collection('groups');
    const usersColl = db.collection('users');

    const channel = await channelsColl.findOne({ id: channelId });
    if (!channel) return { success: false, error: 'Channel not found' };

    const user = await usersColl.findOne({ id: userId });
    if (!user) return { success: false, error: 'User not found' };

    const group = await groupsColl.findOne({ id: channel.groupId });
    if (!group) return { success: false, error: 'Parent group not found' };

    const isSuper = user.roles?.includes('superadmin');
    const isOwner = group.owner === userId;
    const isAdmin = Array.isArray(group.admins) && group.admins.includes(userId);

    if (!isSuper && !isOwner && !isAdmin) {
      return { success: false, error: 'Not authorized to delete this channel' };
    }

    await channelsColl.deleteOne({ id: channelId });
    await groupsColl.updateOne({ id: channel.groupId }, { $pull: { channels: channelId } });

    const messagesColl = db.collection('messages');
    const deletedMessages = await messagesColl.deleteMany({ channelId: channelId });
    console.log(
      `SOCKET CLEANUP | Deleted ${deletedMessages.deletedCount} messages from channel ${channelId}`
    );

    console.log(`SOCKET | Channel deleted: ${channel.name} from Group ${channel.groupId}`);
    return { success: true, data: { channelId, groupId: channel.groupId, deleterId: userId } };
  } catch (error) {
    console.error('Error in handleDeleteChannel:', error);
    return { success: false, error: 'Failed to delete channel' };
  }
}

async function handleDeleteGroup(data) {
  try {
    const { groupId, userId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');
    const usersColl = db.collection('users');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return { success: false, error: 'Group not found' };

    const user = await usersColl.findOne({ id: userId });
    if (!user) return { success: false, error: 'User not found' };

    const isSuper = user.roles?.includes('superadmin');
    const isOwner = group.owner === userId;

    if (!isSuper && !isOwner) {
      return { success: false, error: 'Not authorized to delete this group' };
    }

    const channelsColl = db.collection('channels');
    const messagesColl = db.collection('messages');

    const groupChannels = await channelsColl.find({ groupId: groupId }).toArray();
    const channelIds = groupChannels.map((channel) => channel.id);

    if (channelIds.length > 0) {
      const deletedMessages = await messagesColl.deleteMany({ channelId: { $in: channelIds } });
      console.log(
        `SOCKET CLEANUP | Deleted ${deletedMessages.deletedCount} messages from group ${groupId}`
      );
    }

    const deletedChannels = await channelsColl.deleteMany({ groupId: groupId });
    console.log(
      `SOCKET CLEANUP | Deleted ${deletedChannels.deletedCount} channels from group ${groupId}`
    );

    await groupsColl.deleteOne({ id: groupId });

    console.log(`SOCKET | Group deleted: ${group.name} (ID: ${groupId})`);
    return { success: true, data: { groupId, deleterId: userId } };
  } catch (error) {
    console.error('Error in handleDeleteGroup:', error);
    return { success: false, error: 'Failed to delete group' };
  }
}

async function handleLeaveGroup(data) {
  try {
    const { groupId, userId } = data;
    const db = getDB();
    const groupsColl = db.collection('groups');
    const usersColl = db.collection('users');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) return { success: false, error: 'Group not found' };

    const user = await usersColl.findOne({ id: userId });
    if (!user) return { success: false, error: 'User not found' };

    if (group.owner === userId) {
      return { success: false, error: 'Group owner cannot leave the group' };
    }

    if (!group.members.includes(userId)) {
      return { success: false, error: 'User is not a member of this group' };
    }

    await groupsColl.updateOne({ id: groupId }, { $pull: { members: userId, admins: userId } });

    console.log(`SOCKET | User ${userId} left group ${groupId}`);
    return { success: true, data: { groupId, userId } };
  } catch (error) {
    console.error('Error in handleLeaveGroup:', error);
    return { success: false, error: 'Failed to leave group' };
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToChannel,
  emitToAll,
};
