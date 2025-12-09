const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.post('/', requestController.createRequest);
router.get('/', requestController.getRequests);

module.exports = router;
