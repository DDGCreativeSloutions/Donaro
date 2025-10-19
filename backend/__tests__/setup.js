const { PrismaClient } = require('@prisma/client');

// Create test database instance
const prisma = new PrismaClient();

// Setup and teardown for tests
beforeAll(async () => {
  // Clean up test database
  await prisma.$executeRaw`DELETE FROM Withdrawal`;
  await prisma.$executeRaw`DELETE FROM Donation`;
  await prisma.$executeRaw`DELETE FROM OTP`;
  await prisma.$executeRaw`DELETE FROM User`;
});

afterAll(async () => {
  // Clean up after tests
  await prisma.$executeRaw`DELETE FROM Withdrawal`;
  await prisma.$executeRaw`DELETE FROM Donation`;
  await prisma.$executeRaw`DELETE FROM OTP`;
  await prisma.$executeRaw`DELETE FROM User`;
  await prisma.$disconnect();
});

// Make prisma available globally in tests
global.testPrisma = prisma;

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Global test timeout
jest.setTimeout(30000);