const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

console.log('Notification Routes file loaded'); // Debug Log

router.get('/ping', (req, res) => {
    res.status(200).json({ message: 'Notification Service is Up' });
});

router.get('/:userId', (req, res, next) => {
    console.log('Notification route hit for ID:', req.params.userId);
    next();
}, notificationController.getNotifications);

router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
