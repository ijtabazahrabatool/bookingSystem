import React from 'react';

/**
 * The progress indicator for the booking modal.
 * @param {object} props - The component props.
 * @param {number} props.step - The current step in the booking process.
 * @returns {JSX.Element} The rendered component.
 */
export default function BookingProgress({ step }) {
  return (
    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
        <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Step {step} of 3</p>
    </div>
  );
}
