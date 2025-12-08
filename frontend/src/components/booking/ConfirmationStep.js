import React from 'react';

/**
 * The confirmation step component for the booking modal.
 * @param {object} props - The component props.
 * @param {object} props.service - The service being booked.
 * @param {string} props.date - The selected date.
 * @param {string} props.time - The selected time.
 * @returns {JSX.Element} The rendered component.
 */
export default function ConfirmationStep({ service, date, time }) {
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return 'Not selected';
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (dateStr === today.toISOString().split('T')[0]) {
        return "Today";
        } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
        return "Tomorrow";
        } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    };

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Your Booking</h3>
        <div className="bg-gray-50 rounded-xl p-6 mt-4 space-y-3 text-left max-w-md mx-auto">
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-500">Service</span>
            <span className="text-sm font-medium text-gray-900">{service?.name}</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDateDisplay(date)}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-500">Time</span>
            <span className="text-sm font-medium text-gray-900">{time || 'Not selected'}</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex items-start justify-between">
            <span className="text-sm font-medium text-gray-900">Total</span>
            <span className="text-lg font-semibold text-gray-900">${service?.price}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
