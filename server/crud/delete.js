const { getDB } = require('../db');

async function deleteGroup(groupId) {
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');
    const channelsColl = db.collection('channels');

    const group = await groupsColl.findOne({ id: groupId });
    if (!group) {
      throw new Error('Group not found');
    }

    /* Remove the channels */
    const channelDeleteResult = await channelsColl.deleteMany({ groupId: groupId });
    console.log(
      `DELETE | Removed ${channelDeleteResult.deletedCount} channels for group ID: ${groupId}`
    );

    /* Delete the group */
    const result = await groupsColl.deleteOne({ id: groupId });

    if (result.deletedCount > 0) {
      console.log(`DELETE | Deleted group: ${group.name} (ID: ${groupId})`);
      return {
        success: true,
        message: 'Group deleted successfully',
      };
    } else {
      throw new Error('Failed to delete group');
    }
  } catch (error) {
    console.error('Delete group error:', error);
    throw error;
  }
}

module.exports = { deleteGroup };
