const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');


router.get('/provider-slots', slotController.getSlots);


module.exports = router;