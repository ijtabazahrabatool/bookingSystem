const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // minutes
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  image: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    default: [],
    maxlength: 6
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR"]
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for provider services lookup
serviceSchema.index({ providerId: 1, isActive: 1 });

module.exports = mongoose.model("Service", serviceSchema);


