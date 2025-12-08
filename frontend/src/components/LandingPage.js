import React from "react";

export default function LandingPage({ onGetStarted, onLearnMore }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Book Your Perfect
              <span className="block text-primary-600">Appointment</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 animate-slide-up">
              Discover premium services, manage your schedule effortlessly, and experience
              seamless booking with our modern platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg shadow-medium hover:bg-primary-700 transition-all transform hover:scale-105"
              >
                Get Started
              </button>
              <button
                onClick={onLearnMore}
                className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📅",
                title: "Easy Scheduling",
                description: "Book appointments in seconds with our intuitive calendar system"
              },
              {
                icon: "✨",
                title: "Premium Services",
                description: "Access top-rated professionals and services in your area"
              },
              {
                icon: "🔔",
                title: "Smart Reminders",
                description: "Never miss an appointment with automated notifications"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-8 shadow-soft hover:shadow-medium transition-all transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-75"></div>
      </section>
    </div>
  );
}

