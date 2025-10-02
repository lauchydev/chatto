const { getDB } = require('../../db');

async function read(groupId = null) {
  try {
    const db = getDB();
    const groupsColl = db.collection('groups');

    if (groupId) {
      /* If a group ID was provided, get that group */
      const group = await groupsColl.findOne({ id: groupId });
      if (!group) {
        throw new Error('Group not found');
      }
      console.log(`READ | Retrieved group: ${group.name} (ID: ${groupId})`);

      const { _id, ...cleanGroup } = group;
      return cleanGroup;
    } else {
      /* Otherwise, get all groups */
      const groups = await groupsColl.find({}).toArray();
      console.log(`READ | Retrieved ${groups.length} groups`);

      return groups.map(({ _id, ...group }) => group);
    }
  } catch (error) {
    console.error('Read groups error:', error);
    throw error;
  }
}

module.exports = { read };
