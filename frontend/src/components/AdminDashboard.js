import React, { useMemo } from "react";
import AdminCharts from "./AdminCharts";
import { updateBookingStatus, deleteBooking } from "../services/api";

export default function AdminDashboard({ appointments, services, onUpdateStatus, onDelete }) {
  const stats = useMemo(() => {
    const total = appointments.length;
    const revenue = appointments.reduce((sum, a) => sum + (a.status !== 'Cancelled' ? a.price : 0), 0);
    const pending = appointments.filter(a => a.status === 'Pending').length;
    return { total, revenue, pending };
  }, [appointments]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      onUpdateStatus(id, status);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error: ${error.response?.data?.message || "Failed to update status"}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteBooking(id);
        onDelete(id);
      } catch (error) {
        console.error("Error deleting booking:", error);
        alert(`Error: ${error.response?.data?.message || "Failed to delete booking"}`);
      }
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Bookings</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <i className="fa-solid fa-calendar-days"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-800">${stats.revenue}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <i className="fa-solid fa-dollar-sign"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
            <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <i className="fa-solid fa-clock"></i>
          </div>
        </div>
      </div>

      {/* Charts */}
      <AdminCharts appointments={appointments} services={services} />

      {/* Booking Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Recent Appointments</h3>
          <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Date/Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map(app => {
                // Handle both old format (date/time) and new format (startAt/endAt)
                let displayDate = app.date;
                let displayTime = app.time;
                if (app.startAt) {
                  const startDate = new Date(app.startAt);
                  displayDate = startDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  displayTime = startDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  });
                }
                
                // Get customer name from userId or customer field
                const customerName = app.userId?.name || app.customer || "Unknown Customer";
                
                return (
                <tr key={app._id || app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{customerName}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      if (app.serviceId?.name) {
                        return app.serviceId.name;
                      }
                      const service = services.find(s => 
                        s._id === app.serviceId || 
                        s._id === app.serviceId?._id || 
                        s.id === app.serviceId || 
                        s.id === app.serviceId?.id
                      );
                      return service?.name || "Unknown";
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{displayDate}</span>
                      <span className="text-xs text-slate-400">{displayTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {app.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(app._id || app.id, 'Confirmed')} 
                          className="text-emerald-600 hover:bg-emerald-50 p-2 rounded"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(app._id || app.id, 'Cancelled')} 
                          className="text-red-600 hover:bg-red-50 p-2 rounded"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(app._id || app.id)} 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
