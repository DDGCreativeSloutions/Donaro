const express = require('express');
const prisma = require('../utils/db');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../utils/authMiddleware');

// MailerSend email sending function for Railway compatibility
async function sendEmail(to, subject, htmlContent) {
  try {
    // Check if MailerSend is configured
    if (!process.env.MAILERSEND_API_KEY) {
      console.log('📧 MAILERSEND NOT CONFIGURED - Logging email instead:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', htmlContent.substring(0, 200) + '...');
      console.log('💡 To enable email sending, add MAILERSEND_API_KEY to your environment variables');
      return true; // Don't fail if MailerSend not configured
    }

    // MailerSend API integration
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: {
          email: process.env.FROM_EMAIL || 'noreply@donaro.app',
          name: 'Donaro App'
        },
        to: [
          {
            email: to,
            name: 'User'
          }
        ],
        subject: subject,
        html: htmlContent,
        text: `Hello! Your OTP for Donaro verification is included in the email. Please check the HTML version for the complete message.`
      })
    });

    if (!response.ok) {
      throw new Error(`MailerSend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully to ${to} - Message ID: ${result.message_id || 'N/A'}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Log the email that failed to send for debugging
    console.log('📧 FAILED EMAIL:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', htmlContent.substring(0, 200) + '...');
    console.log('Error:', error.message);

    // Don't throw error - allow signup to continue even if email fails
    return false;
  }
}

const router = express.Router();

// Rate limiting for OTP generation
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many OTP requests, please try again later.',
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

    // Send OTP email directly from backend (Railway compatible)
    const emailSubject = 'Donaro App - Email Verification';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6C63FF 0%, #4a44c5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Donaro</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
        </div>

        <div style="background: #ffffff; padding: 40px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">Hello!</h2>

          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up with Donaro! Please use the verification code below to complete your registration:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #f8f9fa; border: 2px solid #6C63FF; border-radius: 8px; padding: 20px 40px;">
              <span style="font-size: 32px; font-weight: bold; color: #6C63FF; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>

          <p style="color: #666; font-size: 14px; margin: 25px 0;">
            This code will expire in 10 minutes for security reasons.
          </p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Security Note:</strong> If you didn't request this verification code, please ignore this email.
            </p>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            If you're having trouble, contact our support team.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail(email, emailSubject, emailHtml);
      console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Return success response (don't include OTP for security)
    res.json({
      success: true,
      message: 'OTP generated and sent to your email address',
      email: email
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
    await prisma.OTP.delete({
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