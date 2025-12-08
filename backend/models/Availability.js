const mongoose = require('mongoose');


const breakSchema = new mongoose.Schema({
start: { type: String, required: true }, // "HH:mm"
end: { type: String, required: true } // "HH:mm"
}, { _id: false });


const blockedSlotSchema = new mongoose.Schema({
start: { type: String, required: true },
end: { type: String, required: true }
}, { _id: false });


const availabilitySchema = new mongoose.Schema({
providerId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
index: true
},
// Weekday as string to keep simple: Mon, Tue, Wed, Thu, Fri, Sat, Sun
dayOfWeek: {
type: String,
enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
required: true
},
startTime: { type: String, required: true }, // "09:00"
endTime: { type: String, required: true }, // "17:00"
slotDuration: { type: Number, default: 60 }, // minutes
breaks: [breakSchema],
blockedSlots: [blockedSlotSchema]
}, { timestamps: true });


availabilitySchema.index({ providerId: 1, dayOfWeek: 1 }, { unique: true });


module.exports = mongoose.model('Availability', availabilitySchema);