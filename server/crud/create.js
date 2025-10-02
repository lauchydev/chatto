const { getDB } = require('../db');
const GroupModel = require('../models/GroupModel');

async function create(groupData) {
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    /* Finding the ID to use for the group */
    const last = await groupsColl
      .find({}, { projection: { id: 1 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const newId = (last[0]?.id || 0) + 1;

    /* Create group from empty group schema */
    const newGroup = GroupModel.newGroup({
      ...groupData,
      id: newId,
    });

    await groupsColl.insertOne(newGroup);
    console.log(`CREATE | Added group: ${newGroup.name} (ID: ${newGroup.id})`);

    const { _id, ...cleanGroup } = newGroup;
    return cleanGroup;
  } catch (error) {
    console.error('Create group error:', error);
    throw error;
  }
}

module.exports = { create };
