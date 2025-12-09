const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
// router.get('/me', authMiddleware, authController.getMe); // TODO: Add middleware later

module.exports = router;
