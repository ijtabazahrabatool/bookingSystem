// backend/controllers/queueController.js
const queueService = require("../services/queueService");

const getQueue = async (req, res) => {
  try {
    const queue = await queueService.getDailyQueue(req.user.userId);
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addWalkIn = async (req, res) => {
  try {
    const { customerName, serviceName, duration } = req.body;
    const entry = await queueService.addWalkIn({
      providerId: req.user.userId,
      customerName,
      serviceName,
      duration
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await queueService.updateQueueStatus(req.params.id, status);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getQueue, addWalkIn, updateStatus };