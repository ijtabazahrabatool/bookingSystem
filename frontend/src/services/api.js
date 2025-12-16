import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - browser will set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.request);
      error.message = "Network error. Please check if the server is running.";
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getCurrentUser = () => api.get("/auth/me");

// Services API
export const getServices = (queryString = "") => {
  if (queryString && queryString.startsWith("?")) {
    return api.get(`/services${queryString}`);
  }
  return api.get("/services");
};
export const getService = (id) => api.get(`/services/${id}`);
export const createService = (data) => {
  // If data is FormData, don't set Content-Type header (browser will set it with boundary automatically)
  const config = data instanceof FormData 
    ? {} // Let browser set Content-Type with boundary
    : {};
  return api.post("/services", data, config);
};

export const updateService = (id, data) => {
  // If data is FormData, don't set Content-Type header (browser will set it with boundary automatically)
  const config = data instanceof FormData 
    ? {} // Let browser set Content-Type with boundary
    : {};
  return api.put(`/services/${id}`, data, config);
};
export const deleteService = (id) => api.delete(`/services/${id}`);

// Bookings API
export const getBookings = () => api.get("/bookings");
export const createBooking = (data) => api.post("/bookings", data);
export const updateBookingStatus = (id, status) => api.put(`/bookings/${id}/status`, { status });
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

// Booking Hold/Confirm API (with Redis locks)
export const holdSlot = (data) => api.post("/bookings/hold", data);
export const confirmBooking = (bookingId, holdToken) => api.post("/bookings/confirm", { bookingId, holdToken });

// Slots API
export const getProviderSlots = (providerId, date, serviceId = null) => {
  const params = { providerId, date };
  if (serviceId) params.serviceId = serviceId;
  return api.get("/slots/provider-slots", { params });
};

// Provider Availability API
export const getAvailability = () => api.get("/provider/availability");
export const setAvailability = (data) => api.post("/provider/availability", data);
export const getQueue = () => api.get("/queue/today");
export const addWalkIn = (data) => api.post("/queue/walkin", data);
export const updateQueueStatus = (id, status) => api.put(`/queue/${id}/status`, { status });
