const express = require('express');
const prisma = require('../utils/db');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for OTP generation
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many OTP requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to OTP generation endpoint
router.post('/generate', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body; // Changed from phone to email
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await prisma.oTP.upsert({
      where: { email: email },
      update: { 
        code: otp,
        expiresAt: expiresAt,
        attempts: 0 // Reset attempts on new OTP
      },
      create: {
        email: email,
        code: otp,
        expiresAt: expiresAt,
        attempts: 0
      }
    });
    
    // For development, we'll log the OTP to the console
    console.log(`OTP for ${email}: ${otp}`);
    
    // Send OTP via email
    try {
      // Create a transporter object using the configured email service
      let transporter;
      
      if (process.env.EMAIL_SERVICE === 'gmail') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use App Password for Gmail
          }
        });
      } else {
        // Fallback to Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }
      
      // Send email
      let info = await transporter.sendMail({
        from: '"Donaro App" <no-reply@donaro.com>',
        to: email,
        subject: 'Donaro App - Your OTP Verification Code',
        text: `Your OTP verification code is: ${otp}. This code will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6C63FF, #4A90E2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Donaro App</h1>
            </div>
            <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">OTP Verification</h2>
              <p>Your verification code is:</p>
              <h1 style="font-size: 36px; color: #6C63FF; text-align: center; letter-spacing: 5px; margin: 30px 0;">${otp}</h1>
              <p>This code will expire in 10 minutes.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                If you didn't request this code, please ignore this email or contact support.
              </p>
            </div>
          </div>
        `
      });
      
      console.log('Message sent: %s', info.messageId);
      
      // Preview only available when sending through an Ethereal account
      if (process.env.EMAIL_SERVICE !== 'gmail') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      
      res.json({ 
        success: true, 
        message: 'OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({ 
        error: 'Failed to send OTP email. Please try again.' 
      });
    }
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
    const otpRecord = await prisma.oTP.findUnique({
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
      await prisma.oTP.delete({
        where: { email: email }
      });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    // Update attempts if verification fails
    if (otpRecord.code !== otp) {
      await prisma.oTP.update({
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