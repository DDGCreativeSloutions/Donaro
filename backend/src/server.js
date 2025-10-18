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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development (including all ports)
    if (origin.includes('localhost') || origin.includes('127.0.0.1') ||
        origin.match(/^https?:\/\/localhost:\d+$/) || origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/) ||
        origin.match(/^https?:\/\/192\.168\.\d+\.\d+:\d+$/) ||
        origin === 'http://localhost:8081' || origin === 'https://localhost:8081') {
      return callback(null, true);
    }

    // Allow Expo development tools
    if (origin.includes('.expo.') || origin.includes('expo.dev')) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    if (origin.includes('.vercel.app') || origin === 'https://donaro-backend.vercel.app') {
      return callback(null, true);
    }

    // CORS configuration - add your allowed origins here
    // if (origin.includes('yourdomain.com')) {
    //   return callback(null, true);
    // }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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

// Additional CORS headers for API routes
app.use('/api/*', (req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.sendStatus(200);
  } else {
    // Set CORS headers for actual requests
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  }
});

// Set SSE broadcast function for routes to use
if (donationRoutes.setSSEBroadcast) {
  donationRoutes.setSSEBroadcast(broadcastSSE);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Donations Backend is running' });
});

// Server-Sent Events endpoint for real-time updates (Vercel compatible)
app.get('/api/events', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Send initial connection message
  res.write('data: {"type": "connected", "message": "SSE connection established"}\n\n');

  // Store the response object to send events later
  const clientId = Date.now() + Math.random();
  sseClients.set(clientId, res);

  console.log(`SSE client connected: ${clientId}`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId}`);
  });

  req.on('error', () => {
    sseClients.delete(clientId);
    console.log(`SSE client error: ${clientId}`);
  });
});

// Store SSE clients
const sseClients = new Map();

// Function to broadcast events to all SSE clients
function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  sseClients.forEach((client, clientId) => {
    try {
      client.write(message);
    } catch (error) {
      console.error(`Error sending SSE to client ${clientId}:`, error);
      sseClients.delete(clientId);
    }
  });
}

// Serve admin panel index.html for root route
app.get('/', (req, res) => {
  // In Vercel, serve the public/index.html (status/admin page)
  if (isVercel) {
    // Serve the static index.html placed in `public/`
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    // Local / non-Vercel: serve the admin app from the admin folder
    return res.sendFile(path.join(__dirname, '../../admin/index.html'));
  }
});

// Serve admin panel index.html for admin route
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
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true // Allow Engine.IO v3 compatibility
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

  const PORT = process.env.PORT || 3001;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  module.exports = { app, io, server };
} else {
  // For Vercel, we'll use Server-Sent Events as an alternative
  console.log('Vercel deployment detected - Socket.IO disabled, SSE available');

  // For Vercel, we export the app for the serverless function
  // Note: Socket.IO is not available in serverless environments
  // But we still make the app available for routes to potentially use
  app.set('io', null);
  module.exports = app;
}