const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: "YYYY-MM-DD"
  tokenNumber: { type: Number, required: true },
  
  // Link to a booking if it's an online appointment
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  
  // Basic info (Snapshot) so we don't always need to populate
  customerName: { type: String, required: true },
  serviceName: { type: String, required: true },
  estimatedDuration: { type: Number, default: 30 }, // in minutes
  
  status: {
    type: String,
    enum: ["WAITING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED", "NO_SHOW"],
    default: "WAITING"
  },
  
  // Time tracking
  startTime: { type: Date }, // When status changed to IN_PROGRESS
  endTime: { type: Date },   // When status changed to COMPLETED
  
  isWalkIn: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index to ensure unique tokens per provider per day
queueEntrySchema.index({ providerId: 1, date: 1, tokenNumber: 1 }, { unique: true });
// Index for fast fetching of a provider's daily board
queueEntrySchema.index({ providerId: 1, date: 1, status: 1 });

module.exports = mongoose.model("QueueEntry", queueEntrySchema);