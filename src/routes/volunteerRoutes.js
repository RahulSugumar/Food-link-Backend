const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');

router.get('/tasks', volunteerController.getTasks);
router.post('/tasks/:id/accept', volunteerController.acceptTask);
router.post('/tasks/:id/complete', volunteerController.completeTask);

module.exports = router;
