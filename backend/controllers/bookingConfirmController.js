// controllers/bookingConfirmController.js
const Booking = require("../models/Booking");
const { delSlotLock } = require("../lib/lock");
const nodemailer = require("nodemailer");

// Get io instance - will be set by server
let io = null;
const setIO = (ioInstance) => {
  io = ioInstance;
};

async function confirmBooking(req, res) {
  try {
    const userId = req.user.userId;
    const { bookingId, holdToken } = req.body;
    if (!bookingId || !holdToken) return res.status(400).json({ message: "bookingId & holdToken required" });

    const now = new Date();
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, userId, holdToken, status: "Held", holdExpiresAt: { $gt: now } },
      { $set: { status: "Confirmed", holdToken: null, holdExpiresAt: null } },
      { new: true }
    ).populate([{ path: "serviceId" }, { path: "userId", select: "name email" }]);

    if (!booking) {
      return res.status(409).json({ message: "Hold expired or invalid" });
    }

    // remove redis lock
    const key = `slot:${booking.providerId}:${booking.startAt.toISOString()}`;
    await delSlotLock(key);

    // Emit socket event to provider room (if io available)
    try {
      if (io && booking.providerId) {
        io.to(`provider:${booking.providerId.toString()}`).emit("booking.confirmed", booking);
      }
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr);
    }

    // Minimal email notification (if SMTP env configured)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: booking.userId.email,
          subject: "Booking Confirmed",
          text: `Your booking for ${booking.serviceId.name} on ${booking.startAt.toISOString()} is confirmed.`
        };

        transporter.sendMail(mailOptions).catch(e => console.error("SendMail error:", e));
      }
    } catch (mailErr) {
      console.error("Mail send error:", mailErr);
    }

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("confirmBooking error", err);
    res.status(err.status || 500).json({
        message: err.message || "Server error confirming booking",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

module.exports = { confirmBooking, setIO };
