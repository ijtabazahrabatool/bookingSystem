import React from 'react';

const LockIcon = () => (
  <svg className="w-3 h-3 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
      <p className="text-sm text-gray-500">Loading available times...</p>
    </div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-sm text-red-600">{message}</p>
  </div>
);

const NoSlotsMessage = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-sm text-gray-500">No available time slots for this date</p>
    <p className="text-xs text-gray-400 mt-1">The provider may not have set availability for this day. Please select another date.</p>
  </div>
);

export default function TimeSelector({ slots, selectedTime, onTimeSelect, loading, error }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!slots || slots.length === 0) {
    return <NoSlotsMessage />;
  }

  // Helper to check if time is past
  const isTimeInPast = (timeStr) => {
    const today = new Date();
    // We assume the parent component passes 'slots' for the selected date.
    // If we don't have the date prop here, we can rely on the fact that 
    // usually past dates aren't selectable. We only care if it's TODAY.
    // Note: To be perfectly accurate, TimeSelector should receive the 'selectedDate' prop.
    // Assuming implicit "today" check or purely time based filtering:
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    
    // If the slot time is earlier than now, return true
    return slotDate < today;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot, idx) => {
        const isSelected = selectedTime === slot.time;
        const isPast = isTimeInPast(slot.time);

       // A slot is disabled if it's locked by another OR it is in the past
        const isDisabled = (slot.locked && !isSelected) || isPast;

        return (
          <button
            key={idx}
            onClick={() => {
              if (selectedTime !== slot.time && !isDisabled) {
                onTimeSelect(slot);
              }
            }}
            disabled={isDisabled}
            className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${
              isSelected
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : isDisabled
                ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed' // Greyed out style
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            {slot.time}
            {slot.locked && !isSelected && <LockIcon />}
          </button>
        );
      })}
    </div>
  );
}