import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getBookings } from "../services/api";

export default function CustomerBookings() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookings();
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isAuthenticated || user?.role !== 'customer') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-600"></i>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">My Bookings</h2>
        <p className="text-slate-500">View and track your appointment status</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-calendar-xmark text-indigo-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No bookings yet</h3>
          <p className="text-slate-500">Start by booking a service!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Date/Time</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map(booking => (
                  <tr key={booking._id || booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {booking.serviceId?.name || "Unknown Service"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.date}</span>
                        <span className="text-xs text-slate-400">{booking.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${booking.price}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


