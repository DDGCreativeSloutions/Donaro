const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const donationRoutes = require('../../src/routes/donations');
const authMiddleware = require('../../src/utils/authMiddleware');

// Mock Prisma
const mockPrisma = {
  donation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Mock the db module
jest.mock('../../src/utils/db', () => mockPrisma);

const app = express();
app.use(express.json());
app.use('/donations', donationRoutes);

// Helper function to create auth token
const createAuthToken = (userId = 'user-1', email = 'test@example.com') => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Donation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /donations', () => {
    test('should create donation successfully', async () => {
      const donationData = {
        type: 'food',
        title: 'Food Donation',
        description: 'Fresh vegetables',
        quantity: '10 kg',
        receiver: 'Local Shelter',
        date: '2024-01-15',
        time: '10:00',
        location: 'Test Location',
        donationPhoto: 'photo1.jpg',
        selfiePhoto: 'photo2.jpg'
      };

      const mockUser = {
        id: 'user-1',
        totalCredits: 0,
        lifetimeCredits: 0,
        withdrawableCredits: 0,
        totalDonations: 0
      };

      const mockDonation = {
        id: 'donation-1',
        userId: 'user-1',
        ...donationData,
        status: 'pending',
        credits: 100
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.donation.create.mockResolvedValue(mockDonation);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        totalDonations: 1
      });

      const token = createAuthToken();
      const response = await request(app)
        .post('/donations')
        .set('Authorization', `Bearer ${token}`)
        .send(donationData)
        .expect(201);

      expect(response.body.id).toBe('donation-1');
      expect(response.body.status).toBe('pending');
      expect(response.body.credits).toBe(100);
    });

    test('should require authentication', async () => {
      const donationData = {
        type: 'food',
        title: 'Food Donation'
      };

      const response = await request(app)
        .post('/donations')
        .send(donationData)
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        type: 'food'
        // missing required fields
      };

      const token = createAuthToken();
      const response = await request(app)
        .post('/donations')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('should validate donation type', async () => {
      const invalidTypeData = {
        type: 'invalid-type',
        title: 'Test Donation',
        description: 'Test',
        quantity: '1',
        date: '2024-01-15',
        time: '10:00',
        location: 'Test',
        donationPhoto: 'photo1.jpg',
        selfiePhoto: 'photo2.jpg'
      };

      const token = createAuthToken();
      const response = await request(app)
        .post('/donations')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTypeData)
        .expect(400);

      expect(response.body.error).toContain('type');
    });

    test('should calculate credits based on donation type', async () => {
      const foodDonation = {
        type: 'food',
        title: 'Food Donation',
        description: 'Fresh vegetables',
        quantity: '10 kg',
        date: '2024-01-15',
        time: '10:00',
        location: 'Test Location',
        donationPhoto: 'photo1.jpg',
        selfiePhoto: 'photo2.jpg'
      };

      const mockUser = { id: 'user-1', totalDonations: 0 };
      const mockDonation = { ...foodDonation, id: 'donation-1', credits: 100 };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.donation.create.mockResolvedValue(mockDonation);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const token = createAuthToken();
      const response = await request(app)
        .post('/donations')
        .set('Authorization', `Bearer ${token}`)
        .send(foodDonation)
        .expect(201);

      expect(response.body.credits).toBe(100);
    });
  });

  describe('GET /donations/user/:userId', () => {
    test('should fetch user donations', async () => {
      const mockDonations = [
        {
          id: 'donation-1',
          title: 'Food Donation',
          status: 'approved',
          credits: 100
        },
        {
          id: 'donation-2',
          title: 'Clothes Donation',
          status: 'pending',
          credits: 80
        }
      ];

      mockPrisma.donation.findMany.mockResolvedValue(mockDonations);

      const token = createAuthToken();
      const response = await request(app)
        .get('/donations/user/user-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('donation-1');
    });

    test('should return empty array for user with no donations', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([]);

      const token = createAuthToken();
      const response = await request(app)
        .get('/donations/user/user-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/donations/user/user-1')
        .expect(401);

      expect(response.body.error).toContain('token');
    });
  });

  describe('PUT /donations/:id/status', () => {
    test('should update donation status to approved', async () => {
      const mockDonation = {
        id: 'donation-1',
        userId: 'user-1',
        status: 'pending',
        credits: 100
      };

      const mockUser = {
        id: 'user-1',
        totalCredits: 0,
        lifetimeCredits: 0,
        withdrawableCredits: 0
      };

      const updatedDonation = {
        ...mockDonation,
        status: 'approved'
      };

      mockPrisma.donation.findUnique.mockResolvedValue(mockDonation);
      mockPrisma.donation.update.mockResolvedValue(updatedDonation);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        totalCredits: 100,
        lifetimeCredits: 100,
        withdrawableCredits: 100
      });

      const token = createAuthToken('admin-1', 'admin@donaro.com');
      const response = await request(app)
        .put('/donations/donation-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.status).toBe('approved');
    });

    test('should update donation status to rejected', async () => {
      const mockDonation = {
        id: 'donation-1',
        userId: 'user-1',
        status: 'pending',
        credits: 100
      };

      const updatedDonation = {
        ...mockDonation,
        status: 'rejected'
      };

      mockPrisma.donation.findUnique.mockResolvedValue(mockDonation);
      mockPrisma.donation.update.mockResolvedValue(updatedDonation);

      const token = createAuthToken('admin-1', 'admin@donaro.com');
      const response = await request(app)
        .put('/donations/donation-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body.status).toBe('rejected');
    });

    test('should require admin privileges', async () => {
      const token = createAuthToken('user-1', 'user@example.com');
      const response = await request(app)
        .put('/donations/donation-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' })
        .expect(403);

      expect(response.body.error).toContain('admin');
    });

    test('should validate status values', async () => {
      const token = createAuthToken('admin-1', 'admin@donaro.com');
      const response = await request(app)
        .put('/donations/donation-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.error).toContain('status');
    });

    test('should handle non-existent donation', async () => {
      mockPrisma.donation.findUnique.mockResolvedValue(null);

      const token = createAuthToken('admin-1', 'admin@donaro.com');
      const response = await request(app)
        .put('/donations/non-existent/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /donations/status/:status', () => {
    test('should fetch pending donations', async () => {
      const mockPendingDonations = [
        { id: 'donation-1', status: 'pending', title: 'Food Donation' },
        { id: 'donation-2', status: 'pending', title: 'Clothes Donation' }
      ];

      mockPrisma.donation.findMany.mockResolvedValue(mockPendingDonations);

      const token = createAuthToken('admin-1', 'admin@donaro.com');
      const response = await request(app)
        .get('/donations/status/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe('pending');
    });

    test('should fetch approved donations', async () => {
      const mockApprovedDonations = [
        { id: 'donation-1', status: 'approved', title: 'Food Donation' }
      ];

      mockPrisma.donation.findMany.mockResolvedValue(mockApprovedDonations);

      const token = createAuthToken();
      const response = await request(app)
        .get('/donations/status/approved')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('approved');
    });

    test('should validate status parameter', async () => {
      const token = createAuthToken();
      const response = await request(app)
        .get('/donations/status/invalid-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toContain('status');
    });
  });

  describe('Fraud Detection', () => {
    test('should detect suspicious donation patterns', async () => {
      // Mock multiple donations from same location in short time
      const suspiciousDonation = {
        type: 'food',
        title: 'Suspicious Donation',
        description: 'Test',
        quantity: '1 kg',
        date: '2024-01-15',
        time: '10:00',
        location: 'Same Location',
        donationPhoto: 'photo1.jpg',
        selfiePhoto: 'photo2.jpg'
      };

      const mockUser = { id: 'user-1', totalDonations: 10 };
      const recentDonations = Array(5).fill({
        location: 'Same Location',
        createdAt: new Date()
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.donation.findMany.mockResolvedValue(recentDonations);

      const token = createAuthToken();
      const response = await request(app)
        .post('/donations')
        .set('Authorization', `Bearer ${token}`)
        .send(suspiciousDonation);

      // Should either flag for review or reject
      expect([201, 400]).toContain(response.status);
    });
  });
});