const authService = require("../services/authService");

/**
 * @desc    Register a new user.
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ message: "User registered successfully", ...result });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(err.status || 500).json({ 
        message: err.message || "Failed to register user",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Authenticate a user and get a token.
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({ message: "Login successful", ...result });
  } catch (err) {
    console.error("Login error:", err);
    res.status(err.status || 500).json({ 
        message: err.message || "Failed to login",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Get the currently authenticated user's profile.
 * @route   GET /api/auth/me
 * @access  Authenticated
 */
const me = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(err.status || 500).json({ 
        message: err.message || "Failed to get user profile",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = {
  register,
  login,
  me,
};