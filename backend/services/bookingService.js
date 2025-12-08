// services/bookingService.js
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/Booking");
const { getSlotLock, delSlotLock } = require("../lib/lock");
const Service = require("../models/Service");
const redisClient = require("../lib/redisClient"); // Use redisClient consistently

const HOLD_TTL_SECONDS = parseInt(process.env.HOLD_TTL_SECONDS || "300", 10);



/**
 * Checks for existing bookings that conflict with a new booking's time slot.
 * @param {object} bookingData - The data for the new booking.
 * @private
 * @throws {Error} If a conflicting booking is found.
 */
async function _checkBookingConflict(bookingData) {
  const query = {
    providerId: bookingData.providerId,
    startAt: { $lt: bookingData.endAt },
    endAt: { $gt: bookingData.startAt },
    status: { $in: ["Held", "Pending", "Confirmed"] },
  };

  // FIX: If the user provided a holdToken, do NOT count that specific hold as a conflict.
  if (bookingData.holdToken) {
    query.holdToken = { $ne: bookingData.holdToken };
  }

  const conflict = await Booking.findOne(query).lean();

  if (conflict) {
    const err = new Error("Slot not available (already booked)");
    err.status = 409;
    throw err;
  }
}

/**
 * Acquires a temporary lock for a booking slot using Redis.
 * @param {object} bookingData - The data for the new booking.
 * @private
 * @returns {Promise<{holdToken: string, holdExpiresAt: Date}|null>} Lock details or null if locking fails.
 */
async function _acquireBookingLock(bookingData) {
  const lockKey = `slot:${bookingData.providerId}:${bookingData.startAt.toISOString()}`;
  
  // 1. Check if lock exists
  const currentLockToken = await redisClient.get(lockKey);

  if (currentLockToken) {
    // 2. If user provided a token, check if it MATCHES the lock
    if (bookingData.holdToken && currentLockToken === bookingData.holdToken) {
       console.log("Token matches! Allowing booking to proceed.");
       // Delete lock so we can save to DB without conflict
       await redisClient.del(lockKey);
       return null; // Return null means "No new lock needed, proceed"
    } else {
       // Lock exists and token is missing or wrong
       const err = new Error("Slot momentarily locked by another user");
       err.status = 409;
       throw err;
    }
  }
  // 3. If no lock exists, create one (standard logic)
  // ... (keep existing creation logic if needed, but for "Create Booking" we usually just save to DB)
  return null;
}

/**
 * Creates a new booking.
 * @param {object} data - The booking data.
 * @param {object} user - The user creating the booking.
 * @returns {Promise<Booking>} The newly created booking.
 */
async function createBooking({ 
  providerId, serviceId, startAt, customerName, customerEmail, customerPhone, userId, holdToken 
}) {
  const startAtDate = new Date(startAt);
  
  // 1. Get Service Details
  const service = await Service.findById(serviceId);
  if (!service) throw new Error("Service not found");
  
  const endAtDate = new Date(startAtDate.getTime() + service.duration * 60000);

  // 2. Check Database Conflicts (Permanent Bookings)
  const conflictQuery = {
    providerId,
    status: { $in: ["Confirmed", "Pending", "Held"] },
    $or: [
      { startAt: { $lt: endAtDate }, endAt: { $gt: startAtDate } }
    ]
  };

// IF the user has a holdToken, do NOT count that specific hold as a conflict
  if (holdToken) {
    conflictQuery.holdToken = { $ne: holdToken };
  }

  const existingBooking = await Booking.findOne(conflictQuery);

  if (existingBooking) {
    throw new Error("Slot is already booked.");
  }

  // 3. Check Redis Lock (Temporary Holds)
  const lockKey = `slot:${providerId}:${startAtDate.toISOString()}`;
  
  const currentLockValue = await redisClient.get(lockKey);

  if (currentLockValue) {
    if (holdToken && currentLockValue === holdToken) {
      console.log("Valid hold token provided. Converting hold to booking.");
      await redisClient.del(lockKey);
    } else {
      throw new Error("This slot is temporarily held by another customer.");
    }
  }

  // 4. Create the Booking in DB
  const newBooking = await Booking.create({
    providerId,
    serviceId,
    customerId: userId || null,
    customerName,
    customerEmail,
    customerPhone,
    startAt: startAtDate,
    endAt: endAtDate,
    status: "Confirmed" 
  });

  return newBooking;
}


/**
 * Retrieves all bookings for a user, filtered by their role.
 * @param {object} user - The user requesting the bookings.
 * @returns {Promise<Booking[]>} A list of bookings.
 */
const getBookingsForUser = async (user) => {
  const query = {};
  if (user.role === "customer") {
    query.userId = user.userId;
  } else if (user.role === "provider") {
    query.providerId = user.userId;
  }

  return Booking.find(query)
    .populate([
      { path: "serviceId" },
      { path: "userId", select: "name email phone" },
      { path: "providerId", select: "name email phone" },
    ])
    .sort({ createdAt: -1 });
};

/**
 * Updates the status of a booking.
 * @param {string} id - The ID of the booking to update.
 * @param {string} status - The new status.
 * @returns {Promise<Booking>} The updated booking.
 * @throws {Error} If the booking is not found.
 */
const updateBookingStatus = async (id, status) => {
  const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }
  await booking.populate([
    { path: "serviceId" },
    { path: "userId", select: "name email" },
  ]);
  return booking;
};

/**
 * Verifies if a user is authorized to cancel a booking.
 * @param {Booking} booking - The booking to be cancelled.
 * @param {string} userId - The ID of the user attempting to cancel.
 * @param {string} userRole - The role of the user.
 * @private
 * @throws {Error} If the user is not authorized.
 */
function _verifyCancellationAuthorization(booking, userId, userRole) {
  const isCustomerOwner = userRole === "customer" && booking.userId.toString() === userId.toString();
  const isProviderOwner = userRole === "provider" && booking.providerId.toString() === userId.toString();

  if (!isCustomerOwner && !isProviderOwner) {
    const err = new Error("Not authorized to cancel this booking");
    err.status = 403;
    throw err;
  }
}

/**
 * Releases a Redis lock associated with a booking.
 * @param {Booking} booking - The booking whose lock is to be released.
 * @private
 */
async function _releaseBookingLock(booking) {
  if (booking.holdToken && booking.providerId && booking.startAt) {
    try {
      const lockKey = `slot:${booking.providerId}:${booking.startAt.toISOString()}`;
      await delSlotLock(lockKey);
    } catch (lockErr) {
      console.warn("Failed to release lock on cancellation:", lockErr.message);
    }
  }
}

/**
 * Cancels a booking.
 * @param {string} id - The ID of the booking to cancel.
 * @param {string} userId - The ID of the user cancelling the booking.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<Booking>} The cancelled booking.
 * @throws {Error} If the booking is not found or cannot be cancelled.
 */
const cancelBooking = async (id, userId, userRole) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  _verifyCancellationAuthorization(booking, userId, userRole);

  if (!["Pending", "Confirmed", "Held"].includes(booking.status)) {
    const err = new Error(`Cannot cancel a booking with status: ${booking.status}`);
    err.status = 400;
    throw err;
  }

  await _releaseBookingLock(booking);

  booking.status = "Cancelled";
  booking.holdToken = null;
  booking.holdExpiresAt = null;

  await booking.save({ validateBeforeSave: true });

  return booking.populate([
    { path: "serviceId" },
    { path: "userId", select: "name email" },
    { path: "providerId", select: "name email" },
  ]);
};

/**
 * Deletes a booking from the database.
 * @param {string} id - The ID of the booking to delete.
 * @param {string} userId - The ID of the user performing the delete.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<void>}
 * @throws {Error} If the booking is not found or the user is not authorized.
 */
const deleteBooking = async (id, userId, userRole) => {
  const booking = await Booking.findById(id);

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  const isCustomerOwner = userRole === "customer" && booking.userId.toString() === userId.toString();
  const isProvider = userRole === "provider";

  if (!isCustomerOwner && !isProvider) {
    const err = new Error("Not authorized to delete this booking");
    err.status = 403;
    throw err;
  }

  await Booking.findByIdAndDelete(id);
};

module.exports = {
  createBooking,
  getBookingsForUser,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
};
