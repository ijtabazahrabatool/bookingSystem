import React, { useState, useEffect } from "react";
import { getServices, getBookings, cancelBooking } from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import { useToast } from "./Toast";
import BookingModal from "./BookingModal";

export default function CustomerDashboard() {
  const [services, setServices] = useState([]);
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse"); // browse, bookings
  const [serviceToBook, setServiceToBook] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, bookingsRes] = await Promise.all([
        getServices(),
        getBookings().catch(() => ({ data: [] }))
      ]);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await cancelBooking(bookingId); 
      showToast("Booking cancelled successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Cancel error:", error);
      showToast(error.response?.data?.message || "Failed to cancel booking", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <>
      {serviceToBook && (
        <BookingModal
          service={serviceToBook}
          onClose={() => setServiceToBook(null)}
          onConfirm={async () => {
            // This will be called before the modal navigates away.
            // We can refresh data here.
            await fetchData();
          }}
        />
      )}
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
        <p className="text-gray-600">Browse services and manage your bookings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "browse"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Browse Services
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "bookings"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Bookings ({bookings.length})
        </button>
      </div>

      {activeTab === "browse" && (
        <div className="space-y-8">
          {/* Service Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select a Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div
                    key={service._id}
                    onClick={() => setServiceToBook(service)}
                    className="bg-white rounded-xl p-6 shadow-soft hover:shadow-medium transition-all cursor-pointer border border-gray-200 hover:border-primary-300"
                  >
                    <div className="text-4xl mb-4">{service.image || "💇"}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                      <span className="text-sm text-gray-500">{service.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">My Bookings</h2>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-soft">
              <p className="text-gray-600">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl p-6 shadow-soft border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.serviceId?.name || "Service"}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {booking.startAt
                          ? new Date(booking.startAt).toLocaleString()
                          : `${booking.date} at ${booking.time}`}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === "Confirmed" ? "bg-green-100 text-green-700" :
                        booking.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    {booking.status !== "Cancelled" && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
