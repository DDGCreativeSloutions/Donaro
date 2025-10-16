const express = require('express');
const prisma = require('../utils/db');

const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    // Handle special case for admin user
    if (req.params.id === 'admin-user-id') {
      return res.json({
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@donaro.com',
        phone: '9876543210',
        totalCredits: 0,
        lifetimeCredits: 0,
        withdrawableCredits: 0,
        totalDonations: 0,
      });
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

module.exports = router;