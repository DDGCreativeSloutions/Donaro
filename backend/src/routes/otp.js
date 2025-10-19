const express = require('express');
const prisma = require('../utils/db');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Rate limiting for OTP generation
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many OTP requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Generation - Only generates and returns OTP for EmailJS
router.post('/generate', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.OTP.upsert({
      where: { email: email },
      update: {
        code: otp,
        expiresAt: expiresAt,
        attempts: 0
      },
      create: {
        email: email,
        code: otp,
        expiresAt: expiresAt,
        attempts: 0
      }
    });

    console.log(`OTP for ${email}: ${otp}`);

    // Return OTP in response for EmailJS (no email sending from backend)
    res.json({
      success: true,
      message: 'OTP generated successfully',
      otp: otp, // Include OTP for EmailJS
      email: email,
      note: 'EmailJS will send this OTP via email from frontend'
    });

  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ error: 'Server error during OTP generation' });
  }
});

// Verify OTP with enhanced security
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body; // Changed from phone to email
    
    // Validate inputs
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }
    
    // Find OTP record for this email
    const otpRecord = await prisma.OTP.findUnique({
      where: { email: email }
    });
    
    // Check if OTP exists
    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP not found. Please request a new OTP.' });
    }
    
    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }
    
    // Increment attempts
    const updatedAttempts = otpRecord.attempts + 1;
    
    // Check if too many failed attempts
    if (updatedAttempts > 3) {
      // Delete OTP after too many failed attempts
      await prisma.OTP.delete({
        where: { email: email }
      });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    // Update attempts if verification fails
    if (otpRecord.code !== otp) {
      await prisma.OTP.update({
        where: { email: email },
        data: { attempts: updatedAttempts }
      });
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    
    // Delete used OTP
    await prisma.oTP.delete({
      where: { email: email }
    });
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

module.exports = router;