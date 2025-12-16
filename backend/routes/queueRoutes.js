// backend/routes/queueRoutes.js
const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queueController");
const authMiddleware = require("../middleware/auth");
const auth = authMiddleware.auth || authMiddleware;

// All routes require Provider authentication
router.use(auth); 

// Middleware to ensure user is provider
const isProvider = (req, res, next) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: "Access denied" });
    next();
};

router.get("/today", isProvider, queueController.getQueue);
router.post("/walkin", isProvider, queueController.addWalkIn);
router.put("/:id/status", isProvider, queueController.updateStatus);

module.exports = router;