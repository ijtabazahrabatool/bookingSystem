import React from 'react';

/**
 * The footer component for the booking modal.
 * @param {object} props - The component props.
 * @param {number} props.step - The current step in the booking process.
 * @param {Function} props.setStep - The function to set the current step.
 * @param {boolean} props.isSubmitting - Whether the booking is currently being submitted.
 * @param {object} props.selectedSlot - The currently selected time slot.
 * @param {string} props.date - The selected date.
 * @param {string} props.time - The selected time.
 * @param {boolean} props.loadingSlots - Whether the slots are currently loading.
 * @param {Function} props.onBook - The function to call when the book button is clicked.
 * @returns {JSX.Element} The rendered component.
 */
export default function BookingFooter({ step, setStep, isSubmitting, selectedSlot, date, time, loadingSlots, onBook }) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
      {step > 1 && (
        <button
          onClick={() => setStep(step - 1)}
          className="px-5 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-200"
        >
          ← Back
        </button>
      )}
      <div className="ml-auto">
        {step < 3 ? (
          <button
            disabled={(!date && step === 1) || (!time && step === 2) || loadingSlots}
            onClick={() => setStep(step + 1)}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={onBook}
            disabled={isSubmitting || !selectedSlot}
            className="px-8 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirm Booking</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
