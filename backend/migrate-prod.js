#!/usr/bin/env node

// Script to handle production database migrations
const { execSync } = require('child_process');

console.log('Setting up production database...');

try {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set. Please set it in your environment variables.');
    console.log('For PostgreSQL, it should look like:');
    console.log('DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
    process.exit(1);
  }

  // Generate Prisma client for production
  console.log('Generating Prisma client...');
  execSync('npx prisma generate --schema=./prisma/schema.prod.prisma', { stdio: 'inherit' });

  // Run migrations
  console.log('Running database migrations...');
  execSync('npx prisma migrate deploy --schema=./prisma/schema.prod.prisma', { stdio: 'inherit' });

  console.log('Production database setup completed successfully!');
} catch (error) {
  console.error('Error setting up production database:', error.message);
  process.exit(1);
}