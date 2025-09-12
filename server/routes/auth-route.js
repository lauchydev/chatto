const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.post('', async (req, res) => {
  if (!req.body) {
    return res.fail(400, 'Request body required');
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.fail(400, 'Email and password required');
  }

  try {
    const db = getDB();
    const usersColl = db.collection('users');

    // Find user by email or username
    const user = await usersColl.findOne({
      $and: [
        { $or: [{ email: email }, { username: email }] },
        { password: password }
      ]
    });

    if (!user) {
      return res.success({ valid: false });
    }

    // Check if user is banned
    if (user.banned === true) {
      return res.success({ valid: false, banned: true });
    }

    // Return user data (excluding password for security)
    const { password: _, ...userResponse } = user;
    userResponse.valid = true;

    console.log(`AUTH | User '${user.username}' logged in successfully`);
    return res.success(userResponse);
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.fail(500, 'Authentication failed');
  }
});

module.exports = router;
