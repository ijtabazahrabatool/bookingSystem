// Loading skeleton component for smooth loading states
export const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-soft p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export const SkeletonButton = () => (
  <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 rounded mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      ></div>
    ))}
  </div>
);

export const SkeletonCalendar = () => (
  <div className="grid grid-cols-7 gap-2">
    {Array.from({ length: 35 }).map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    ))}
  </div>
);

