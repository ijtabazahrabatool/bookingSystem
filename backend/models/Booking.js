// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },      // customer
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // provider
  startAt: { type: Date, required: true },  // UTC
  endAt: { type: Date, required: true },    // UTC
  status: {
    type: String,
    enum: ["Held","Pending","Confirmed","Completed","Cancelled","Rejected"],
    default: "Held"
  },
  holdToken: { type: String, default: null },
  holdExpiresAt: { type: Date, default: null },
  price: { type: Number },
  metadata: { type: Object } // optional
}, { timestamps: true });

// Indexes for overlap queries and lookups
bookingSchema.index({ providerId: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ holdToken: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
