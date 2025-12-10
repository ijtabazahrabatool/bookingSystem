// controllers/slotController.js
const slotService = require('../services/slotService');
const { isSameDay, parseISO } = require('date-fns');

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
    let slots = await slotService.getAvailableSlots(providerId, date, serviceId || null);

    const requestDate = new Date(date);
    const now = new Date(); // Server time (ensure server timezone is correct or use UTC comparison)
    
    // Check if the requested date is today (compare YYYY-MM-DD strings to be safe against timezone shifts)
    const todayStr = now.toISOString().split('T')[0];
    
    if (date === todayStr) {
       const currentHours = now.getHours();
       const currentMinutes = now.getMinutes();

       slots = slots.filter(slot => {
         const [slotHour, slotMinute] = slot.time.split(':').map(Number);
         // Filter: Keep slot if Hour is greater, OR Hour is same but Minute is greater
         if (slotHour > currentHours) return true;
         if (slotHour === currentHours && slotMinute > currentMinutes) return true;
         return false; 
       });
    }
    
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
