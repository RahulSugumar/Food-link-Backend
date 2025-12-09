const express = require('express');
const router = express.Router();
const fridgeController = require('../controllers/fridgeController');

router.get('/', fridgeController.getFridges);
router.get('/:id', fridgeController.getFridgeById);
router.post('/:id/report', fridgeController.reportIssue);
router.post('/', fridgeController.addFridge);

module.exports = router;
