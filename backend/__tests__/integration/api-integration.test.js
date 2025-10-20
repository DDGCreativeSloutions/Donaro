const request = require('supertest');
const { app, server } = require('../../src/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Set test database URL
process.env.DATABASE_URL = 'file:./test-integration.db';

describe('API Integration Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    // Clean up test database
    await prisma.$executeRaw`DELETE FROM Withdrawal`;
    await prisma.$executeRaw`DELETE FROM Donation`;
    await prisma.$executeRaw`DELETE FROM User`;
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.$executeRaw`DELETE FROM Withdrawal`;
    await prisma.$executeRaw`DELETE FROM Donation`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$disconnect();
    server.close();
  });

  describe('Complete User Journey', () => {
    test('should register a new user', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@test.com',
        phone: '9876543210',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');

      authToken = response.body.token;
      testUser = response.body.user;
    });

    test('should login with registered user', async () => {
      const loginData = {
        email: 'integration@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      
      // Update token in case it's different
      authToken = response.body.token;
    });

    test('should create admin user', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@donaro.com',
        phone: '1234567890',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      testAdmin = response.body.user;
      
      // Login as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminData.email,
          password: adminData.password,
          isAdmin: true
        })
        .expect(200);

      adminToken = adminLogin.body.token;
    });
  });

  describe('Donation Workflow', () => {
    let createdDonationId;

    test('should create a donation', async () => {
      const donationData = {
        type: 'food',
        title: 'Integration Test Food Donation',
        description: 'Fresh vegetables for integration testing',
        quantity: '5 kg',
        receiver: 'Test Food Bank',
        date: '2024-01-15',
        time: '14:30',
        location: 'Test Location, Test City',
        donationPhoto: 'test-donation-photo.jpg',
        selfiePhoto: 'test-selfie-photo.jpg'
      };

      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData)
        .expect(201);

      expect(response.body.title).toBe(donationData.title);
      expect(response.body.status).toBe('pending');
      expect(response.body.credits).toBeGreaterThan(0);
      expect(response.body.userId).toBe(testUser.id);

      createdDonationId = response.body.id;
    });

    test('should fetch user donations', async () => {
      const response = await request(app)
        .get(`/api/donations/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(createdDonationId);
      expect(response.body[0].title).toBe('Integration Test Food Donation');
    });

    test('should fetch pending donations (admin)', async () => {
      const response = await request(app)
        .get('/api/donations/status/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const donation = response.body.find(d => d.id === createdDonationId);
      expect(donation).toBeTruthy();
      expect(donation.status).toBe('pending');
    });

    test('should approve donation (admin)', async () => {
      const response = await request(app)
        .put(`/api/donations/${createdDonationId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.status).toBe('approved');
    });

    test('should update user credits after approval', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalCredits).toBeGreaterThan(0);
      expect(response.body.lifetimeCredits).toBeGreaterThan(0);
      expect(response.body.withdrawableCredits).toBeGreaterThan(0);
      expect(response.body.totalDonations).toBe(1);
    });

    test('should fetch approved donations', async () => {
      const response = await request(app)
        .get('/api/donations/status/approved')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const approvedDonation = response.body.find(d => d.id === createdDonationId);
      expect(approvedDonation).toBeTruthy();
      expect(approvedDonation.status).toBe('approved');
    });
  });

  describe('Withdrawal Workflow', () => {
    let createdWithdrawalId;

    test('should create a withdrawal request', async () => {
      const withdrawalData = {
        amount: 50, // Assuming user has enough credits
        date: '2024-01-16'
      };

      const response = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawalData)
        .expect(201);

      expect(response.body.amount).toBe(withdrawalData.amount);
      expect(response.body.status).toBe('pending');
      expect(response.body.userId).toBe(testUser.id);

      createdWithdrawalId = response.body.id;
    });

    test('should fetch user withdrawals', async () => {
      const response = await request(app)
        .get(`/api/withdrawals/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(createdWithdrawalId);
      expect(response.body[0].amount).toBe(50);
    });

    test('should fetch pending withdrawals (admin)', async () => {
      const response = await request(app)
        .get('/api/withdrawals/status/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const withdrawal = response.body.find(w => w.id === createdWithdrawalId);
      expect(withdrawal).toBeTruthy();
      expect(withdrawal.status).toBe('pending');
    });

    test('should process withdrawal (admin)', async () => {
      const response = await request(app)
        .put(`/api/withdrawals/${createdWithdrawalId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processed' })
        .expect(200);

      expect(response.body.status).toBe('processed');
    });

    test('should update user credits after withdrawal processing', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Withdrawable credits should be reduced
      expect(response.body.withdrawableCredits).toBeLessThan(100);
    });
  });

  describe('Multiple Donations Workflow', () => {
    test('should create multiple donations of different types', async () => {
      const donationTypes = [
        {
          type: 'clothes',
          title: 'Winter Clothes Donation',
          description: 'Warm clothes for winter',
          quantity: '20 items'
        },
        {
          type: 'books',
          title: 'Educational Books Donation',
          description: 'School textbooks and novels',
          quantity: '50 books'
        },
        {
          type: 'blood',
          title: 'Blood Donation',
          description: 'O+ blood donation',
          quantity: '1 unit'
        }
      ];

      for (const donationData of donationTypes) {
        const fullDonationData = {
          ...donationData,
          receiver: 'Test Receiver',
          date: '2024-01-17',
          time: '10:00',
          location: 'Test Location',
          donationPhoto: 'test-photo.jpg',
          selfiePhoto: 'test-selfie.jpg'
        };

        const response = await request(app)
          .post('/api/donations')
          .set('Authorization', `Bearer ${authToken}`)
          .send(fullDonationData)
          .expect(201);

        expect(response.body.type).toBe(donationData.type);
        expect(response.body.title).toBe(donationData.title);
        expect(response.body.status).toBe('pending');
      }
    });

    test('should fetch all user donations', async () => {
      const response = await request(app)
        .get(`/api/donations/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should have 4 donations total (1 from previous test + 3 new ones)
      expect(response.body).toHaveLength(4);
      
      const donationTypes = response.body.map(d => d.type);
      expect(donationTypes).toContain('food');
      expect(donationTypes).toContain('clothes');
      expect(donationTypes).toContain('books');
      expect(donationTypes).toContain('blood');
    });

    test('should approve all pending donations', async () => {
      // Get all pending donations
      const pendingResponse = await request(app)
        .get('/api/donations/status/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Approve each pending donation
      for (const donation of pendingResponse.body) {
        await request(app)
          .put(`/api/donations/${donation.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'approved' })
          .expect(200);
      }

      // Verify no pending donations remain
      const finalPendingResponse = await request(app)
        .get('/api/donations/status/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(finalPendingResponse.body).toHaveLength(0);
    });

    test('should have updated user stats', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalDonations).toBe(4);
      expect(response.body.totalCredits).toBeGreaterThan(200); // Multiple donations should accumulate credits
      expect(response.body.lifetimeCredits).toBeGreaterThan(200);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle duplicate email registration', async () => {
      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'integration@test.com', // Same email as first user
        phone: '9999999999',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    test('should handle invalid donation data', async () => {
      const invalidDonationData = {
        type: 'invalid-type',
        title: '', // Empty title
        description: 'Test description'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDonationData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should handle insufficient credits for withdrawal', async () => {
      const largeWithdrawalData = {
        amount: 10000, // More than user has
        date: '2024-01-18'
      };

      const response = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeWithdrawalData)
        .expect(400);

      expect(response.body.error).toContain('insufficient');
    });

    test('should handle unauthorized access', async () => {
      // Try to access admin endpoint without admin token
      const response = await request(app)
        .put(`/api/donations/some-id/status`)
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .send({ status: 'approved' })
        .expect(403);

      expect(response.body.error).toContain('admin');
    });

    test('should handle invalid JWT token', async () => {
      const response = await request(app)
        .get(`/api/donations/user/${testUser.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('token');
    });
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('running');
    });
  });
});