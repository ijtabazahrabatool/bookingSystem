const Availability = require('../../models/Availability');


const setAvailabilityForDay = async (providerId, data) => {
// data should include dayOfWeek, startTime, endTime, slotDuration, breaks, blockedSlots
const filter = { providerId, dayOfWeek: data.dayOfWeek };

const update = {
startTime: data.startTime,
endTime: data.endTime,
slotDuration: data.slotDuration || 60,
breaks: data.breaks || [],
blockedSlots: data.blockedSlots || []
};


const options = { upsert: true, new: true, setDefaultsOnInsert: true };
const doc = await Availability.findOneAndUpdate(filter, update, options);
return doc;
};


const getAvailabilityForProvider = async (providerId) => {
return await Availability.find({ providerId }).sort({ createdAt: 1 }).lean();
};


const getAvailabilityForDay = async (providerId, dayOfWeek) => {
return await Availability.findOne({ providerId, dayOfWeek }).lean();
};


module.exports = {
setAvailabilityForDay,
getAvailabilityForProvider,
getAvailabilityForDay
};