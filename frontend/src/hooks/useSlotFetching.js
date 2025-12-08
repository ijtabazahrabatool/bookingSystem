import { useState, useEffect, useRef } from 'react';
import { getProviderSlots } from '../services/api';

/**
 * A custom hook to fetch available slots for a provider on a given date.
 * @param {string} providerId - The ID of the provider.
 * @param {string} date - The selected date.
 * @param {object} service - The service object.
 * @returns {object} The state and functions for fetching slots.
 */
export function useSlotFetching(providerId, date, service) {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const slotRefreshInterval = useRef(null);

  const fetchSlots = async () => {
    if (!providerId || !date) {
      setError("Provider or date not selected");
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setError(null);
    try {
      const serviceId = service?._id || service?.id || null;
      console.log(`[useSlotFetching] Fetching slots - providerId: ${providerId}, date: ${date}, serviceId: ${serviceId}`);

      const response = await getProviderSlots(providerId, date, serviceId);
      const availableSlots = response.data?.availableSlots || [];

      console.log(`[useSlotFetching] Received ${availableSlots.length} slots from API`);

      const sortedSlots = availableSlots
        .map(slot => ({
          ...slot,
          locked: slot.locked || false,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      console.log(`[useSlotFetching] Available slots: ${sortedSlots.filter(s => !s.locked).length}, Locked slots: ${sortedSlots.filter(s => s.locked).length}`);

      setSlots(sortedSlots);

      if (sortedSlots.length === 0) {
        setError("No available time slots for this date. The provider may not have set availability for this day.");
      } else if (sortedSlots.every(slot => slot.locked)) {
        setError("All time slots are currently being booked by other customers. Please try another date or time.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError(err.response?.data?.message || "Failed to load available time slots. Please try again.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (date && providerId) {
      fetchSlots();
      slotRefreshInterval.current = setInterval(fetchSlots, 5000);
    } else {
      setSlots([]);
    }

    return () => {
      if (slotRefreshInterval.current) {
        clearInterval(slotRefreshInterval.current);
      }
    };
  }, [date, providerId]);

  return { slots, loadingSlots, error, fetchSlots };
}
