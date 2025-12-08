// services/authService.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validatePassword, validateEmail, validatePhone } = require("../utils/validators");

/**
 * Validates the data for user registration.
 * @param {object} data - The registration data.
 * @private
 * @throws {Error} If the validation fails.
 */
function _validateRegistrationData({ name, email, password, phone, countryCode }) {
  if (!name || !email || !password) {
    const err = new Error("Please provide name, email, and password");
    err.status = 400;
    throw err;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    const err = new Error(emailValidation.message);
    err.status = 400;
    throw err;
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    const err = new Error(`Password must contain ${passwordErrors.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if (phone) {
    const dialCodeToISO = {
      "+92": "PK", "92": "PK",
      "+1": "US", "1": "US",
      "+44": "GB", "44": "GB",
      "+91": "IN", "91": "IN",
      "+971": "AE", "971": "AE",
      "+966": "SA", "966": "SA",
    };
    const isoCountryCode = dialCodeToISO[countryCode] || countryCode || "PK";

    const phoneValidation = validatePhone(phone, isoCountryCode);
    if (!phoneValidation.valid) {
      const err = new Error(phoneValidation.message);
      err.status = 400;
      throw err;
    }
  }
}

/**
 * Generates a JWT for a user.
 * @param {User} user - The user object.
 * @returns {string} The JWT.
 * @private
 */
function _generateAuthToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Creates the authentication response object.
 * @param {User} user - The user object.
 * @param {string} token - The JWT.
 * @returns {object} The authentication response.
 * @private
 */
function _createAuthResponse(user, token) {
  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
  if (user.role === 'provider' && user.providerProfile) {
    userPayload.providerProfile = { timezone: user.providerProfile.timezone };
  }
  return {
    token,
    user: userPayload,
  };
}

/**
 * Registers a new user.
 * @param {object} registrationData - The user registration data.
 * @returns {Promise<object>} The authentication response.
 * @throws {Error} If registration fails.
 */
const registerUser = async (registrationData) => {
  _validateRegistrationData(registrationData);

  const { name, email, password, role, phone, countryCode } = registrationData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const err = new Error("User already exists with this email");
    err.status = 400;
    throw err;
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || "customer",
    phone,
    countryCode: countryCode || "+92",
  });

  const token = _generateAuthToken(user);
  return _createAuthResponse(user, token);
};

/**
 * Logs in a user.
 * @param {object} loginData - The user login data.
 * @returns {Promise<object>} The authentication response.
 * @throws {Error} If login fails.
 */
const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error("Please provide email and password");
    err.status = 400;
    throw err;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    const err = new Error("Please enter a valid email address");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const token = _generateAuthToken(user);
  return _createAuthResponse(user, token);
};

/**
 * Retrieves a user by their ID.
 * @param {string} id - The ID of the user.
 * @returns {Promise<User>} The user object.
 * @throws {Error} If the user is not found.
 */
const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};