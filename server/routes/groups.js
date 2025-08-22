const express = require('express');
const router = express.Router();

const Group = require('../data/group.js');
const groups = JSON.parse(require('../read-json.js').readJsonAsString('./data/groups.json'));

// Get group list
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    return res.status(400).send({ error: 'User ID Required' });
  }

  const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users.json'));

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }

  let filteredGroups;

  if (user.roles.includes('superadmin')) {
    // Access to all  groups
    filteredGroups = groups;
  } else if (user.roles.includes('groupadmin')) {
    // Access to groups where admin/owner/member
    filteredGroups = groups.filter(
      (group) =>
        group.owner === user.id || group.admins.includes(userId) || group.members.includes(userId)
    );
  } else {
    // Access to groups where member
    filteredGroups = groups.filter((group) => group.members.includes(userId));
  }

  res.send(filteredGroups);
});

// get group by id

module.exports = router;
