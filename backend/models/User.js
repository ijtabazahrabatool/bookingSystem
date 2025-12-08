const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["customer", "provider"],
    default: "customer"
  },
  phone: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    trim: true,
    default: "+92"
  },
    providerProfile: {
      type: {
      description: { type: String, default: '' },
      servicesOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
      availabilityConfigured: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' }
      },
      default: null
    }
}, 
{ timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function() {
  // Skip if password is not modified
  if (!this.isModified("password")) {
    return;
  }
  
  // Hash the password
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

