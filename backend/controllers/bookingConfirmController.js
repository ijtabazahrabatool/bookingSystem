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
      { 
        $set: { 
          status: "Pending", 
          holdToken: null, 
          holdExpiresAt: null 
        } 
      },
      { new: true }
    ).populate([{ path: "serviceId" }, { path: "userId", select: "name email" }]);

    if (!booking) {
      return res.status(409).json({ message: "Hold expired or invalid. Please select the slot again." });
    }

    // Remove redis lock immediately
    if (booking.providerId && booking.startAt) {
      const key = `slot:${booking.providerId}:${booking.startAt.toISOString()}`;
      await delSlotLock(key);
    }

    // Emit socket event
    try {
      if (io && booking.providerId) {
        io.to(`provider:${booking.providerId.toString()}`).emit("booking.created", booking);
      }
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr);
    }

    // Email notification
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: booking.userId.email,
          subject: "Booking Request Sent",
          text: `Your booking request for ${booking.serviceId.name} on ${new Date(booking.startAt).toLocaleString()} has been sent to the provider.`
        };

        transporter.sendMail(mailOptions).catch(e => console.error("SendMail error:", e));
      }
    } catch (mailErr) {
      console.error("Mail send error:", mailErr);
    }

    // Return success
    res.json({ message: "Booking request sent successfully", booking });
  } catch (err) {
    console.error("confirmBooking error", err);
    res.status(500).json({ message: "Server error confirming booking" });
  }
}

module.exports = { confirmBooking, setIO };
