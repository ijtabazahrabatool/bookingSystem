import React, { useState, useEffect } from "react";
import { getServices, getBookings, getProviderSlots, holdSlot, confirmBooking, cancelBooking } from "../services/api";
import { SkeletonCard, SkeletonCalendar } from "./LoadingSkeleton";

export default function CustomerDashboard() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeTab, setActiveTab] = useState("browse"); // browse, bookings

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedProvider && selectedService) {
      fetchSlots();
    }
  }, [selectedDate, selectedProvider, selectedService]);

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

  const fetchSlots = async () => {
    if (!selectedProvider || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const response = await getProviderSlots(
        selectedProvider._id || selectedProvider,
        selectedDate,
        selectedService?._id
      );
      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const handleBookSlot = async (slot) => {
    if (!selectedService || !selectedProvider || !selectedDate) return;
    
    try {
      // Hold the slot
      const holdResponse = await holdSlot({
        providerId: selectedProvider._id || selectedProvider,
        serviceId: selectedService._id,
        date: selectedDate,
        time: slot.time
      });

      // Confirm immediately
      await confirmBooking(holdResponse.data.bookingId, holdResponse.data.holdToken);
      
      // Refresh bookings
      await fetchData();
      alert("Booking confirmed successfully!");
      
      // Reset selection
      setSelectedService(null);
      setSelectedProvider(null);
      setSelectedDate("");
      setAvailableSlots([]);
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.message || "Failed to book appointment");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await cancelBooking(bookingId);
      alert("Booking cancelled successfully");
      await fetchData();
    } catch (error) {
      console.error("Cancel error:", error);
      alert(error.response?.data?.message || "Failed to cancel booking");
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
          {!selectedService ? (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select a Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div
                    key={service._id}
                    onClick={() => setSelectedService(service)}
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
          ) : (
            <>
              {/* Provider Selection */}
              {!selectedProvider ? (
                <div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ← Back to Services
                  </button>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Select Provider for {selectedService.name}
                  </h2>
                  <div className="bg-white rounded-xl p-6 shadow-soft">
                    <p className="text-gray-600">
                      Provider selection feature - showing default provider for now
                    </p>
                    <button
                      onClick={() => setSelectedProvider({ _id: "693513466d6ee0d1b68b48bc", name: "Default Provider" })}
                      className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Continue with Default Provider
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Selection */}
                  {!selectedDate ? (
                    <div>
                      <button
                        onClick={() => setSelectedProvider(null)}
                        className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        ← Back to Providers
                      </button>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Date</h2>
                      {loadingSlots ? (
                        <SkeletonCalendar />
                      ) : (
                        <div className="grid grid-cols-7 gap-2">
                          {generateCalendarDays().map(date => (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-center"
                            >
                              <div className="text-sm font-medium text-gray-700">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {new Date(date).getDate()}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Time Slot Selection */}
                      <div>
                        <button
                          onClick={() => setSelectedDate("")}
                          className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          ← Back to Dates
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                          Select Time for {new Date(selectedDate).toLocaleDateString()}
                        </h2>
                        {loadingSlots ? (
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="bg-white rounded-xl p-8 text-center shadow-soft">
                            <p className="text-gray-600">No available slots for this date</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-3">
                            {availableSlots
                              .filter(slot => !slot.locked)
                              .map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleBookSlot(slot)}
                                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-600 hover:bg-primary-50 transition-all text-center font-medium"
                                >
                                  {slot.time}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
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
  );
}

