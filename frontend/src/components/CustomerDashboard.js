import React, { useState, useEffect, useContext } from "react";
import { getServices, getBookings, cancelBooking } from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import { useToast } from "./Toast";
import BookingModal from "./BookingModal";
import { AuthContext } from "../context/AuthContext";

export default function CustomerDashboard() {
  const [services, setServices] = useState([]);
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
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
      {/* Keep BookingModal Logic */}
      {serviceToBook && (
        <BookingModal
          service={serviceToBook}
          onClose={() => setServiceToBook(null)}
          onConfirm={async () => { await fetchData(); }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10">
           <div>
             <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.name || 'Guest'}</h1>
             <p className="text-gray-500 mt-1">Ready to book your next appointment?</p>
           </div>
           <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
              <button onClick={() => setActiveTab('browse')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}>Book New</button>
              <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}>My Appointments</button>
           </div>
        </div>

        {activeTab === 'browse' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map(service => (
                 <div key={service._id} onClick={() => setServiceToBook(service)} className="group bg-white border border-gray-100 rounded-xl p-6 cursor-pointer hover:shadow-elevated hover:border-primary-100 transition-all">
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.image || "💇"}</div>
                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">{service.duration} mins • {service.category || 'General'}</p>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                       <span className="font-bold text-lg text-primary-600">${service.price}</span>
                       <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-1 rounded">Book Now</span>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'bookings' && (
           <div className="space-y-4">
              {bookings.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
                    <p className="text-gray-400 font-medium">No upcoming appointments</p>
                    <button onClick={() => setActiveTab('browse')} className="text-primary-600 font-bold text-sm mt-2">Browse Services</button>
                 </div>
              ) : (
                 bookings.map(booking => (
                    <div key={booking._id} className="bg-white rounded-xl p-6 border-l-4 border-primary-500 shadow-soft flex justify-between items-center">
                       <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                             {booking.startAt ? new Date(booking.startAt).toLocaleDateString() : booking.date}
                          </p>
                          <h3 className="text-xl font-bold text-gray-900">{booking.serviceId?.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                             {booking.startAt ? new Date(booking.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : booking.time}
                          </p>
                       </div>
                       <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                             {booking.status}
                          </span>
                          {booking.status !== 'Cancelled' && (
                             <button onClick={() => handleCancelBooking(booking._id)} className="block text-xs text-red-500 hover:underline">Cancel</button>
                          )}
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>
    </>
  );
}
