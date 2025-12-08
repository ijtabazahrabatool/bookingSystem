// controllers/bookingController.js
const bookingService = require("../services/bookingService");

/**
 * @desc    Create a new booking.
 * @route   POST /api/bookings
 * @access  Authenticated
 */
exports.createBooking = async (req, res) => {
  try {
    // Extract holdToken from the body (Frontend must send this!)
    const { 
      providerId, 
      serviceId, 
      startAt, 
      customerName, 
      customerEmail, 
      customerPhone,
      holdToken // <--- NEW PARAMETER
    } = req.body;

    // Pass holdToken to the service
    const booking = await bookingService.createBooking({
      providerId,
      serviceId,
      startAt,
      customerName,
      customerEmail,
      customerPhone,
      userId: req.user ? req.user.userId : null,
      holdToken // <--- PASS IT HERE
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(400).json({ message: error.message });
  }
};

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
    res.status(err.status || 500).json({ message: err.message || "Failed to fetch bookings" });
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
    res.status(err.status || 500).json({ message: err.message || "Failed to update booking" });
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
    res.status(err.status || 500).json({ message: err.message || "Failed to cancel booking" });
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
    res.status(err.status || 500).json({ message: err.message || "Failed to delete booking" });
  }
};

const create = async (req, res) => {
  try {
    // Extract holdToken from body
    const { holdToken, ...bookingData } = req.body; 
    
    // Pass it to the service
    const booking = await bookingService.createBooking({ ...bookingData, holdToken }, req.user);
    
    res.status(201).json(booking);
  } catch (err) {
    // ... error handling
  }
};

module.exports = {
  create,
  getAll,
  updateStatus,
  cancel,
  remove,
};
