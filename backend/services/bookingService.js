// services/bookingService.js
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/Booking");
const { getSlotLock, setSlotLock, delSlotLock } = require("../lib/lock");

const HOLD_TTL_SECONDS = parseInt(process.env.HOLD_TTL_SECONDS || "300", 10);

/**
 * Checks for existing bookings that conflict with a new booking's time slot.
 * @param {object} bookingData - The data for the new booking.
 * @private
 * @throws {Error} If a conflicting booking is found.
 */
async function _checkBookingConflict(bookingData) {
  const conflict = await Booking.findOne({
    providerId: bookingData.providerId,
    startAt: { $lt: bookingData.endAt },
    endAt: { $gt: bookingData.startAt },
    status: { $in: ["Held", "Pending", "Confirmed"] },
  }).lean();

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
  try {
    const lockKey = `slot:${bookingData.providerId}:${bookingData.startAt.toISOString()}`;
    const existingLock = await getSlotLock(lockKey);

    if (existingLock) {
      const err = new Error("Slot momentarily locked by another user");
      err.status = 409;
      throw err;
    }

    const holdToken = uuidv4();
    const locked = await setSlotLock(lockKey, holdToken, HOLD_TTL_SECONDS);

    if (locked) {
      return {
        holdToken,
        holdExpiresAt: new Date(Date.now() + HOLD_TTL_SECONDS * 1000),
      };
    }
  } catch (lockErr) {
    if (lockErr.status === 409) throw lockErr; // Re-throw conflict errors
    console.warn("Redis lock check failed, continuing without lock:", lockErr.message);
  }
  return null;
}

/**
 * Creates a new booking.
 * @param {object} data - The booking data.
 * @param {object} user - The user creating the booking.
 * @returns {Promise<Booking>} The newly created booking.
 */
const createBooking = async (data, user) => {
  const bookingData = {
    ...data,
    userId: user.userId,
    startAt: data.startAt ? new Date(data.startAt) : undefined,
    endAt: data.endAt ? new Date(data.endAt) : undefined,
    status: data.status || "Pending",
  };

  if (bookingData.startAt && bookingData.providerId) {
    await _checkBookingConflict(bookingData);
    const lockDetails = await _acquireBookingLock(bookingData);
    if (lockDetails) {
      bookingData.holdToken = lockDetails.holdToken;
      bookingData.holdExpiresAt = lockDetails.holdExpiresAt;
    }
  }

  const { date, time, customer, ...cleanData } = bookingData;

  const booking = await Booking.create(cleanData);
  await booking.populate([
    { path: "serviceId" },
    { path: "userId", select: "name email" },
    { path: "providerId", select: "name email" },
  ]);
  return booking;
};

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
