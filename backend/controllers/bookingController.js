// controllers/bookingController.js
const bookingService = require("../services/bookingService");

/**
 * @desc    Get all bookings for the authenticated user.
 * @route   GET /api/bookings
 * @access  Authenticated
 */
const getAll = async (req, res) => {
  try {
    const bookings = await bookingService.getBookingsForUser(req.user);
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(err.status || 500).json({
        message: err.message || "Failed to fetch bookings",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Update the status of a booking.
 * @route   PUT /api/bookings/:id/status
 * @access  Provider
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: "Status is required." });
    }
    const booking = await bookingService.updateBookingStatus(req.params.id, status);
    res.status(200).json(booking);
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(err.status || 500).json({
        message: err.message || "Failed to update booking",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Cancel a booking.
 * @route   POST /api/bookings/:id/cancel
 * @access  Authenticated (Owner or Provider)
 */
const cancel = async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    res.status(200).json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(err.status || 500).json({
        message: err.message || "Failed to cancel booking",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Delete a booking.
 * @route   DELETE /api/bookings/:id
 * @access  Authenticated (Owner or Provider)
 */
const remove = async (req, res) => {
  try {
    await bookingService.deleteBooking(req.params.id, req.user.userId, req.user.role);
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(err.status || 500).json({
        message: err.message || "Failed to delete booking",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Create a new booking, potentially using a hold token.
 * @route   POST /api/bookings
 * @access  Authenticated
 */
const create = async (req, res) => {
  try {
    if (req.user && req.user.role === 'provider') {
      return res.status(403).json({ 
        message: "Providers are not allowed to make bookings. Please login as a customer." 
      });
    }
    const bookingData = {
      ...req.body,
      userId: req.user ? req.user.userId : null,
    };
    
    const booking = await bookingService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (err) {
    console.error("Create Booking Error:", err);
    res.status(err.status || 400).json({
      message: err.message || "Failed to create booking",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = {
  create,
  getAll,
  updateStatus,
  cancel,
  remove,
};
