// controllers/slotController.js
const slotService = require('../services/slotService');

/**
 * @desc    Get available slots for a provider on a specific date.
 * @route   GET /api/slots/provider-slots
 * @access  Public
 */
exports.getSlots = async (req, res) => {
  try {
    const { providerId, date, serviceId } = req.query;

    // Basic validation for required parameters
    if (!providerId || !date) {
      return res.status(400).json({ message: 'Provider ID and date are required parameters.' });
    }

    console.log(`Fetching slots for providerId: ${providerId}, date: ${date}, serviceId: ${serviceId || 'none'}`);
    
    // Defer to the service layer for business logic
    const slots = await slotService.getAvailableSlots(providerId, date, serviceId || null);

    console.log(`Returning ${slots.length} available slots for ${date}`);
    
    // Send the successful response
    res.status(200).json({ availableSlots: slots });
  } catch (err) {
    // Log the error for debugging purposes
    console.error("SlotController error:", err);

    // Send a structured error response
    res.status(err.status || 500).json({ 
      message: err.message || 'An unexpected server error occurred.',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
