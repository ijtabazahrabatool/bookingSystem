// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { connectToMongoDB } = require("./connect");
const cors = require("cors");

const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/authRoutes");
const providerAvailabilityRoutes = require('./routes/providerAvailabilityRoutes');
const slotRoutes = require('./routes/slotRoutes');

const cleanupExpiredHolds = require("./jobs/cleanupHolds");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
// TODO: Install helmet package (`npm install helmet`) and uncomment the lines below for security
// const helmet = require('helmet');
// app.use(helmet());

// More secure CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  // Add other origins like your production frontend URL
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};
app.use(cors(corsOptions));

// Serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
connectToMongoDB(process.env.MONGODB_URI || "mongodb://localhost:27017/salonbooking")
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    console.error("Make sure MongoDB is running and MONGODB_URI is correct");
  });

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use('/api/provider/availability', providerAvailabilityRoutes);
app.use('/api/slots', slotRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found", path: req.path });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// create http server + socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: corsOptions
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("joinProviderRoom", (providerId) => {
    socket.join(`provider:${providerId}`);
    console.log("socket joined provider room:", providerId);
  });

  socket.on("joinUserRoom", (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on("disconnect", () => {
    // console.log("socket disconnect", socket.id);
  });
});

// Set io instance for controllers (avoid circular dependency)
const bookingConfirmController = require("./controllers/bookingConfirmController");
bookingConfirmController.setIO(io);

// Start HTTP server with error handling
server.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!\n`);
    console.log('To fix this, run one of these commands:');
    console.log(`  lsof -ti:${PORT} | xargs kill -9`);
    console.log(`  OR`);
    console.log(`  killall -9 node`);
    console.log('\nThen try starting the server again.\n');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// schedule cleanup job every minute
const cleanupIntervalMs = parseInt(process.env.CLEANUP_INTERVAL_MS || `${60 * 1000}`, 10);
setInterval(() => {
  cleanupExpiredHolds().catch(err => console.error("Cleanup job error", err));
}, cleanupIntervalMs);
