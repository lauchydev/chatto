const express = require('express');
const router = express.Router();

const User = require('../data/users/user.js');
const users = JSON.parse(require('../read-json.js').readJsonAsString('./data/users/users.json'));

router.post('', async (req, res) => {
  if (!req.body) {
    return res.fail(400, 'Request body required');
  }

  let user = new User();

  for (let i = 0; i < users.length; i++) {
    if (
      (req.body.email == users[i].email || req.body.email == users[i].username) &&
      req.body.password == users[i].password
    ) {
      if (users[i].banned === true) {
        return res.success({ valid: false, banned: true });
      }
      user.id = users[i].id;
      user.username = users[i].username;
      user.email = users[i].email;
      user.birthdate = users[i].birthdate;
      user.age = users[i].age;
      user.roles = users[i].roles;
      user.banned = users[i].banned === true;
      user.reported = users[i].reported;
      user.valid = true;
    }
  }
  if (user.valid) {
    return res.success(user);
  } else {
    return res.success({ valid: false });
  }
});

module.exports = router;
