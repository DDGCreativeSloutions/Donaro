const express = require('express');
const prisma = require('../utils/db');
const { authenticateToken, authorizeAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', authorizeAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    // Users can only access their own data (unless admin)
    const isAdmin = req.user.email.endsWith('@yourdomain.com') || req.user.email === 'admin@donaro.com' || req.user.email === (process.env.ADMIN_EMAIL || 'admin@donaro.com');
    if (req.params.id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCredits: user.totalCredits,
      lifetimeCredits: user.lifetimeCredits,
      withdrawableCredits: user.withdrawableCredits,
      totalDonations: user.totalDonations,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    // Users can only update their own data
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, email, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
      },
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCredits: user.totalCredits,
      lifetimeCredits: user.lifetimeCredits,
      withdrawableCredits: user.withdrawableCredits,
      totalDonations: user.totalDonations,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
    if (userId === req.user.id && req.user.email === adminEmail) {
      return res.status(400).json({ error: 'You cannot delete the admin account' });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user (this will also delete related donations and withdrawals due to foreign key constraints)
    await prisma.user.delete({
      where: { id: userId },
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Server error during user deletion' });
    }
  }
});

module.exports = router;