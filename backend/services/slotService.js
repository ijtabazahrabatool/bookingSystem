// services/slotService.js
const mongoose = require("mongoose");
const { addMinutes } = require("date-fns");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const { parseLocalDateTimeToUTC, formatTo12Hour} = require("../utils/time");
const { getSlotLock } = require("../lib/lock");

/**
 * Converts a time string in "HH:mm" format to the total number of minutes from midnight.
 * @param {string} hhmm - The time string to convert (e.g., "09:30").
 * @returns {number} The total minutes from midnight.
 */
function hhmmToMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Generates an array of time slots within a given time window.
 * @param {string} startTime - The start of the window (e.g., "09:00").
 * @param {string} endTime - The end of the window (e.g., "17:00").
 * @param {number} stepMinutes - The interval between each slot in minutes.
 * @param {number} serviceDuration - The duration of the service in minutes.
 * @returns {string[]} An array of time slots in "HH:mm" format.
 */
function generateLocalSlots(startTime, endTime, stepMinutes, serviceDuration) {
  const slots = [];
  let currentMinutes = hhmmToMinutes(startTime);
  const endMinutes = hhmmToMinutes(endTime);

  while (currentMinutes + serviceDuration <= endMinutes) {
    const hours = String(Math.floor(currentMinutes / 60)).padStart(2, "0");
    const minutes = String(currentMinutes % 60).padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    currentMinutes += stepMinutes;
  }
  return slots;
}

/**
 * Checks for booking conflicts for a given time slot.
 * @param {mongoose.Types.ObjectId} providerId - The ID of the provider.
 * @param {Date} candidateStartUTC - The start time of the slot in UTC.
 * @param {Date} candidateEndUTC - The end time of the slot in UTC.
 * @returns {Promise<boolean>} True if there is a conflict, false otherwise.
 */
async function hasBookingConflict(providerId, candidateStartUTC, candidateEndUTC) {
  const conflict = await Booking.findOne({
    providerId: providerId,
    startAt: { $lt: candidateEndUTC },
    endAt: { $gt: candidateStartUTC },
    status: { $in: ["Held", "Pending", "Confirmed"] },
  }).lean();

  if (conflict) {
    console.log(`Booking conflict found: ${conflict._id} for slot ${candidateStartUTC.toISOString()}`);
  }

  return !!conflict;
}

/**
 * Fetches the provider's availability for a specific day of the week.
 * @param {mongoose.Types.ObjectId} providerId - The ID of the provider.
 * @param {string} dayOfWeek - The day of the week (e.g., "Mon").
 * @returns {Promise<object|null>} The availability object or null if not found.
 */
async function getProviderAvailability(providerId, dayOfWeek) {
  return Availability.findOne({ providerId, dayOfWeek }).lean();
}

/**
 * Determines the duration of a service, falling back to the provider's default slot duration.
 * @param {string|null} serviceId - The ID of the service.
 * @param {number} defaultDuration - The default duration to use if the service is not found.
 * @returns {Promise<number>} The duration of the service in minutes.
 */
async function getServiceDuration(serviceId, defaultDuration) {
  if (serviceId) {
    const service = await Service.findById(serviceId).lean();
    if (service) {
      console.log(`Using service duration: ${service.duration} minutes`);
      return service.duration;
    }
  }
  return defaultDuration;
}

/**
 * Retrieves the timezone for a given provider.
 * @param {mongoose.Types.ObjectId} providerId - The ID of the provider.
 * @returns {Promise<string>} The provider's timezone (defaults to "UTC").
 */
async function getProviderTimezone(providerId) {
  const providerUser = await User.findById(providerId).lean();
  if (!providerUser) {
    console.log(`Provider user not found: ${providerId}`);
    return "UTC";
  }
  return providerUser?.providerProfile?.timezone || "UTC";
}

/**
 * Checks if a time slot overlaps with any break or blocked times.
 * @param {string} localTime - The time to check (e.g., "10:00").
 * @param {number} serviceDuration - The duration of the service.
 * @param {object} availability - The provider's availability object.
 * @returns {boolean} True if the slot is unavailable, false otherwise.
 */
function isSlotUnavailable(localTime, serviceDuration, availability) {
  const slotStartMinutes = hhmmToMinutes(localTime);
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  const inBreak = (availability.breaks || []).some((b) => {
    const breakStart = hhmmToMinutes(b.start);
    const breakEnd = hhmmToMinutes(b.end);
    return slotStartMinutes < breakEnd && slotEndMinutes > breakStart;
  });

  if (inBreak) {
    console.log(`Slot ${localTime} skipped - in break`);
    return true;
  }

  const inBlocked = (availability.blockedSlots || []).some((b) => {
    const blockedStart = hhmmToMinutes(b.start);
    const blockedEnd = hhmmToMinutes(b.end);
    return slotStartMinutes < blockedEnd && slotEndMinutes > blockedStart;
  });

  if (inBlocked) {
    console.log(`Slot ${localTime} skipped - blocked`);
    return true;
  }

  return false;
}

/**
 * Checks if a specific time slot is temporarily locked (held) in Redis.
 * @param {mongoose.Types.ObjectId} providerId - The ID of the provider.
 * @param {Date} startAtUTC - The start time of the slot in UTC.
 * @returns {Promise<boolean>} True if the slot is locked, false otherwise.
 */
async function isSlotLocked(providerId, startAtUTC) {
  try {
    const lockKey = `slot:${providerId}:${startAtUTC.toISOString()}`;
    const lockedValue = await getSlotLock(lockKey);
    if (lockedValue) {
      console.log(`Slot at ${startAtUTC.toISOString()} is locked (temporarily held)`);
      return true;
    }
  } catch (err) {
    console.warn("Redis lock check failed, assuming slot is not locked:", err.message);
  }
  return false;
}


/**
 * Main function to get available slots for a provider on a specific date.
 * It considers the provider's availability, existing bookings, and temporary holds.
 * @param {string} providerIdStr - The string representation of the provider's ID.
 * @param {string} dateStr - The date in "YYYY-MM-DD" format.
 * @param {string|null} serviceId - The ID of the service being booked.
 * @returns {Promise<object[]>} A list of available slots.
 */

async function getAvailableSlots(providerIdStr, dateStr, serviceId) {
  const providerId = mongoose.Types.ObjectId.isValid(providerIdStr)
    ? new mongoose.Types.ObjectId(providerIdStr)
    : providerIdStr;

  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = dayMap[dateObj.getDay()];

  const availability = await getProviderAvailability(providerId, dayOfWeek);
  if (!availability) return [];

  const serviceDuration = await getServiceDuration(serviceId, availability.slotDuration || 30);
  const timezone = await getProviderTimezone(providerId);
  const stepMinutes = availability.slotDuration || 30;

  const candidateLocalTimes = generateLocalSlots(availability.startTime, availability.endTime, stepMinutes, serviceDuration);
  const now = new Date(); // Current UTC time
  const results = [];

  for (const localTime of candidateLocalTimes) {
    if (isSlotUnavailable(localTime, serviceDuration, availability)) {
      continue;
    }

    const startAtUTC = parseLocalDateTimeToUTC(dateStr, localTime, timezone);
    const endAtUTC = addMinutes(startAtUTC, serviceDuration);

    // 1. Filter Past Slots
    if (startAtUTC < now) {
      continue; 
    }

    // 2. Check Database Conflicts
    const conflict = await hasBookingConflict(providerId, startAtUTC, endAtUTC);
    if (conflict) {
      continue;
    }

    // 3. Check Temporary Redis Locks
    const locked = await isSlotLocked(providerId, startAtUTC);

    results.push({
      time: localTime,            // "14:00" (Keep for backend logic)
      displayTime: formatTo12Hour(localTime), // "2:00 PM" (Use this for UI)
      startAt: startAtUTC.toISOString(),
      endAt: endAtUTC.toISOString(),
      locked: locked,
    });
  }

  return results;
}

module.exports = { getAvailableSlots };