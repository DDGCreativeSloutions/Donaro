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

// For Vercel compatibility, we need to export the app
// Vercel will handle the server creation
const isVercel = process.env.NOW_REGION || process.env.VERCEL;

// Middleware
// For mobile apps, we allow all origins since mobile apps don't have the same origin restrictions as web browsers
app.use(cors({
  origin: "*", // Allow all origins for mobile app compatibility
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (only in non-Vercel environments as Vercel handles this differently)
if (!isVercel) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

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

// Serve index.html for root path
app.get('/', (req, res) => {
  // In Vercel, static files should be served from the public directory
  if (isVercel) {
    // For Vercel, static files are automatically served from the public directory
    res.redirect('/index.html');
  } else {
    res.sendFile(path.join(__dirname, '../../admin/index.html'));
  }
});

// Serve admin panel index.html for root admin route
app.get('/admin', (req, res) => {
  // In Vercel, static files should be served from the public directory
  if (isVercel) {
    // For Vercel, static files are automatically served from the public directory
    // So we redirect to the static file
    res.redirect('/index.html');
  } else {
    res.sendFile(path.join(__dirname, '../../admin/index.html'));
  }
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
  
  if (isVercel) {
    // For Vercel, static files are automatically served from the public directory
    // So we redirect to the static file
    res.redirect(`/${filePath}`);
  } else {
    // Ensure the file path is within the admin directory
    const resolvedPath = path.resolve(path.join(__dirname, '../../admin'));
    const requestedPath = path.resolve(path.join(__dirname, '../../admin', filePath));
    
    if (!requestedPath.startsWith(resolvedPath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    res.sendFile(requestedPath);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Only use the 404 handler for non-Vercel environments
// In Vercel, unmatched routes should be handled by the platform
if (!isVercel) {
  // 404 handler (must be last)
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Handle Socket.IO for non-Vercel environments only
// Vercel serverless functions don't support long-running connections like Socket.IO
let io;
if (!isVercel) {
  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for mobile app compatibility
      methods: ["GET", "POST"]
    }
  });
  
  // Store io instance in app locals so routes can access it
  app.set('io', io);
  
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
  
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
  module.exports = { app, io, server };
} else {
  // For Vercel, we export the app for the serverless function
  // Note: Socket.IO is not available in serverless environments
  // But we still make the app available for routes to potentially use
  app.set('io', null);
  module.exports = app;
}
