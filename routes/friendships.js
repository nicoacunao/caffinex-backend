const express = require('express');
const router = express.Router();
const { getFriendsUser } = require('../controllers/friendshipsController');

router.get('/friends', getFriendsUser);

module.exports = router;