const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/', donationController.createDonation);
router.get('/', donationController.getDonations);
router.get('/recent', donationController.getRecentDonations); // Place strict paths before params
router.get('/donor/:id', donationController.getDonationsByDonor);
router.get('/:id', donationController.getDonationById);
router.put('/:id/status', donationController.updateStatus);
router.put('/:id/claim', donationController.claimDonation); // New Claim Endpoint
router.get('/receiver/:id', donationController.getClaimsByReceiver); // New Receiver History Endpoint
router.put('/:id/accept', donationController.acceptTask);
router.put('/:id/deliver', donationController.completeDelivery);
router.get('/volunteer/tasks/:volunteerId', donationController.getVolunteerTasks);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;
