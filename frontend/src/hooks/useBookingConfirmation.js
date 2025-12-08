import { useState } from 'react';
import { confirmBooking } from '../services/api';

/**
 * A custom hook to manage the booking confirmation process.
 * @param {object} options - The options for the hook.
 * @param {Function} options.onError - The function to call on error.
 * @param {Function} options.onSuccess - The function to call on success.
 * @returns {object} The state and functions for confirming a booking.
 */
export function useBookingConfirmation({ onError, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBook = async (holdData, service, selectedSlot, providerId, date, time) => {
    if (!date || !time || !selectedSlot) {
      onError("Please select both date and time");
      return;
    }

    if (!holdData) {
      onError("Please wait for the slot to be reserved, or select the time again.");
      return;
    }

    if (new Date() > holdData.holdExpiresAt) {
      onError("Your reservation expired. Please select a time again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmResponse = await confirmBooking(holdData.bookingId, holdData.holdToken);

      await onSuccess({
        serviceId: service._id || service.id,
        providerId: providerId,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        date,
        time,
        price: service.price,
        bookingId: confirmResponse.data.booking._id,
      });
    } catch (error) {
      console.error("Booking confirmation error:", error);
      if (error.response?.status === 409) {
        onError(error.response.data.message || "Your reservation expired or was taken. Please select a different time.");
      } else {
        onError("Failed to confirm booking. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleBook };
}
