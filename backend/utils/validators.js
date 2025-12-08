const { parsePhoneNumberFromString } = require('libphonenumber-js');

// validate password
const validatePassword = (password) => {
  const errors = [];
  if (!password) {
    errors.push("password required");
    return errors;
  }
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("one special character");
  return errors;
};



// validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  return { valid: true };
};


// validate Phone

const validatePhone = (phone, countryCode) => {
  // Phone required
  if (!phone) {
    return { valid: false, message: "Phone number is required" };
  }

  try {
    // Convert dial code to ISO country code if needed
    // e.g., "+92" -> "PK", "+1" -> "US", "+44" -> "GB"
    const dialCodeToISO = {
      "+92": "PK",
      "92": "PK",
      "+1": "US",
      "1": "US",
      "+44": "GB",
      "44": "GB",
      "+91": "IN",
      "91": "IN",
      "+971": "AE",
      "971": "AE",
      "+966": "SA",
      "966": "SA"
    };
    
    // If countryCode is a dial code, convert to ISO code
    const isoCountryCode = dialCodeToISO[countryCode] || countryCode;
    
    // If phone already includes country code (starts with +), don't pass country code
    let parsed;
    if (phone.trim().startsWith('+')) {
      parsed = parsePhoneNumberFromString(phone);
    } else {
      parsed = parsePhoneNumberFromString(phone, isoCountryCode);
    }

    if (!parsed || !parsed.isValid()) {
      return { valid: false, message: "Invalid phone number. Please check the format and country code." };
    }

    return { valid: true };

  } catch (err) {
    console.error("Phone validation error:", err);
    return { valid: false, message: "Invalid phone format. Please enter a valid phone number." };
  }
};

module.exports = {
  validatePassword,
  validateEmail,
  validatePhone,
};