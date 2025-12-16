import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar({ currentView, setView, onLogin, onSignup }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-soft">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              BookApp
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <button 
              onClick={() => setView('home')} 
              className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setView('services')} 
              className={`text-sm font-medium transition-colors ${currentView === 'services' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Services
            </button>
            {isAuthenticated && user && user.role === 'customer' && (
              <>
                <button 
                  onClick={() => setView('customer-dashboard')} 
                  className={`text-sm font-medium transition-colors ${currentView === 'customer-dashboard' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setView('my-bookings')} 
                  className={`text-sm font-medium transition-colors ${currentView === 'my-bookings' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  My Bookings
                </button>
              </>
            )}
            {isAuthenticated && user && user.role === 'provider' && (
              <>
                <button 
                  onClick={() => setView('provider-dashboard')} 
                  className={`text-sm font-medium transition-colors ${currentView === 'provider-dashboard' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setView('provider-availability')} 
                  className={`text-sm font-medium transition-colors ${currentView === 'provider-availability' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Availability
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold border border-primary-200">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-sm">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-600 capitalize">{user?.role}</div>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onLogin}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={onSignup}
                  className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-soft hover:bg-primary-700 transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
