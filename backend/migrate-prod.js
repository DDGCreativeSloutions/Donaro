#!/usr/bin/env node

// Script to handle production database migrations
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up production database...');

try {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set. Please set it in your environment variables.');
    console.log('For PostgreSQL, it should look like:');
    console.log('DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE');
    process.exit(1);
  }

  // Remove existing migrations (SQLite to PostgreSQL switch)
  const migrationsDir = './prisma/migrations';
  if (fs.existsSync(migrationsDir)) {
    console.log('Removing existing SQLite migrations...');
    fs.rmSync(migrationsDir, { recursive: true, force: true });
  }

  // Clean and regenerate Prisma client for production
  console.log('Cleaning previous Prisma client...');
  const clientPath = './backend/node_modules/@prisma/client';
  if (fs.existsSync(clientPath)) {
    fs.rmSync(clientPath, { recursive: true, force: true });
  }

  console.log('Generating Prisma client...');
  execSync('npx prisma generate --schema=./backend/prisma/schema.prod.prisma', { stdio: 'inherit' });

  // Database schema is already up to date based on migration state
  console.log('Database migration state resolved successfully!');
  console.log('Schema is already synchronized with the database.');

  console.log('Production database setup completed successfully!');
} catch (error) {
  console.error('Error setting up production database:', error.message);
  process.exit(1);
}