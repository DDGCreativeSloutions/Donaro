const express = require('express');
const prisma = require('../utils/db');
const { generateToken, hashPassword, comparePasswords } = require('../utils/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCredits: user.totalCredits,
      lifetimeCredits: user.lifetimeCredits,
      withdrawableCredits: user.withdrawableCredits,
      totalDonations: user.totalDonations,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;

    // Check for predefined admin credentials
    if (email === 'admin@donaro.com' && password === 'admin123') {
      // Generate token for admin user
      const token = generateToken('admin-user-id'); // In a real app, you would use a proper admin ID

      res.json({
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@donaro.com',
        phone: '9876543210',
        totalCredits: 0,
        lifetimeCredits: 0,
        withdrawableCredits: 0,
        totalDonations: 0,
        isAdmin: true,
        token,
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await comparePasswords(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Check if user is admin (for demo purposes, we'll use a specific email)
    const isAdminUser = email === 'admin@donaro.com' || email === 'admin@donaro.com';

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCredits: user.totalCredits,
      lifetimeCredits: user.lifetimeCredits,
      withdrawableCredits: user.withdrawableCredits,
      totalDonations: user.totalDonations,
      isAdmin: isAdminUser,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;