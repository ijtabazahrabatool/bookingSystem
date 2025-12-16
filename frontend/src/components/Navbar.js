import React, { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar({ currentView, setView, onLogin, onSignup }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCustomer = isAuthenticated && user?.role === 'customer';
  const isProvider = isAuthenticated && user?.role === 'provider';

  const NavItem = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
        active 
          ? 'text-black bg-gray-100' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 h-20 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full gap-4">
          
          {/* LEFT: LOGO */}
          <div className="flex items-center cursor-pointer min-w-fit" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white mr-2">
              <span className="font-bold text-xl tracking-tighter">Fb</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              FreshaBook
            </span>
          </div>

          {/* CENTER: SEARCH BAR (Visible for Customers/Home) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
            <div className="flex w-full border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden divide-x divide-gray-200">
              <button className="flex-1 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-black">Treatment</span>
                <span className="block text-sm font-medium text-gray-900 truncate">Any Service</span>
              </button>
              <button className="flex-1 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-black">Location</span>
                <span className="block text-sm font-medium text-gray-900 truncate">Current Location</span>
              </button>
              <button className="w-32 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-black">Time</span>
                <span className="block text-sm font-medium text-gray-900 truncate">Any time</span>
              </button>
              <button className="bg-primary-600 w-12 flex items-center justify-center hover:bg-black transition-colors">
                <i className="fa-solid fa-search text-white"></i>
              </button>
            </div>
          </div>

          {/* RIGHT: NAVIGATION & PROFILE */}
          <div className="flex items-center gap-2 sm:gap-4 justify-end min-w-fit">
            
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavItem label="For Business" onClick={() => {}} />
              {!isAuthenticated && (
                 <>
                   <NavItem label="Log in" onClick={onLogin} />
                   <button 
                     onClick={onSignup}
                     className="ml-2 bg-primary-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-soft hover:bg-black transition-all hover:scale-105 active:scale-95"
                   >
                     Sign up
                   </button>
                 </>
              )}
            </div>

            {/* Authenticated User Menu */}
            {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 p-1 rounded-full border border-gray-200 hover:shadow-md transition-all pl-4 pr-1"
                >
                  <i className="fa-solid fa-bars text-gray-400"></i>
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-900 font-bold border-2 border-white shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-dropdown border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="py-2">
                      {isCustomer && (
                        <>
                          <DropdownItem icon="fa-user" label="Profile" onClick={() => { setView('customer-dashboard'); setShowDropdown(false); }} />
                          <DropdownItem icon="fa-calendar" label="Appointments" onClick={() => { setView('customer-dashboard'); setShowDropdown(false); }} />
                          <DropdownItem icon="fa-wallet" label="Wallet" badge="New" />
                          <DropdownItem icon="fa-heart" label="Favorites" />
                          <div className="h-px bg-gray-100 my-2 mx-4" />
                        </>
                      )}
                      {isProvider && (
                        <>
                          <DropdownItem icon="fa-chart-line" label="Dashboard" onClick={() => { setView('provider-dashboard'); setShowDropdown(false); }} />
                          <DropdownItem icon="fa-clock" label="Availability" onClick={() => { setView('provider-availability'); setShowDropdown(false); }} />
                          <div className="h-px bg-gray-100 my-2 mx-4" />
                        </>
                      )}
                      <DropdownItem icon="fa-gear" label="Settings" />
                      <DropdownItem icon="fa-right-from-bracket" label="Log out" onClick={logout} danger />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

const DropdownItem = ({ icon, label, onClick, danger, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 flex justify-center ${danger ? 'text-red-500' : 'text-gray-400'}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);
