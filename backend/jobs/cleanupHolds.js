// jobs/cleanupHolds.js
const Booking = require("../models/Booking");
const { delSlotLock } = require("../lib/lock");

async function cleanupExpiredHolds() {
  try {
    const now = new Date();
    // Find potentially expired holds. Use lean for performance.
    const expiredHolds = await Booking.find({
      status: "Held",
      holdExpiresAt: { $lte: now },
    }).lean();

    if (expiredHolds.length === 0) {
      return;
    }

    let cancelledCount = 0;
    for (const hold of expiredHolds) {
      // Atomically find and update the booking ONLY if it's still 'Held'.
      // This prevents a race condition where a user confirms the booking
      // after our initial `find` and before we cancel it.
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: hold._id, status: "Held" },
        {
          $set: {
            status: "Cancelled",
            holdToken: null,
            holdExpiresAt: null,
          },
        },
        { new: false } // We don't need the new document returned.
      );

      // If findOneAndUpdate returns a document, it means the update happened.
      if (updatedBooking) {
        cancelledCount++;
        // Now that we've successfully cancelled it, we can release the lock.
        try {
          if (hold.providerId && hold.startAt) {
            const lockKey = `slot:${hold.providerId}:${hold.startAt.toISOString()}`;
            await delSlotLock(lockKey);
          }
        } catch (lockErr) {
          console.warn(
            `Failed to release lock for post-cancellation: ${hold._id}`,
            lockErr.message
          );
        }
      }
      // If updatedBooking is null, the booking's status was no longer 'Held'.
      // This is expected if the user confirmed it. We do nothing and let the
      // confirmation process handle the lock.
    }

    if (cancelledCount > 0) {
      console.log(`Expired holds cleaned: ${cancelledCount}`);
    }
  } catch (err) {
    console.error("cleanupExpiredHolds error", err);
  }
}

module.exports = cleanupExpiredHolds;
