const express = require('express');
const prisma = require('../utils/db');
const fraudDetectionService = require('../utils/fraudDetection');
const { authenticateToken, authorizeAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// SSE broadcast function (will be set by server.js)
let broadcastSSE = null;

// Function to set the SSE broadcast function
function setSSEBroadcast(broadcastFunction) {
  broadcastSSE = broadcastFunction;
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all donations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    // Ensure users can only access their own donations
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const donations = await prisma.donation.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(donations);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all donations (for admin)
router.get('/', authorizeAdmin, async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(donations);
  } catch (error) {
    console.error('Get all donations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get donation by ID
router.get('/:id', async (req, res) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Ensure users can only access their own donations (unless admin)
    const isAdmin = req.user.email.endsWith('@yourdomain.com') || req.user.email === 'admin@donaro.com';
    if (donation.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new donation
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      description,
      quantity,
      receiver,
      date,
      time,
      location,
      donationPhoto,
      selfiePhoto,
    } = req.body;

    console.log('Received donation data:', req.body);

    // Ensure users can only create donations for themselves
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate required fields
    if (!userId || !type || !title || !description || !quantity || !date || !time || !location || !donationPhoto || !selfiePhoto) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: {
          userId: !userId,
          type: !type,
          title: !title,
          description: !description,
          quantity: !quantity,
          date: !date,
          time: !time,
          location: !location,
          donationPhoto: !donationPhoto,
          selfiePhoto: !selfiePhoto,
        }
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(400).json({ error: 'Invalid user ID: User not found' });
    }

    // Calculate credits based on donation type
    let credits = 0;
    switch (type) {
      case 'food':
        credits = 100;
        break;
      case 'blood':
        credits = 300;
        break;
      case 'clothes':
        credits = 150;
        break;
      case 'books':
        credits = 75;
        break;
      default:
        credits = 50;
    }

    console.log('Calculated credits:', credits);

    // Check for potential fraud
    const isFraudulent = await fraudDetectionService.detectFraud({
      userId,
      type,
      title,
      description,
      quantity,
      receiver,
      date,
      time,
      location,
      donationPhoto,
      selfiePhoto,
    });

    if (isFraudulent) {
      // Log the potential fraud
      console.log(`Potential fraud detected for user ${userId}`);
      // You might want to notify admins or take other actions here
    }

    console.log('Creating donation in database');
    const donation = await prisma.donation.create({
      data: {
        userId,
        type,
        title,
        description,
        quantity,
        receiver: receiver || null, // Ensure receiver can be null
        credits,
        date,
        time,
        location,
        donationPhoto,
        selfiePhoto,
      },
    });
    console.log('Donation created successfully:', donation);

    // Emit real-time events for new donation (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('donationCreated', donation);
      }

      // Also broadcast via SSE for Vercel compatibility
      if (broadcastSSE) {
        broadcastSSE({
          type: 'donationCreated',
          data: donation,
          userId: userId
        });
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }

    res.status(201).json(donation);
  } catch (error) {
    console.error('Create donation error:', error);
    // Provide more specific error message
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Donation already exists' });
    } else if (error.code === 'P2003') {
      res.status(400).json({ error: 'Invalid user ID: Foreign key constraint failed' });
    } else if (error.name === 'PayloadTooLargeError') {
      res.status(413).json({ error: 'Request entity too large. Please reduce image size and try again.' });
    } else {
      res.status(500).json({ error: 'Server error during donation creation' });
    }
  }
});

// Update donation status (admin only)
router.put('/:id/status', authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update donation status
    const updatedDonation = await prisma.donation.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            totalCredits: true,
            lifetimeCredits: true,
          },
        },
      },
    });

    // If approved, update user credits
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: updatedDonation.userId },
        data: {
          totalCredits: {
            increment: updatedDonation.credits,
          },
          lifetimeCredits: {
            increment: updatedDonation.credits,
          },
          withdrawableCredits: {
            increment: updatedDonation.credits,
          },
          totalDonations: {
            increment: 1,
          },
        },
      });
      
      // Update the user object with new values for the response
      updatedDonation.user.totalCredits += updatedDonation.credits;
      updatedDonation.user.lifetimeCredits += updatedDonation.credits;
      updatedDonation.user.withdrawableCredits += updatedDonation.credits;
      updatedDonation.user.totalDonations += 1;
    }

    // Emit real-time events for status update
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(updatedDonation.userId).emit('donationStatusUpdated', updatedDonation);
        io.to('admin').emit('donationStatusUpdated', updatedDonation);
      }

      // Also broadcast via SSE for Vercel compatibility
      if (broadcastSSE) {
        broadcastSSE({
          type: 'donationStatusUpdated',
          data: updatedDonation,
          userId: updatedDonation.userId
        });
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }

    res.json(updatedDonation);
  } catch (error) {
    console.error('Update donation status error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Donation not found' });
    } else {
      res.status(500).json({ error: 'Server error during status update' });
    }
  }
});

// Get donations by status (admin only)
router.get('/status/:status', authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.params;

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const donations = await prisma.donation.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(donations);
  } catch (error) {
    console.error('Get donations by status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;