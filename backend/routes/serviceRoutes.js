// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { auth, requireAuthAndRole } = require("../middleware/auth");
const { uploadServiceImages } = require("../middleware/upload");

// Public routes
router.get("/", serviceController.getAll);
router.get("/:id", serviceController.getOne);

// Protected routes - only providers can create/update/delete
router.post("/", auth, requireAuthAndRole("provider"), uploadServiceImages, serviceController.create);
router.put("/:id", auth, requireAuthAndRole("provider"), uploadServiceImages, serviceController.update);
router.delete("/:id", auth, requireAuthAndRole("provider"), serviceController.remove);

module.exports = router;
