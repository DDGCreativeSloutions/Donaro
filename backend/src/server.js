const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Load development environment variables if in development mode
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.development' });
}

// Import Prisma client
const prisma = require('./utils/db');

// Initialize Express app
const app = express();

// For Vercel compatibility, we need to export the app
// Vercel will handle the server creation
const isVercel = process.env.NOW_REGION || process.env.VERCEL;

// For Railway compatibility
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY;

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for Railway deployment to handle X-Forwarded-For headers properly
if (isRailway) {
  app.set('trust proxy', 1);
}

// Middleware - Production-ready CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Production: Only allow specific origins
    const allowedOrigins = [
      'https://donaro-production.up.railway.app',
      'https://your-production-domain.com', // Add your actual domain
      'http://localhost:3000', // Development
      'http://127.0.0.1:3000', // Development
      'http://localhost:8081', // Expo development
    ];

    // Allow Expo development tools
    if (origin.includes('.expo.') || origin.includes('expo.dev')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }

    // Production: Reject other origins
    if (isProduction) {
      return callback(new Error('Not allowed by CORS policy'));
    }

    // Development: Allow all HTTPS origins
    if (origin.startsWith('https://')) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
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

// SSE clients storage and broadcast function (defined early for use in routes)
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

// Set SSE broadcast function for routes to use
if (donationRoutes.setSSEBroadcast) {
  donationRoutes.setSSEBroadcast(broadcastSSE);
}

// Health check endpoint for Railway
app.get('/api/health', async (req, res) => {
  try {
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    const adminExists = !!adminUser;
    
    res.status(200).json({
      status: 'OK',
      message: 'Donations Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      adminUserExists: adminExists
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Admin verification endpoint
app.get('/api/admin/verify', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (adminUser) {
      res.status(200).json({
        status: 'OK',
        message: 'Admin user exists',
        adminEmail: adminUser.email
      });
    } else {
      res.status(404).json({
        status: 'NOT_FOUND',
        message: 'Admin user not found',
        setupRequired: true
      });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Admin verification failed',
      error: error.message || 'Unknown error occurred'
    });
  }
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


// Serve admin panel index.html for root route
app.get('/', (req, res) => {
  // For Railway/Vercel, serve the public/index.html (status/admin page)
  if (isRailway || isVercel) {
    // Serve the static index.html placed in `public/`
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    // Local development: serve the admin app from the admin folder
    return res.sendFile(path.join(__dirname, '../../admin/index.html'));
  }
});

// Serve admin panel index.html for admin route
app.get('/admin', (req, res) => {
  // For Railway/Vercel, static files should be served from the public directory
  if (isRailway || isVercel) {
    // For Railway/Vercel, static files are automatically served from the public directory
    res.sendFile(path.join(__dirname, '../public/index.html'));
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

  if (isRailway || isVercel) {
    // For Railway/Vercel, serve files from the public directory
    const publicPath = path.join(__dirname, '../public', filePath);
    // Ensure the file path is within the public directory
    const resolvedPublicPath = path.resolve(path.join(__dirname, '../public'));
    const resolvedRequestedPath = path.resolve(publicPath);

    if (!resolvedRequestedPath.startsWith(resolvedPublicPath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    res.sendFile(publicPath);
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
    console.log(`🚀 Donaro Backend Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`🌐 CORS: ${isProduction ? 'Restricted' : 'Permissive'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
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

// Production error handling
if (isProduction) {
  app.use((err, req, res, next) => {
    console.error('Production Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong on our end'
    });
  });

  // Trust proxy for Railway
  app.set('trust proxy', 1);
}