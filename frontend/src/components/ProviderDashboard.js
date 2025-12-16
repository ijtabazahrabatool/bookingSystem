import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { getServices, createService, updateService, deleteService, getBookings, updateBookingStatus, cancelBooking, getQueue, addWalkIn, updateQueueStatus} from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import ProviderAvailability from "./ProviderAvailability";
import { useToast } from "./Toast";
import ImageUpload from "./ImageUpload";

export default function ProviderDashboard() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ customerName: "", serviceName: "", duration: 30 });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    duration: "",
    category: "",
    description: "",
    image: "💇",
    images: [],
    imageFiles: [],
    currency: "USD"
  });
  
  const categories = [
    "Haircut", "Hair Color", "Hair Styling", "Hair Treatment",
    "Facial", "Massage", "Manicure", "Pedicure", "Waxing",
    "Makeup", "Brow & Lash", "Nail Art", "Other"
  ];
  
  const currencies = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR"];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const providerId = user?.id || user?._id;
      if (!providerId) {
        setLoading(false);
        return;
      }

      // Fetch services and bookings in parallel
      const [servicesRes, bookingsRes, queueRes] = await Promise.all([
        getServices(`?providerId=${providerId}`).catch(() => ({ data: [] })),
        getBookings().catch(() => ({ data: [] })),// Backend filters bookings by user role
        getQueue().catch(() => ({ data: [] }))
      ]);

      setServices(servicesRes.data || []);
      setBookings(bookingsRes.data || []);
      setQueueData(queueRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const providerId = user?.id || user?._id;
      if (!providerId) {
        showToast("Please login as a provider", "error");
        return;
      }
      
      // If there are image files, use FormData, otherwise use JSON
      if (serviceForm.imageFiles && serviceForm.imageFiles.length > 0) {
        const formData = new FormData();
        formData.append('name', serviceForm.name);
        formData.append('category', serviceForm.category);
        formData.append('price', parseFloat(serviceForm.price) || 0);
        formData.append('duration', parseInt(serviceForm.duration) || 30);
        formData.append('description', serviceForm.description);
        formData.append('currency', serviceForm.currency || 'USD');
        formData.append('image', serviceForm.images?.[0] || serviceForm.image || "💇");
        
        // Append image files
        serviceForm.imageFiles.forEach((file) => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
        
        if (editingService) {
          await updateService(editingService._id, formData);
        } else {
          await createService(formData);
        }
      } else {
        // No files, use regular JSON
        const serviceData = {
          ...serviceForm,
          price: parseFloat(serviceForm.price) || 0,
          duration: parseInt(serviceForm.duration) || 30,
          providerId: providerId
        };
        
        if (editingService) {
          await updateService(editingService._id, serviceData);
        } else {
          await createService(serviceData);
        }
      }
      
      showToast(editingService ? "Service updated successfully" : "Service created successfully", "success");
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: "", price: "", duration: "", category: "", description: "", image: "💇", images: [], imageFiles: [], currency: "USD" });
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save service", "error");
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      showToast("Service deleted successfully", "success");
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete service", "error");
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      await addWalkIn(walkInForm);
      showToast("Walk-in added to queue", "success");
      setShowWalkInModal(false);
      setWalkInForm({ customerName: "", serviceName: "", duration: 30 });
      fetchData();
    } catch (err) {
      showToast("Failed to add walk-in", "error");
    }
  };

  const handleQueueStatus = async (id, status) => {
    try {
      await updateQueueStatus(id, status);
      fetchData(); // Refresh list
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      if (action === "cancel") {
        await cancelBooking(bookingId);
        showToast("Booking cancelled successfully", "success");
      } else {
        await updateBookingStatus(bookingId, action);
        showToast(`Booking ${action.toLowerCase()} successfully`, "success");
      }
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update booking", "error");
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === "Pending").length,
    confirmed: bookings.filter(b => b.status === "Confirmed").length,
    revenue: bookings
      .filter(b => b.status === "Confirmed" || b.status === "Completed")
      .reduce((sum, b) => sum + (b.price || 0), 0)
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
        <p className="text-gray-600">Manage your services and bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-primary-500">
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Confirmed</p>
          <p className="text-3xl font-bold text-gray-900">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${stats.revenue}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {["overview", "services", "bookings", "revenue"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "queue"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Live Queue
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceForm({ name: "", price: "", duration: "", category: "", description: "", image: "💇", images: [], imageFiles: [], currency: "USD" });
                  setShowServiceModal(true);
                }}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
              >
                <div className="text-2xl mb-2">➕</div>
                <div className="font-medium text-gray-700">Add Service</div>
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium text-gray-700">View Bookings</div>
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium text-gray-700">Manage Availability</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">My Services</h2>
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: "", price: "", duration: "", category: "", description: "", image: "💇", images: [], imageFiles: [], currency: "USD" });
                setShowServiceModal(true);
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Add Service
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service._id} className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
                <div className="text-4xl mb-4">{service.image || "💇"}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                  <span className="text-sm text-gray-500">{service.duration} min</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setServiceForm({
                        name: service.name,
                        price: service.price,
                        duration: service.duration,
                        category: service.category,
                        description: service.description,
                        image: service.image || "💇",
                        images: service.images || [],
                        imageFiles: [],
                        currency: service.currency || "USD"
                      });
                      setShowServiceModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bookings</h2>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-soft">
                <p className="text-gray-600">No bookings yet</p>
              </div>
            ) : (
              bookings.map(booking => (
                <div key={booking._id} className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.serviceId?.name || "Service"}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Customer:</span> {booking.userId?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {booking.userId?.email || "N/A"}
                        </p>
                        {booking.userId?.phone && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span> {booking.userId.phone}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Time:</span>{" "}
                          {booking.startAt ?
                            new Date(booking.startAt).toLocaleString('en-US', {
                                timeZone: user?.providerProfile?.timezone || 'UTC',
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })
                            : `${booking.date} at ${booking.time}`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Price:</span> ${booking.price || 0}
                        </p>
                      </div>
                      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${
                        booking.status === "Confirmed" ? "bg-green-100 text-green-700 border-green-200" :
                        booking.status === "Pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                        booking.status === "Cancelled" ? "bg-red-100 text-red-700 border-red-200" :
                        booking.status === "Rejected" ? "bg-gray-100 text-gray-700 border-gray-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>
                        {booking.status}
                      </span>
                      {booking.status === "Cancelled" && booking.userId && (
                        <p className="text-xs text-red-600 mt-2 italic">
                          Cancelled by {booking.userId.name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {booking.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleBookingAction(booking._id, "Confirmed")}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking._id, "Rejected")}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {["Pending", "Confirmed"].includes(booking.status) && (
                        <button
                          onClick={() => handleBookingAction(booking._id, "cancel")}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "availability" && (
        <ProviderAvailability />
      )}

      {activeTab === "revenue" && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Revenue Summary</h2>
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.revenue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Bookings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === "Completed").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Booking</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.revenue > 0
                    ? Math.round(stats.revenue / bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").length)
                    : 0}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-2">
                {bookings
                  .filter(b => b.status === "Confirmed" || b.status === "Completed")
                  .slice(0, 10)
                  .map(booking => (
                    <div key={booking._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{booking.serviceId?.name || "Service"}</p>
                        <p className="text-sm text-gray-600">
                          {booking.startAt
                            ? new Date(booking.startAt).toLocaleDateString()
                            : booking.date}
                        </p>
                      </div>
                      <p className="font-semibold text-primary-600">${booking.price || 0}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Today's Digital Queue</h2>
            <button 
              onClick={() => setShowWalkInModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Add Walk-In
            </button>
          </div>

          <div className="grid gap-4">
            {queueData.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-xl">No customers in queue yet.</div>
            ) : (
              queueData.map((entry) => (
                <div key={entry._id} className={`p-6 rounded-xl border flex justify-between items-center ${
                  entry.status === 'IN_PROGRESS' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-6">
                    <div className="bg-gray-900 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                      #{entry.tokenNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{entry.customerName}</h3>
                      <p className="text-gray-600 text-sm">
                        {entry.serviceName} • {entry.isWalkIn ? <span className="text-indigo-600 font-medium">Walk-in</span> : "Appointment"}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        entry.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                        entry.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {entry.status === 'WAITING' && (
                      <button 
                        onClick={() => handleQueueStatus(entry._id, "IN_PROGRESS")}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                      >
                        Start Serving
                      </button>
                    )}
                    {entry.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => handleQueueStatus(entry._id, "COMPLETED")}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                      >
                        Complete
                      </button>
                    )}
                    {entry.status !== 'COMPLETED' && (
                      <button 
                        onClick={() => handleQueueStatus(entry._id, "SKIPPED")}
                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Walk In Modal */}
          {showWalkInModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4">Add Walk-In Customer</h3>
                <form onSubmit={handleWalkInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                    <input 
                      className="w-full border p-2 rounded" 
                      required
                      value={walkInForm.customerName}
                      onChange={e => setWalkInForm({...walkInForm, customerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service</label>
                    <input 
                      className="w-full border p-2 rounded" 
                      required
                      value={walkInForm.serviceName}
                      onChange={e => setWalkInForm({...walkInForm, serviceName: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded">Add to Queue</button>
                    <button type="button" onClick={() => setShowWalkInModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {editingService ? "Edit Service" : "Add Service"}
            </h2>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={serviceForm.currency}
                    onChange={(e) => setServiceForm({ ...serviceForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <ImageUpload
                  images={serviceForm.images || []}
                  onChange={(files) => {
                    // files can be File objects or preview URLs
                    const fileObjects = files.filter(f => f instanceof File);
                    const previewUrls = files.filter(f => typeof f === 'string');
                    setServiceForm({ 
                      ...serviceForm, 
                      images: previewUrls.length > 0 ? previewUrls : serviceForm.images,
                      imageFiles: fileObjects,
                      image: previewUrls[0] || serviceForm.images?.[0] || serviceForm.image
                    });
                  }}
                  maxImages={6}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                  }}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
