import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ServiceCard from "./components/ServiceCard";
import ServiceCardNew from "./components/ServiceCardNew";
import BookingModal from "./components/BookingModal";
import AdminDashboard from "./components/AdminDashboard";
import CustomerBookings from "./components/CustomerBookings";
import CustomerBookingsNew from "./components/CustomerBookingsNew";
import CustomerDashboard from "./components/CustomerDashboard";
import ProviderDashboard from "./components/ProviderDashboard";
import ProviderAvailability from "./components/ProviderAvailability";
import AuthModal from "./components/AuthModal";
import AuthModalNew from "./components/AuthModalNew";
import LandingPage from "./components/LandingPage";
import About from "./components/About";
// Removed ProtectedRoute import - using direct role checks instead
import { getServices, getBookings, updateBookingStatus, deleteBooking } from "./services/api";

function App() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [view, setView] = useState('home'); // home, services, admin-dashboard
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch services and bookings on mount and when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Always fetch services (public) - even when not logged in
      const servicesRes = await getServices();
      setServices(servicesRes.data || []);
      
      // Only fetch bookings if user is authenticated
      if (isAuthenticated) {
        try {
          const bookingsRes = await getBookings();
          setAppointments(bookingsRes.data || []);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          // If unauthorized, clear bookings
          if (error.response?.status === 401) {
            setAppointments([]);
          }
        }
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Don't show alert for services - just log error
      if (error.response?.status !== 401) {
        console.error("Failed to load services:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions
  const updateStatus = async (id, status) => {
    try {
      const response = await updateBookingStatus(id, status);
      setAppointments(prev => prev.map(a => (a._id || a.id) === id ? response.data : a));
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(`Error: ${error.response?.data?.message || "Could not update status."}`);
    }
  };

  const deleteAppointment = async (id) => {
    // Optimistic UI update for responsiveness
    const originalAppointments = appointments;
    setAppointments(prev => prev.filter(a => (a._id || a.id) !== id));

    try {
      await deleteBooking(id);
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      // Revert UI if API call fails
      setAppointments(originalAppointments);
      alert(`Error: ${error.response?.data?.message || "Could not delete appointment."}`);
    }
  };

  // Views Render Logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (view === 'home') {
      return (
        <>
          <Hero setView={setView} onLearnMore={() => setShowAbout(true)} />
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Services</h2>
              <p className="text-lg text-gray-600">Choose from our top-rated selection of premium services</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map(service => (
                <ServiceCardNew 
                  key={service._id || service.id} 
                  service={service} 
                  onBook={(s) => {
                    if (!isAuthenticated) {
                      setAuthMode("login");
                      setShowAuthModal(true);
                    } else {
                      setSelectedService(s);
                    }
                  }}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 mt-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="mb-8 text-primary-100">Join thousands of satisfied customers using our platform today.</p>
              <button 
                onClick={() => setView('services')} 
                className="px-8 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-soft"
              >
                Browse All Services
              </button>
            </div>
          </div>
        </>
      );
    } else if (view === 'services') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12 fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Choose from our wide selection of premium services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <ServiceCardNew 
                key={service._id || service.id} 
                service={service} 
                onBook={(s) => {
                  if (!isAuthenticated) {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  } else {
                    setSelectedService(s);
                  }
                }}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      );
    } else if (view === 'customer-dashboard') {
      // Only show if user is customer
      if (isAuthenticated && user?.role === 'customer') {
        return <CustomerDashboard />;
      }
      return null;
    } else if (view === 'my-bookings') {
      // Only show if user is customer
      if (isAuthenticated && user?.role === 'customer') {
        return <CustomerBookingsNew />;
      }
      return null;
    } else if (view === 'provider-dashboard') {
      // Only show if user is provider
      if (isAuthenticated && user?.role === 'provider') {
        return <ProviderDashboard />;
      }
      return null;
    } else if (view === 'provider-availability') {
      // Only show if user is provider
      if (isAuthenticated && user?.role === 'provider') {
        return <ProviderAvailability />;
      }
      return null;
    } else if (view === 'admin-dashboard') {
      if (isAuthenticated && user?.role === 'provider') {
        return (
          <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Provider Dashboard</h2>
                <p className="text-gray-600">Welcome back, {user?.name || "Admin"}</p>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
                <i className="fa-solid fa-plus mr-2"></i>Add Service
              </button>
            </div>
            <AdminDashboard 
              appointments={appointments} 
              services={services} 
              onUpdateStatus={updateStatus}
              onDelete={deleteAppointment}
            />
          </div>
        );
      }
      return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar 
        currentView={view} 
        setView={setView} 
        onLogin={() => { setAuthMode("login"); setShowAuthModal(true); }}
        onSignup={() => { setAuthMode("register"); setShowAuthModal(true); }}
      />
      
      <div className="flex-grow">
        {renderContent()}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2023 LuxeBook Systems. MERN Stack Prototype Demo.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-indigo-600">Privacy</a>
            <a href="#" className="hover:text-indigo-600">Terms</a>
            <a href="#" className="hover:text-indigo-600">Support</a>
          </div>
        </div>
      </footer>

      {/* Modals & Toasts */}
      {selectedService && (
        <BookingModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
          onConfirm={async () => {
            // After a successful booking, refresh the list of appointments.
            await fetchData();
          }} 
        />
      )}

      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center z-50 fade-in">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
            <i className="fa-solid fa-check text-white text-sm"></i>
          </div>
          <div>
            <h4 className="font-bold text-sm">Booking Requested!</h4>
            <p className="text-xs text-slate-300">Provider has been notified.</p>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModalNew 
          onClose={() => setShowAuthModal(false)} 
          initialMode={authMode}
        />
      )}

      {showAbout && (
        <About onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

export default App;
