const express = require('express');
const prisma = require('../utils/db');
const { authenticateToken, authorizeAdmin } = require('../utils/authMiddleware');
const { hashPassword, comparePasswords } = require('../utils/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Change admin password (admin only)
router.put('/change-password', authorizeAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

module.exports = router;