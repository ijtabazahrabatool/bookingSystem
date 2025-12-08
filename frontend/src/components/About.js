import React from "react";

export default function About({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <h2 className="text-3xl font-bold">About LuxeBook</h2>
          <p className="text-indigo-100 text-sm mt-2">Your Premium Appointment Booking System</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Welcome to LuxeBook</h3>
            <p className="text-slate-600 leading-relaxed">
              LuxeBook is a modern, elegant appointment booking system designed to connect customers 
              with premium service providers. Whether you're looking for a haircut, spa treatment, 
              medical consultation, or any other professional service, LuxeBook makes scheduling 
              effortless and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-4">
                <i className="fa-solid fa-calendar-check text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Easy Booking</h4>
              <p className="text-slate-600 text-sm">
                Browse services, select your preferred date and time, and book in just a few clicks. 
                Our intuitive interface makes scheduling a breeze.
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                <i className="fa-solid fa-star text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Top-Rated Services</h4>
              <p className="text-slate-600 text-sm">
                Discover the best service providers in your area. All services are carefully curated 
                and rated by our community.
              </p>
            </div>

            <div className="bg-emerald-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white mb-4">
                <i className="fa-solid fa-shield-halved text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Secure & Reliable</h4>
              <p className="text-slate-600 text-sm">
                Your data is protected with industry-standard security. We ensure your personal 
                information and booking details are safe and confidential.
              </p>
            </div>

            <div className="bg-amber-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center text-white mb-4">
                <i className="fa-solid fa-bell text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Smart Notifications</h4>
              <p className="text-slate-600 text-sm">
                Get instant updates about your bookings. Receive reminders and confirmations 
                so you never miss an appointment.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xl font-bold text-slate-800 mb-3">For Service Providers</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              LuxeBook offers powerful tools for service providers to manage their business efficiently. 
              Our provider dashboard includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
              <li>Real-time booking management and calendar view</li>
              <li>Analytics and revenue tracking with interactive charts</li>
              <li>Service popularity insights to optimize your offerings</li>
              <li>Customer management and communication tools</li>
              <li>Status updates and appointment confirmations</li>
            </ul>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed">
              At LuxeBook, we believe that booking appointments should be as elegant and seamless 
              as the services themselves. We're committed to providing a premium experience for both 
              customers and service providers, making professional scheduling simple, beautiful, and efficient.
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to Get Started?</h3>
            <p className="text-slate-600 mb-4">
              Join thousands of satisfied customers and providers using LuxeBook today.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Booking Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


