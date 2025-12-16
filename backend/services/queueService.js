// backend/services/queueService.js
const QueueEntry = require("../models/QueueEntry");
const Booking = require("../models/Booking");
const { startOfDay, format } = require("date-fns");

/**
 * Get next token number for a provider on a specific date
 */
async function _getNextToken(providerId, date) {
  const lastEntry = await QueueEntry.findOne({ providerId, date })
    .sort({ tokenNumber: -1 });
  return lastEntry ? lastEntry.tokenNumber + 1 : 1;
}

/**
 * Add an Online Booking to the Queue
 * Called automatically when a booking is confirmed
 */
async function addBookingToQueue(booking) {
  try {
    // Format date as YYYY-MM-DD based on the booking start time
    // Note: In production, ensure timezone consistency. Using booking.startAt (UTC)
    const dateStr = booking.startAt.toISOString().split('T')[0];

    // Check if already in queue to prevent duplicates
    const existing = await QueueEntry.findOne({ bookingId: booking._id });
    if (existing) return existing;

    const tokenNumber = await _getNextToken(booking.providerId, dateStr);

    const entry = await QueueEntry.create({
      providerId: booking.providerId,
      date: dateStr,
      tokenNumber,
      bookingId: booking._id,
      customerName: booking.customerName || "Online Customer", // Ensure your Booking model has this or populate it
      serviceName: booking.serviceId.name || "Service", // You might need to populate serviceId before calling this
      estimatedDuration: booking.endAt 
        ? (new Date(booking.endAt) - new Date(booking.startAt)) / 60000 
        : 30,
      isWalkIn: false
    });
    
    return entry;
  } catch (err) {
    console.error("Failed to add booking to queue:", err);
    // Don't throw, as we don't want to break the booking flow if queue fails
  }
}

/**
 * Add a Walk-In Customer
 */
async function addWalkIn({ providerId, customerName, serviceName, duration }) {
  const dateStr = new Date().toISOString().split('T')[0];
  const tokenNumber = await _getNextToken(providerId, dateStr);

  return await QueueEntry.create({
    providerId,
    date: dateStr,
    tokenNumber,
    customerName,
    serviceName,
    estimatedDuration: duration || 30,
    isWalkIn: true,
    status: "WAITING"
  });
}

/**
 * Get Today's Queue for Provider
 */
async function getDailyQueue(providerId) {
  const dateStr = new Date().toISOString().split('T')[0];
  return await QueueEntry.find({ providerId, date: dateStr })
    .sort({ status: 1, tokenNumber: 1 }); // WAITING first, then by token
}

/**
 * Update Status (Start, Complete, Skip)
 */
async function updateQueueStatus(queueId, status) {
  const updates = { status };
  if (status === "IN_PROGRESS") updates.startTime = new Date();
  if (status === "COMPLETED") updates.endTime = new Date();

  const entry = await QueueEntry.findByIdAndUpdate(queueId, updates, { new: true });
  
  // If linked to a booking, update that too for consistency
  if (entry.bookingId) {
    let bookingStatus = "Confirmed";
    if (status === "COMPLETED") bookingStatus = "Completed";
    if (status === "IN_PROGRESS") bookingStatus = "Confirmed"; // Or add an 'In Progress' status to Booking enum
    
    await Booking.findByIdAndUpdate(entry.bookingId, { status: bookingStatus });
  }
  
  return entry;
}

module.exports = {
  addBookingToQueue,
  addWalkIn,
  getDailyQueue,
  updateQueueStatus
};