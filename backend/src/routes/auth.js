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

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found, check if it's the admin trying to log in
    if (!user) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

      // Check if this is an admin login attempt
      if (email === adminEmail) {
        // In production, we should not automatically create admin users
        // Instead, we should return an error indicating admin user needs to be created
        if (process.env.NODE_ENV === 'production') {
          return res.status(401).json({ 
            error: 'Admin user not found. Please run the configure-admin script.',
            adminSetupRequired: true
          });
        }
        
        // In development, we can create the admin user if needed
        try {
          const hashedPassword = await hashPassword(adminPassword);
          user = await prisma.user.create({
            data: {
              name: process.env.ADMIN_NAME || 'Admin User',
              email: adminEmail,
              phone: process.env.ADMIN_PHONE || '0000000000',
              password: hashedPassword,
            },
          });
          console.log('Development admin user created:', email);
        } catch (createErr) {
          console.error('Error creating dev admin user:', createErr);
          return res.status(500).json({ error: 'Server error during admin setup' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Check password
    const isMatch = await comparePasswords(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Check if user is admin (based on email or environment variables)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@donaro.com';
    const isAdminUser = email === adminEmail || email.endsWith('@yourdomain.com');

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