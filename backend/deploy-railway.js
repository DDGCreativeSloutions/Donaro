#!/usr/bin/env node

/**
 * Railway Deployment Script for Donaro Backend
 * This script handles the deployment process for Railway
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚂 Starting Railway deployment for Donaro Backend...\n');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('📋 Production deployment checklist:');

  // Check for required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];

  // Validate EmailJS configuration
  if (process.env.EMAILJS_SERVICE_ID === 'service_0zt6x89') {
    console.log('✅ EmailJS service configured');
  }

  // Check if using Prisma Accelerate
  const isPrismaAccelerate = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('accelerate.prisma-data.net');

  if (isPrismaAccelerate) {
    console.log('✅ Using Prisma Accelerate for enhanced database performance');
  } else {
    console.log('✅ Using direct PostgreSQL connection');
    requiredEnvVars.push('DIRECT_URL');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your Railway dashboard.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  console.log('✅ Production mode confirmed');
}

// Generate Prisma client with production schema
console.log('\n🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate --schema=./prisma/schema.prod.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname)
  });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Run database migrations
if (isProduction) {
  console.log('\n🗄️ Running database migrations...');

  try {
    if (isPrismaAccelerate) {
      console.log('🚀 Using Prisma Accelerate - migrations handled by Prisma service');
      // For Prisma Accelerate, we still need to generate the client
      execSync('npx prisma generate --schema=./prisma/schema.prod.prisma', {
        stdio: 'inherit',
        cwd: path.join(__dirname)
      });
      console.log('✅ Prisma client generated for Accelerate');
    } else {
      // For direct PostgreSQL, run migrations
      execSync('npx prisma migrate deploy --schema=./prisma/schema.prod.prisma', {
        stdio: 'inherit',
        cwd: path.join(__dirname)
      });
      console.log('✅ Database migrations completed');
    }
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    process.exit(1);
  }
}

console.log('\n🎉 Railway deployment preparation completed!');
console.log('📝 Next steps:');
console.log('   1. Push your code to trigger automatic deployment');
console.log('   2. Monitor deployment logs in Railway dashboard');
console.log('   3. Check health endpoint: /api/health');
console.log('   4. Update environment variables in Railway dashboard if needed');

if (isProduction) {
  console.log('\n🔒 Production reminders:');
  console.log('   - Update JWT_SECRET with a secure random string');
  console.log('   - Configure CORS origins for your domain');
  console.log('   - Set up monitoring and logging');
  console.log('   - Configure email service credentials');
}