const { getDB } = require('../db');
const GroupModel = require('../models/GroupModel');

async function update(groupId, updateData) {
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    const existingGroup = await groupsColl.findOne({ id: groupId });
    if (!existingGroup) {
      throw new Error('Group not found');
    }

    /* Valid fields that can be updated */
    const validFields = [
      'name',
      'icon',
      'owner',
      'members',
      'admins',
      'requests',
      'banned',
      'channels',
    ];
    const updateFields = {};

    for (const field of validFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }

    /* Update group logic */
    const result = await groupsColl.updateOne({ id: groupId }, { $set: updateFields });

    if (result.modifiedCount > 0) {
      const updatedGroup = await groupsColl.findOne({ id: groupId });
      console.log(`UPDATE | Updated group: ${updatedGroup.name} (ID: ${groupId})`);

      const { _id, ...cleanGroup } = updatedGroup;
      return cleanGroup;
    } else {
      throw new Error('No changes made to group');
    }
  } catch (error) {
    console.error('Update group error:', error);
    throw error;
  }
}

module.exports = { update };
