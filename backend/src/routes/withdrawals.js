const express = require('express');
const prisma = require('../utils/db');
const { authenticateToken, authorizeAdmin } = require('../utils/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all withdrawals for a user
router.get('/user/:userId', async (req, res) => {
  try {
    // Users can only access their own withdrawals
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new withdrawal request
router.post('/', async (req, res) => {
  try {
    const { userId, amount, date } = req.body;
    
    // Users can only create withdrawals for themselves
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.withdrawableCredits < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create withdrawal
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        date,
      },
    });

    // Update user's withdrawable credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        withdrawableCredits: { decrement: amount },
      },
    });

    // Emit real-time event for new withdrawal
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('withdrawalCreated', withdrawal);
        // Emit event to admin room for real-time admin panel updates
        io.to('admin').emit('withdrawalCreated', withdrawal);
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
      // Don't fail the request if socket emission fails
    }

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending withdrawals (for admin)
router.get('/status/pending', authorizeAdmin, async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
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

    res.json(withdrawals);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update withdrawal status (for admin)
router.put('/:id/status', authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const withdrawalId = req.params.id;

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status },
    });

    // Get the withdrawal with user info
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    // Emit real-time event for withdrawal status update (if io is available)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(withdrawal.userId).emit('withdrawalStatusUpdated', updatedWithdrawal);
        // Emit event to admin room for real-time admin panel updates
        io.to('admin').emit('withdrawalStatusUpdated', updatedWithdrawal);
      }
    } catch (socketError) {
      console.warn('Failed to emit socket event:', socketError);
    }

    res.json(updatedWithdrawal);
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;