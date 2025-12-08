// controllers/bookingHoldController.js
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const { parseLocalDateTimeToUTC } = require("../utils/time");
const { setSlotLock } = require("../lib/lock");

const HOLD_TTL_SECONDS = parseInt(process.env.HOLD_TTL_SECONDS || "300", 10);

/**
 * POST /api/bookings/hold
 * body: { providerId, serviceId, date: "YYYY-MM-DD", time: "HH:mm" }
 */
async function holdSlot(req, res) {
  try {
    const userId = req.user.userId;
    const { providerId, serviceId, date, time } = req.body;
    if (!providerId || !serviceId || !date || !time) {
      return res.status(400).json({ message: "providerId, serviceId, date, time required" });
    }

    const service = await Service.findById(serviceId).lean();
    if (!service) return res.status(404).json({ message: "Service not found" });

    const User = require("../models/User");
    const providerUser = await User.findById(providerId).lean();
    const timezone = providerUser?.providerProfile?.timezone || "UTC";

    const startAt = parseLocalDateTimeToUTC(date, time, timezone);
    const endAt = new Date(startAt.getTime() + service.duration * 60000);

    // Check DB overlap
    const conflict = await Booking.findOne({
      providerId,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
      status: { $in: ["Held", "Pending", "Confirmed"] }
    });

    if (conflict) {
      return res.status(409).json({ message: "Slot not available (already booked/held)" });
    }

    // Try Redis lock
    const key = `slot:${providerId}:${startAt.toISOString()}`;
    const holdToken = uuidv4();
    const locked = await setSlotLock(key, holdToken, HOLD_TTL_SECONDS);
    if (!locked) {
      return res.status(409).json({ message: "Slot momentarily locked by another user" });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_SECONDS * 1000);
    const booking = await Booking.create({
      providerId,
      serviceId,
      userId,
      startAt,
      endAt,
      status: "Held",
      holdToken,
      holdExpiresAt,
      price: service.price
    });

    res.status(201).json({
      message: "Slot reserved",
      bookingId: booking._id,
      holdToken,
      holdExpiresAt,
      expiresInSeconds: HOLD_TTL_SECONDS
    });
  } catch (err) {
    console.error("holdSlot error", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { holdSlot };
