// utils/time.js
const { fromZonedTime, toZonedTime, format } = require("date-fns-tz");

/**
 * Convert provider-local date (YYYY-MM-DD) and time (HH:mm) in provider's timezone
 * to a UTC Date object.
 */
function parseLocalDateTimeToUTC(dateStr /*YYYY-MM-DD*/, timeStr /*HH:mm*/, timezone /*e.g. 'Asia/Karachi'*/) {
  try {
    const isoLocal = `${dateStr}T${timeStr}:00`;
    // In date-fns-tz v3, use fromZonedTime instead of zonedTimeToUtc
    return fromZonedTime(isoLocal, timezone);
  } catch (error) {
    console.error('Error in parseLocalDateTimeToUTC:', error);
    // Fallback: treat as UTC if timezone conversion fails
    return new Date(`${dateStr}T${timeStr}:00Z`);
  }
}

/**
 * Convert UTC Date to provider local time string "HH:mm"
 */
function formatUTCToLocalTime(utcDate, timezone) {
  // In date-fns-tz v3, use toZonedTime instead of utcToZonedTime
  const zoned = toZonedTime(utcDate, timezone);
  return format(zoned, "HH:mm");
}

/**
 * Converts "HH:mm" (24-hour) to "h:mm AM/PM" (12-hour).
 * @param {string} hhmm - Time string (e.g., "14:30")
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
function formatTo12Hour(hhmm) {
  if (!hhmm) return "";
  const [hours, minutes] = hhmm.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12; // Convert 0 or 12 to 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
}
module.exports = { parseLocalDateTimeToUTC, formatUTCToLocalTime,formatTo12Hour };
