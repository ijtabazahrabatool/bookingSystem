import React, { useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";

export default function ServiceCardNew({ service, onBook }) {
  const { user } = useContext(AuthContext);
  return (
    <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image/Icon Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center overflow-hidden">
        {service.images && service.images.length > 0 && typeof service.images[0] === 'string' && !service.images[0].includes('data:image') ? (
          <img 
            src={service.images[0].startsWith('/uploads') 
              ? `http://localhost:5001${service.images[0]}` 
              : service.images[0].startsWith('http')
              ? service.images[0]
              : `http://localhost:5001${service.images[0]}`} 
            alt={service.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to emoji if image fails to load
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.emoji-fallback');
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className={`text-6xl emoji-fallback ${service.images && service.images.length > 0 && typeof service.images[0] === 'string' && !service.images[0].includes('data:image') ? 'hidden' : 'flex'}`}>
          {service.image || "💇"}
        </div>
        {service.rating > 0 && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-soft">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-900">{service.rating}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-2">
            {service.category}
          </span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{service.description}</p>
          {service.providerId && (
            <p className="text-xs text-gray-500">
              by {service.providerId.name || service.providerId}
            </p>
          )}
        </div>

        {/* Price and Duration */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-2xl font-bold text-primary-600">${service.price}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Duration</p>
            <p className="text-lg font-semibold text-gray-900">{service.duration} min</p>
          </div>
        </div>

        {/* Book Button */}
        {user?.role === 'provider' ? (
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
          >
            Provider View Only
          </button>
        ) : (
          <button
            onClick={() => onBook(service)}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}
