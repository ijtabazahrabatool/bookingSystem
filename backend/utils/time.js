// utils/time.js
const { zonedTimeToUtc, utcToZonedTime, format } = require("date-fns-tz");

/**
 * Convert provider-local date (YYYY-MM-DD) and time (HH:mm) in provider's timezone
 * to a UTC Date object.
 */
function parseLocalDateTimeToUTC(dateStr /*YYYY-MM-DD*/, timeStr /*HH:mm*/, timezone /*e.g. 'Asia/Karachi'*/) {
  try {
    const isoLocal = `${dateStr}T${timeStr}:00`;
    // Ensure zonedTimeToUtc is a function
    if (typeof zonedTimeToUtc !== 'function') {
      throw new Error('zonedTimeToUtc is not a function. Check date-fns-tz installation.');
    }
    return zonedTimeToUtc(isoLocal, timezone);
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
  const zoned = utcToZonedTime(utcDate, timezone);
  return format(zoned, "HH:mm", { timeZone: timezone });
}

module.exports = { parseLocalDateTimeToUTC, formatUTCToLocalTime };
