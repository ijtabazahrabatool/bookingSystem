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

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot, idx) => {
        const isSelected = selectedTime === slot.time;
        // A slot is disabled if it's locked by ANOTHER user.
        // It is not disabled if it's the one currently selected by THIS user.
        const isLockedByOther = slot.locked && !isSelected;

        return (
          <button
            key={idx}
            onClick={() => {
              // Prevent re-selecting the same slot or selecting a locked one.
              if (selectedTime !== slot.time && !isLockedByOther) {
                onTimeSelect(slot);
              }
            }}
            disabled={isLockedByOther}
            className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${
              isSelected
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : isLockedByOther
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
            title={
              isSelected
                ? "Your selected time"
                : isLockedByOther
                ? "This slot is being booked by another customer"
                : "Available - Click to select"
            }
          >
            {slot.time}
            {isLockedByOther && <LockIcon />}
          </button>
        );
      })}
    </div>
  );
}