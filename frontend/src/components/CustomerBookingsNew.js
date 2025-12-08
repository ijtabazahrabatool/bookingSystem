import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getBookings, cancelBooking } from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import { useToast } from "./Toast";

export default function CustomerBookingsNew() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, past

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await cancelBooking(bookingId);
      showToast("Booking cancelled successfully. The time slot is now available for others.", "success");
      await fetchBookings();
    } catch (error) {
      console.error("Cancel error:", error);
      showToast(error.response?.data?.message || "Failed to cancel booking", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Rejected':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return dateStr;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return timeStr;
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = b.startAt ? new Date(b.startAt) : (b.date ? new Date(b.date) : null);
    return bookingDate && bookingDate >= now && b.status !== 'Cancelled' && b.status !== 'Completed';
  });
  
  const pastBookings = bookings.filter(b => {
    const bookingDate = b.startAt ? new Date(b.startAt) : (b.date ? new Date(b.date) : null);
    return !bookingDate || bookingDate < now || b.status === 'Cancelled' || b.status === 'Completed';
  });

  if (!isAuthenticated || user?.role !== 'customer') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Please login as a customer to view your bookings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const displayBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your appointments and view booking history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "upcoming"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "past"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          History ({pastBookings.length})
        </button>
      </div>

      {displayBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </h3>
          <p className="text-gray-600">
            {activeTab === "upcoming" ? "Start by booking a service!" : "Your completed and cancelled bookings will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayBookings.map(booking => {
            const bookingDate = booking.startAt ? new Date(booking.startAt) : (booking.date ? new Date(booking.date) : null);
            const canCancel = activeTab === "upcoming" && 
              booking.status !== 'Cancelled' && 
              booking.status !== 'Completed' &&
              booking.status !== 'Rejected';

            return (
              <div
                key={booking._id || booking.id}
                className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-medium transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {booking.serviceId?.name || "Service"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.serviceId?.description || "No description"}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {bookingDate ? formatDate(booking.startAt || booking.date) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.startAt ? formatTime(booking.startAt) : (booking.time || "N/A")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.serviceId?.duration || "N/A"} min
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price</p>
                        <p className="text-lg font-bold text-primary-600">
                          ${booking.price || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {canCancel && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelBooking(booking._id || booking.id)}
                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

