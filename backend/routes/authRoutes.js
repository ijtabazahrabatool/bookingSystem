const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/register", authController.register); // public
router.post("/login", authController.login);       // public
router.get("/me", auth, authController.me);        // protected

module.exports = router;
