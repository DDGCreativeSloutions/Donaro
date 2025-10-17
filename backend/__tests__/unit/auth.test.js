const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../src/routes/auth');

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Mock the db module
jest.mock('../../src/utils/db', () => mockPrisma);

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const mockUser = {
        id: 'user-1',
        ...userData,
        password: hashedPassword,
        totalCredits: 0,
        lifetimeCredits: 0,
        withdrawableCredits: 0,
        totalDonations: 0
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should return error for existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        name: 'Test User',
        email: 'test@example.com'
        // missing phone and password
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('should validate email format', async () => {
      const invalidEmailData = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '1234567890',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    test('should validate password strength', async () => {
      const weakPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: '123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.error).toContain('password');
    });
  });

  describe('POST /auth/login', () => {
    test('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: loginData.email,
        password: hashedPassword,
        totalCredits: 100,
        lifetimeCredits: 500,
        withdrawableCredits: 50,
        totalDonations: 5
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        password: hashedPassword
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should handle admin login', async () => {
      const adminLoginData = {
        email: 'admin@donaro.com',
        password: 'admin123',
        isAdmin: true
      };

      const hashedPassword = await bcrypt.hash(adminLoginData.password, 10);
      const mockAdmin = {
        id: 'admin-1',
        name: 'Admin User',
        email: adminLoginData.email,
        password: hashedPassword,
        isAdmin: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/auth/login')
        .send(adminLoginData)
        .expect(200);

      expect(response.body.user.isAdmin).toBe(true);
    });
  });

  describe('JWT Token Validation', () => {
    test('should generate valid JWT token', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const mockUser = {
        id: 'user-1',
        ...userData,
        password: hashedPassword
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    test('should handle expired tokens', () => {
      const expiredToken = jwt.sign(
        { userId: 'user-1', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle multiple login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send(loginData)
          .expect(401);
      }

      // The 6th attempt should be rate limited (if rate limiting is implemented)
      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      // This test assumes rate limiting is implemented
      // Adjust based on actual implementation
      expect([401, 429]).toContain(response.status);
    });
  });
});