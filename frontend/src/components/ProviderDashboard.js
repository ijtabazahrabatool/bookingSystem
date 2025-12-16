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
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      
      {/* 🧭 NEW LEFT SIDEBAR (Replaces Top Tabs) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Menu</h2>
          <nav className="space-y-1">
            {[
              { id: 'overview', icon: 'fa-chart-pie', label: 'Dashboard' },
              { id: 'queue', icon: 'fa-bolt', label: 'Live Queue' },
              { id: 'bookings', icon: 'fa-calendar-days', label: 'Calendar' },
              { id: 'services', icon: 'fa-scissors', label: 'Services' },
              { id: 'availability', icon: 'fa-clock', label: 'Availability' },
              { id: 'revenue', icon: 'fa-dollar-sign', label: 'Finances' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-primary-600 text-white shadow-soft"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center text-base ${
                  activeTab === item.id ? 'text-white' : 'text-gray-400'
                }`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Mobile Tab Fallback */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2">
           {["overview", "queue", "bookings", "services", "availability", "revenue"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
           ))}
        </div>

        {/* HEADER AREA */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h1>
            <p className="text-gray-500 text-sm">Manage your salon operations</p>
          </div>
          {/* Contextual Actions */}
          {activeTab === 'services' && (
             <button onClick={() => { setEditingService(null); setServiceForm({ name: "", price: "", duration: "", category: "", description: "", image: "💇", images: [], imageFiles: [], currency: "USD" }); setShowServiceModal(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-soft hover:bg-primary-500 transition-colors">
               + Add Service
             </button>
          )}
          {activeTab === 'queue' && (
             <button onClick={() => setShowWalkInModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-soft hover:bg-primary-500 transition-colors">
               + Add Walk-In
             </button>
          )}
        </div>

        {/* 🎨 CONTENT RENDERING (Fresha-Styled Cards) */}
        
      {activeTab === "overview" && (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Total Bookings', value: stats.totalBookings, color: 'text-blue-600' },
                 { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
                 { label: 'Confirmed', value: stats.confirmed, color: 'text-green-600' },
                 { label: 'Revenue', value: `$${stats.revenue}`, color: 'text-primary-600' },
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-soft">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                 </div>
               ))}
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-primary-600 rounded-xl p-8 text-white shadow-elevated">
               <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
               <p className="text-primary-100 mb-6 max-w-md">Manage your services or check your upcoming appointments directly from here.</p>
               <div className="flex gap-3">
                 <button onClick={() => setActiveTab("bookings")} className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">View Calendar</button>
                 <button onClick={() => setActiveTab("queue")} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-400 transition-colors">Manage Queue</button>
               </div>
            </div>
          </div>
      )}

        {/* QUEUE REDESIGN */}
        {activeTab === "queue" && (
          <div className="grid gap-4">
            {queueData.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-4xl mb-3">☕</div>
                <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
                <p className="text-gray-500">No customers waiting at the moment.</p>
              </div>
            ) : (
              queueData.map((entry) => (
                <div key={entry._id} className="bg-white p-5 rounded-xl shadow-soft border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${entry.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      #{entry.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{entry.customerName}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        {entry.serviceName}
                        {entry.isWalkIn && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Walk-in</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex items-center gap-2">
                     {entry.status === 'WAITING' && (
                        <button onClick={() => handleQueueStatus(entry._id, "IN_PROGRESS")} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors">Start Service</button>
                     )}
                     {entry.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleQueueStatus(entry._id, "COMPLETED")} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors">Complete</button>
                     )}
                     {entry.status !== 'COMPLETED' && (
                        <button onClick={() => handleQueueStatus(entry._id, "SKIPPED")} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Skip">
                          <i className="fa-solid fa-forward"></i>
                        </button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SERVICES REDESIGN - Grid Card Style */}
      {activeTab === "services" && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                 <div key={service._id} className="bg-white rounded-xl shadow-card hover:shadow-elevated transition-shadow p-0 overflow-hidden border border-gray-100">
                    <div className="h-32 bg-gray-50 flex items-center justify-center text-4xl">
                       {service.image || "💇"}
                    </div>
                    <div className="p-5">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900">{service.name}</h3>
                          <span className="font-bold text-primary-600">${service.price}</span>
                       </div>
                       <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                       <div className="flex gap-2 pt-4 border-t border-gray-50">
                          <button onClick={() => { setEditingService(service); setServiceForm({
                            name: service.name,
                            price: service.price,
                            duration: service.duration,
                            category: service.category,
                            description: service.description,
                            image: service.image || "💇",
                            images: service.images || [],
                            imageFiles: [],
                            currency: service.currency || "USD"
                          }); setShowServiceModal(true); }} className="flex-1 text-xs font-bold text-gray-600 bg-gray-50 py-2 rounded hover:bg-gray-100 transition-colors">EDIT</button>
                          <button onClick={() => handleDeleteService(service._id)} className="flex-1 text-xs font-bold text-red-600 bg-red-50 py-2 rounded hover:bg-red-100 transition-colors">DELETE</button>
                       </div>
                    </div>
                 </div>
            ))}
           </div>
      )}

      {activeTab === "bookings" && (
           <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-900">Appointments</h3></div>
               <div className="divide-y divide-gray-100">
                  {bookings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No bookings found.</div>
                  ) : (
                    bookings.map(booking => (
                       <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                             <div>
                                <h4 className="font-bold text-gray-900">{booking.serviceId?.name || "Service"}</h4>
                                <div className="text-sm text-gray-500 mt-1">
                                  <p>{booking.userId?.name || "Customer"}</p>
                                  <p>{booking.startAt ? new Date(booking.startAt).toLocaleString() : `${booking.date} at ${booking.time}`}</p>
                                </div>
                                <div className="mt-2"><span className={`text-xs font-bold px-2 py-1 rounded ${
                                  booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                                  booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                  booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{booking.status}</span></div>
                             </div>
                             <div className="flex gap-2">
                               {booking.status === 'Pending' && (
                                 <>
                                  <button onClick={() => handleBookingAction(booking._id, "Confirmed")} className="text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors">Accept</button>
                                  <button onClick={() => handleBookingAction(booking._id, "Rejected")} className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition-colors">Reject</button>
                                 </>
                               )}
                               {["Pending", "Confirmed"].includes(booking.status) && (
                                  <button onClick={() => handleBookingAction(booking._id, "cancel")} className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded hover:bg-gray-200 transition-colors">Cancel</button>
                               )}
                             </div>
                          </div>
                       </div>
                    ))
                  )}
               </div>
           </div>
      )}

      {activeTab === "availability" && <ProviderAvailability />}

      {activeTab === "revenue" && (
         <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
            <div className="text-center py-10">
               <h2 className="text-4xl font-bold text-gray-900">${stats.revenue}</h2>
               <p className="text-gray-500">Total Revenue</p>
            </div>
         </div>
      )}

    </main>

    {/* Modals */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">{editingService ? "Edit Service" : "New Service"}</h2>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                    <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} required />
              </div>
              <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <select value={serviceForm.category} onChange={e => setServiceForm({...serviceForm, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
              </div>
                 <div className="grid grid-cols-2 gap-4">
                <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price</label>
                        <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} required />
                </div>
                <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Duration (min)</label>
                        <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} required />
                </div>
              </div>
              <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" rows="3" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} required />
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
                 <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors">Save Service</button>
                    <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    {showWalkInModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
         <div className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Add Walk-In</h3>
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name</label>
                    <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Customer Name" value={walkInForm.customerName} onChange={e => setWalkInForm({...walkInForm, customerName: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Service</label>
                    <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Service" value={walkInForm.serviceName} onChange={e => setWalkInForm({...walkInForm, serviceName: e.target.value})} required />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors">Add to Queue</button>
                    <button type="button" onClick={() => setShowWalkInModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
            </form>
         </div>
      </div>
    )}
    </div>
  );
}
