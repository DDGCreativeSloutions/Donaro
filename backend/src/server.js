const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || 'https://yourdomain.com' : "*", // Replace with your actual domain
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || 'https://yourdomain.com' : "*", // Replace with your actual domain
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const userRoutes = require('./routes/users');
const withdrawalRoutes = require('./routes/withdrawals');
const uploadRoutes = require('./routes/uploads');
const otpRoutes = require('./routes/otp');
const settingsRoutes = require('./routes/settings');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Donations Backend is running' });
});

// Serve admin panel index.html for root admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin/index.html'));
});

// Redirect /api/admin to /admin (for any incorrect URL patterns)
app.get('/api/admin', (req, res) => {
  res.redirect('/admin');
});

// Serve admin panel files (needed for files like donation-details.html)
app.get('/admin/*', (req, res) => {
  const filePath = req.params[0];
  
  // Prevent path traversal attacks by validating the file path
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  // Ensure the file path is within the admin directory
  const resolvedPath = path.resolve(path.join(__dirname, '../../admin'));
  const requestedPath = path.resolve(path.join(__dirname, '../../admin', filePath));
  
  if (!requestedPath.startsWith(resolvedPath)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  res.sendFile(requestedPath);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('joinAdminRoom', () => {
    socket.join('admin');
    console.log(`Admin joined admin room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler (must be last)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io, server };