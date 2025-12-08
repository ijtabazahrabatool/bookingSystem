const availabilityService = require('../../services/provider/availabilityService');
const User = require('../../models/User');


// body: { dayOfWeek, startTime, endTime, slotDuration, breaks, blockedSlots }
const setAvailability = async (req, res) => {
try {
const providerId = req.user.userId;
const body = req.body;


// basic validation
if (!body || !body.dayOfWeek || !body.startTime || !body.endTime) {
return res.status(400).json({ message: 'dayOfWeek, startTime, endTime required' });
}


const doc = await availabilityService.setAvailabilityForDay(providerId, body);


// mark user's providerProfile.availabilityConfigured true (if exists)
const user = await User.findById(providerId);
if (user) {
user.providerProfile = user.providerProfile || {};
user.providerProfile.availabilityConfigured = true;
await user.save();
}


res.json({ message: 'Availability saved', availability: doc });
} catch (err) {
console.error('setAvailability error', err);
res.status(500).json({ message: err.message || 'Failed to set availability' });
}
};


const getAvailability = async (req, res) => {
try {
const providerId = req.user.userId;
const avail = await availabilityService.getAvailabilityForProvider(providerId);
res.json(avail);
} catch (err) {
console.error('getAvailability error', err);
res.status(500).json({ message: err.message || 'Failed to fetch availability' });
}
};


module.exports = { setAvailability, getAvailability };