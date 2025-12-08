import React from "react";

export default function Hero({ setView, onLearnMore }) {
  return (
    <div className="relative bg-gradient-to-br from-white to-primary-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-16 sm:py-20 lg:py-28">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Book appointments</span>
              <span className="block text-primary-600 mt-2">with ease & style</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl">
              Discover top-rated consultants, clinics, and salons. Manage your schedule effortlessly with our premium booking experience.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setView('services')} 
                className="px-8 py-4 text-base font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
              >
                Book Now
              </button>
              <button 
                onClick={onLearnMore}
                className="px-8 py-4 text-base font-semibold rounded-xl text-primary-600 bg-white border-2 border-primary-600 hover:bg-primary-50 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

