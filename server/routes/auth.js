const express = require('express');
const router = express.Router();

const User = require('../data/user.js');
const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users.json'));

router.post('', async (req, res) => {
  if (!req.body) {
    return res.sendStatus(400);
  }

  let user = new User();

  for (let i = 0; i < users.length; i++) {
    if (
      (req.body.email == users[i].email || req.body.email == users[i].username) &&
      req.body.password == users[i].password
    ) {
      user.id = users[i].id;
      user.username = users[i].username;
      user.email = users[i].email;
      user.birthdate = users[i].birthdate;
      user.age = users[i].age;
      users.groups = users[i].groups;
      users.roles = users[i].roles;
      user.valid = true;
    }
  }
  if (user.valid) {
    res.send(user);
  } else {
    res.send({ valid: false });
  }
});

module.exports = router;
