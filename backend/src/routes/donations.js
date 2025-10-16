const express = require('express');
const prisma = require('../utils/db');
const fraudDetectionService = require('../utils/fraudDetection');

const router = express.Router();

// Get all donations for a user
router.get('/user/:userId', async (req, res) => {
  try {
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
router.get('/', async (req, res) => {
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

    // Emit real-time event for new donation (with error handling)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('donationCreated', donation);
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
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ 
        error: 'Server error: ' + error.message,
        errorType: error.name
      });
    }
  }
});

// Update donation status (for admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const donationId = req.params.id;

    // Get the donation to check current status
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // If already approved, don't allow changing status
    if (donation.status === 'approved') {
      return res.status(400).json({ error: 'Cannot change status of approved donation' });
    }

    // Update donation status
    const updatedDonation = await prisma.donation.update({
      where: { id: donationId },
      data: { status },
    });

    // If approved, update user credits
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: donation.userId },
        data: {
          totalCredits: { increment: donation.credits },
          lifetimeCredits: { increment: donation.credits },
          withdrawableCredits: { increment: donation.credits },
          totalDonations: { increment: 1 },
        },
      });
    }

    // Emit real-time event for donation status update (if io is available)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(donation.userId).emit('donationStatusUpdated', updatedDonation);
        // Emit event to admin room for real-time admin panel updates
        io.to('admin').emit('donationStatusUpdated', updatedDonation);
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
    }

    res.json(updatedDonation);
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending donations (for admin)
router.get('/status/pending', async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { status: 'pending' },
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
    console.error('Get pending donations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get approved donations (for admin)
router.get('/status/approved', async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });

    res.json(donations);
  } catch (error) {
    console.error('Get approved donations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rejected donations (for admin)
router.get('/status/rejected', async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { status: 'rejected' },
      orderBy: { createdAt: 'desc' },
    });

    res.json(donations);
  } catch (error) {
    console.error('Get rejected donations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;