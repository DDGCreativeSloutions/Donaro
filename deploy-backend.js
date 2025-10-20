#!/usr/bin/env node

// Simple deployment helper script for Railway
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing Donaro backend for Railway deployment...\n');

try {
  // Check if railway.toml exists in backend directory
  if (!fs.existsSync('backend/railway.toml')) {
    console.error('Error: backend/railway.toml configuration file not found');
    console.log('Please ensure you have created the railway.toml file first');
    process.exit(1);
  }

  console.log('✓ Found railway.toml configuration');

  // Check if server.js exists
  if (!fs.existsSync('backend/src/server.js')) {
    console.error('Error: backend/src/server.js not found');
    process.exit(1);
  }

  console.log('✓ Found server.js file');

  // Check if prisma schema exists
  if (!fs.existsSync('backend/prisma/schema.prisma')) {
    console.error('Error: backend/prisma/schema.prisma not found');
    process.exit(1);
  }

  console.log('✓ Found Prisma schema');

  console.log('\nDeployment preparation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Ensure you have the Railway CLI installed: npm install -g @railway/cli');
  console.log('2. Login to Railway: railway login');
  console.log('3. Deploy to Railway from backend directory: cd backend && railway up');
  console.log('4. After deployment, run production migrations: railway run npm run migrate:prod');
  console.log('\nFor detailed instructions, see RAILWAY_DEPLOYMENT.md in the project root.');

} catch (error) {
  console.error('Error during deployment preparation:', error.message);
  process.exit(1);
}