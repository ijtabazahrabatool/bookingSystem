import React from 'react';

/**
 * The header component for the booking modal.
 * @param {object} props - The component props.
 * @param {object} props.service - The service being booked.
 * @param {Function} props.onClose - The function to call when the modal is closed.
 * @returns {JSX.Element} The rendered component.
 */
export default function BookingHeader({ service, onClose }) {
  return (
    <div className="px-6 py-5 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{service?.name || "Book Appointment"}</h2>
          <p className="text-sm text-gray-500 mt-1">${service?.price} • {service?.duration || 30} min</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
