import { useState } from 'react';
import { holdSlot } from '../services/api';

/**
 * A custom hook to manage holding a time slot.
 * @param {object} options - The options for the hook.
 * @param {Function} options.onError - The function to call on error.
 * @param {Function} options.onSuccess - The function to call on success.
 * @returns {object} The state and functions for holding a slot.
 */
export function useSlotHolding({ onError, onSuccess }) {
  const [isHolding, setIsHolding] = useState(false);

  const handleTimeSelect = async (slot, providerId, serviceId, date) => {
    if (slot.locked) {
      onError("This slot is currently being booked by another customer. Please select a different time.");
      return;
    }

    setIsHolding(true);
    try {
      const holdResponse = await holdSlot({
        providerId: providerId,
        serviceId: serviceId,
        date: date,
        time: slot.time,
      });

      onSuccess({
        bookingId: holdResponse.data.bookingId,
        holdToken: holdResponse.data.holdToken,
        holdExpiresAt: new Date(holdResponse.data.holdExpiresAt),
      }, slot);
    } catch (err) {
      console.error("Error holding slot:", err);
      if (err.response?.status === 409) {
        onError(err.response.data.message || "This slot was just booked by another customer. Please select a different time.");
      } else {
        onError("Failed to reserve this time slot. Please try again.");
      }
    } finally {
      setIsHolding(false);
    }
  };

  return { isHolding, handleTimeSelect };
}
