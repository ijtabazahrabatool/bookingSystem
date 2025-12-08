// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const bookingHoldController = require("../controllers/bookingHoldController");
const bookingConfirmController = require("../controllers/bookingConfirmController");
const { auth, requireRole, requireAuthAndRole } = require("../middleware/auth");

// Create booking (protected) - legacy direct create (kept)
router.post("/", auth, bookingController.create);

// Hold a slot (protected)
router.post("/hold", auth, bookingHoldController.holdSlot);

// Confirm a held slot (protected)
router.post("/confirm", auth, bookingConfirmController.confirmBooking);

// Get bookings (protected)
router.get("/", auth, bookingController.getAll);

// Update booking status (provider only)
router.put("/:id/status", requireAuthAndRole("provider"), bookingController.updateStatus);

// Cancel booking (protected - customer or provider)
router.post("/:id/cancel", auth, bookingController.cancel);

// Delete booking (protected - owner or provider)
router.delete("/:id", auth, bookingController.remove);

module.exports = router;
