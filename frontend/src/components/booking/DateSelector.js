import React from 'react';

/**
 * The date selection component for the booking modal.
 * @param {object} props - The component props.
 * @param {Array} props.dates - The list of dates to display.
 * @param {string} props.selectedDate - The currently selected date.
 * @param {Function} props.onDateSelect - The function to call when a date is selected.
 * @returns {JSX.Element} The rendered component.
 */
export default function DateSelector({ dates, selectedDate, onDateSelect }) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Date</h3>
      <div className="grid grid-cols-7 gap-2">
        {dates.map(({ date: dateStr, day, isPast }) => {
          const isSelected = selectedDate === dateStr;
          const isDisabled = isPast;

          return (
            <button
              key={dateStr}
              onClick={() => {
                if (!isDisabled) {
                  onDateSelect(dateStr);
                }
              }}
              disabled={isDisabled}
              className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : isDisabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="text-xs font-semibold mb-1">{dayNames[day.getDay()]}</div>
              <div className="text-lg font-bold">{day.getDate()}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
