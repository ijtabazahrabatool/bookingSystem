import { useMemo } from 'react';

/**
 * A custom hook to generate a list of selectable dates for the booking modal.
 * @returns {Array} A list of date objects.
 */
export function useDateSelection() {
  const dates = useMemo(() => {
    const getYYYYMMDD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isPast = i === 0 && new Date().getHours() >= 23;

      arr.push({
        date: getYYYYMMDD(d),
        day: d,
        isPast: isPast,
      });
    }
    return arr;
  }, []);

  return dates;
}
