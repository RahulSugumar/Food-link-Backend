const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/', donationController.createDonation);
router.get('/', donationController.getDonations);
router.get('/recent', donationController.getRecentDonations); // Place strict paths before params
router.get('/donor/:id', donationController.getDonationsByDonor);
router.get('/:id', donationController.getDonationById);
router.put('/:id/status', donationController.updateStatus);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;
