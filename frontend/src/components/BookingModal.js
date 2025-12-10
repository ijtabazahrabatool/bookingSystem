import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

import BookingHeader from './booking/BookingHeader';
import BookingProgress from './booking/BookingProgress';
import DateSelector from './booking/DateSelector';
import TimeSelector from './booking/TimeSelector';
import ConfirmationStep from './booking/ConfirmationStep';
import BookingFooter from './booking/BookingFooter';

import { useProviderId } from '../hooks/useProviderId';
import { useDateSelection } from '../hooks/useDateSelection';
import { useSlotFetching } from '../hooks/useSlotFetching';
import { useSlotHolding } from '../hooks/useSlotHolding';
import { useBookingConfirmation } from '../hooks/useBookingConfirmation';
import { useToast } from './Toast';

export default function BookingModal({ service, onClose, onConfirm }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [holdData, setHoldData] = useState(null);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const providerId = useProviderId(service);
  const dates = useDateSelection();
  const { slots, loadingSlots, error: fetchError, fetchSlots } = useSlotFetching(providerId, date, service);

  const { isHolding, handleTimeSelect } = useSlotHolding({
    onError: setError,
    onSuccess: (newHoldData, slot) => {
      setHoldData(newHoldData);
      setSelectedSlot(slot);
      setTime(slot.time);
      // FIX: Auto-advance to the confirmation step (Step 3)
      setStep(3); 
    },
  });

  const { isSubmitting, handleBook } = useBookingConfirmation({
    onError: (message) => {
        setError(message);
        if (message && (message.includes("expired") || message.includes("taken"))) {
            setHoldData(null);
            setTime("");
            setSelectedSlot(null);
            fetchSlots();
            setStep(2);
        }
    },
    onSuccess: async (bookingDetails) => {
        // 1. Show a success message to the user
        showToast("Booking request sent to provider!", "success");

        // 2. Notify the parent component to refresh its data
        if (onConfirm) {
          await onConfirm(bookingDetails);
        }
        setHoldData(null);

        // 3. Navigate to the user's dashboard
        navigate('/dashboard'); // Or '/my-bookings' depending on your routes
        
        // 4. Close the modal
        onClose();
    }
  });

  const onDateSelect = (newDate) => {
    setDate(newDate);
    setTime("");
    setSelectedSlot(null);
    // Also clear any existing hold when the date changes
    if (holdData) {
      // TODO: Ideally, also call an API to release the server-side lock immediately.
      setHoldData(null);
    }
  }

  const onTimeSelect = (slot) => {
    handleTimeSelect(slot, providerId, service?._id || service?.id, date);
  }

  const onBook = () => {
    handleBook(holdData, service, selectedSlot, providerId, date, time);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
        <BookingHeader service={service} onClose={onClose} />
        <BookingProgress step={step} />

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <DateSelector
              dates={dates}
              selectedDate={date}
              onDateSelect={onDateSelect}
            />
          )}

          {step === 2 && (
            <TimeSelector
              slots={slots}
              selectedTime={time}
              onTimeSelect={onTimeSelect}
              loading={loadingSlots || isHolding}
              error={error || fetchError}
            />
          )}

          {step === 3 && (
            <ConfirmationStep
              service={service}
              date={date}
              // FIX: Show AM/PM time if available
              time={selectedSlot?.displayTime || time}
            />
          )}
        </div>

        <BookingFooter
            step={step}
            setStep={setStep}
            isSubmitting={isSubmitting}
            selectedSlot={selectedSlot}
            date={date}
            time={time}
            loadingSlots={loadingSlots}
            onBook={onBook}
        />
      </div>
    </div>
  );
}
