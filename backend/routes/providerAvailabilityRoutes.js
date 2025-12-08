const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/provider/availabilityController');
const { auth, requireRole } = require('../middleware/auth');

// Protected: provider only
router.post('/', auth, requireRole('provider'), availabilityController.setAvailability);
router.get('/', auth, requireRole('provider'), availabilityController.getAvailability);

module.exports = router;