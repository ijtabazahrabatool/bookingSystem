import React, { useState, useEffect, useContext } from "react";
import { getServices, getBookings, cancelBooking } from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import { useToast } from "./Toast";
import BookingModal from "./BookingModal";
import { AuthContext } from "../context/AuthContext";

// --- SUB-COMPONENTS FOR LAYOUT ---

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 ${
      active 
        ? 'bg-primary-50 text-black shadow-sm' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <i className={`fa-solid ${icon} w-5 text-center ${active ? 'text-black' : 'text-gray-400'}`}></i>
    {label}
  </button>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-end mb-8">
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-2 font-medium">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const ProfileField = ({ label, value }) => (
  <div className="py-4 border-b border-gray-100 last:border-0 group cursor-pointer hover:bg-gray-50 -mx-6 px-6 transition-colors">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
    <div className="flex justify-between items-center">
      <span className="font-medium text-gray-900">{value || "Not set"}</span>
      <i className="fa-solid fa-pen text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function CustomerDashboard() {
  const [services, setServices] = useState([]);
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // "activeTab" controls the view: 'profile', 'bookings', 'browse', 'wallet'
  const [activeTab, setActiveTab] = useState("profile"); 
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

  // --- RENDER HELPERS ---

  const renderSidebar = () => (
    <div className="w-full lg:w-72 flex-shrink-0 bg-white lg:min-h-[calc(100vh-80px)] p-6 lg:border-r border-gray-200">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-soft">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">Customer Account</p>
        </div>
      </div>

      <nav className="space-y-1">
        <SidebarItem 
          icon="fa-user" 
          label="Personal Profile" 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
        />
        <SidebarItem 
          icon="fa-calendar" 
          label="Appointments" 
          active={activeTab === 'bookings'} 
          onClick={() => setActiveTab('bookings')} 
        />
        <SidebarItem 
          icon="fa-compass" 
          label="Explore Services" 
          active={activeTab === 'browse'} 
          onClick={() => setActiveTab('browse')} 
        />
        <div className="h-px bg-gray-100 my-4 mx-4"></div>
        <SidebarItem icon="fa-wallet" label="Wallet" />
        <SidebarItem icon="fa-heart" label="Favorites" />
        <SidebarItem icon="fa-star" label="Reviews" />
      </nav>
    </div>
  );

  const renderProfileContent = () => (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <SectionHeader title="Personal profile" subtitle="Manage your personal information and preferences" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-100">
             <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl border-4 border-white shadow-sm text-gray-400">
                   <i className="fa-solid fa-camera"></i>
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900">Profile Photo</h3>
                   <p className="text-sm text-gray-500 mb-2">Add a photo to personalize your account</p>
                   <button className="text-sm font-bold text-primary-600 hover:text-black hover:underline">Upload Photo</button>
                </div>
             </div>
             
             <div className="space-y-1">
               <ProfileField label="Full Name" value={user?.name} />
               <ProfileField label="Email Address" value={user?.email} />
               <ProfileField label="Phone Number" value="+1 (555) 000-0000" />
               <ProfileField label="Date of Birth" value="Not set" />
             </div>
          </div>
        </div>

        {/* Right Column: Addresses */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 h-full">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-gray-400"></i> My Addresses
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-gray-400">Home</span>
                  <i className="fa-solid fa-pencil text-xs text-gray-300 group-hover:text-black"></i>
                </div>
                <p className="text-sm font-medium text-gray-900">Add your home address</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-gray-400">Work</span>
                  <i className="fa-solid fa-pencil text-xs text-gray-300 group-hover:text-black"></i>
                </div>
                <p className="text-sm font-medium text-gray-900">Add your work address</p>
              </div>

              <button className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm hover:border-primary-500 hover:text-primary-600 transition-colors">
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookingsContent = () => (
    <div className="max-w-3xl animate-in fade-in duration-500">
      <SectionHeader 
        title="My Appointments" 
        subtitle="View and manage your upcoming bookings"
        action={
          <button onClick={() => setActiveTab('browse')} className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-soft">
            Book New
          </button>
        } 
      />

      <div className="space-y-4">
        {bookings.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                 <i className="fa-regular fa-calendar-xmark"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">No appointments yet</h3>
              <p className="text-gray-500 mb-6">Explore our services and book your first appointment.</p>
              <button onClick={() => setActiveTab('browse')} className="text-primary-600 font-bold hover:underline">
                 Explore Services
              </button>
           </div>
        ) : (
           bookings.map(booking => {
             const dateObj = booking.startAt ? new Date(booking.startAt) : new Date(booking.date);
             const day = dateObj.getDate();
             const month = dateObj.toLocaleString('default', { month: 'short' });
             const time = booking.startAt ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : booking.time;

             return (
              <div key={booking._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-card transition-shadow flex flex-col sm:flex-row gap-5">
                 {/* Date Box */}
                 <div className="flex-shrink-0 flex sm:flex-col items-center justify-center bg-gray-50 rounded-xl w-full sm:w-20 h-16 sm:h-auto border border-gray-100 text-center gap-2 sm:gap-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{month}</span>
                    <span className="text-2xl font-bold text-gray-900">{day}</span>
                 </div>

                 {/* Info */}
                 <div className="flex-grow pt-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-lg text-gray-900">{booking.serviceId?.name || "Service"}</h3>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                       }`}>
                          {booking.status}
                       </span>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-2 mb-4">
                       <i className="fa-regular fa-clock"></i> {time} • {booking.serviceId?.duration || 30} mins
                    </p>
                    <div className="flex gap-3 pt-2 border-t border-gray-50">
                       {booking.status !== 'Cancelled' && (
                          <button onClick={() => handleCancelBooking(booking._id)} className="text-sm font-semibold text-red-500 hover:text-red-700">Cancel</button>
                       )}
                       <button className="text-sm font-semibold text-primary-600 hover:text-black ml-auto">Reschedule</button>
                    </div>
                 </div>
              </div>
             );
           })
        )}
      </div>
    </div>
  );

  const renderBrowseContent = () => (
    <div className="animate-in fade-in duration-500">
      <SectionHeader title="Explore Services" subtitle="Discover top-rated services near you" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map(service => (
           <div key={service._id} onClick={() => setServiceToBook(service)} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center text-4xl">
                 <span className="group-hover:scale-110 transition-transform duration-500">{service.image || "✨"}</span>
                 <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                    {service.category || 'General'}
                 </div>
              </div>
              <div className="p-5">
                 <h3 className="font-bold text-gray-900 text-lg mb-1">{service.name}</h3>
                 <p className="text-sm text-gray-500 mb-4 line-clamp-2">Professional service provided by our top experts.</p>
                 <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                    <div>
                       <span className="block text-xs text-gray-400 font-bold uppercase">Price</span>
                       <span className="font-bold text-lg text-gray-900">${service.price}</span>
                    </div>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">
                       Book
                    </button>
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
       <div className="flex min-h-screen">
          <div className="w-72 bg-white border-r border-gray-200 hidden lg:block p-6 space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>)}
          </div>
          <div className="flex-1 p-8">
             <SkeletonCard />
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* SIDEBAR */}
      {renderSidebar()}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto max-h-screen">
         {activeTab === 'profile' && renderProfileContent()}
         {activeTab === 'bookings' && renderBookingsContent()}
         {activeTab === 'browse' && renderBrowseContent()}
      </main>

      {/* MODAL */}
      {serviceToBook && (
        <BookingModal
          service={serviceToBook}
          onClose={() => setServiceToBook(null)}
          onConfirm={async () => { await fetchData(); setActiveTab('bookings'); }}
        />
      )}
    </div>
  );
}
