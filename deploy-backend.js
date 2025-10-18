#!/usr/bin/env node

// Simple deployment helper script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing Donaro backend for Vercel deployment...\n');

try {
  // Check if vercel.json exists in backend directory
  if (!fs.existsSync('backend/vercel.json')) {
    console.error('Error: backend/vercel.json configuration file not found');
    console.log('Please ensure you have created the vercel.json file first');
    process.exit(1);
  }

  console.log('✓ Found vercel.json configuration');

  // Check if server.js exists
  if (!fs.existsSync('backend/src/server.js')) {
    console.error('Error: backend/src/server.js not found');
    process.exit(1);
  }

  console.log('✓ Found server.js file');

  // Check if API handler exists
  if (!fs.existsSync('backend/api/index.js')) {
    console.error('Error: backend/api/index.js not found');
    process.exit(1);
  }

  console.log('✓ Found API handler file');

  // Check if prisma schema exists
  if (!fs.existsSync('backend/prisma/schema.prisma')) {
    console.error('Error: backend/prisma/schema.prisma not found');
    process.exit(1);
  }

  console.log('✓ Found Prisma schema');

  console.log('\nDeployment preparation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Ensure you have the Vercel CLI installed: npm install -g vercel');
  console.log('2. Deploy to Vercel from backend directory: cd backend && vercel');
  console.log('3. After deployment, run production migrations: npm run migrate:prod');
  console.log('\nFor detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md in the project root.');

} catch (error) {
  console.error('Error during deployment preparation:', error.message);
  process.exit(1);
}