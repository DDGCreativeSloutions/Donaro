#!/usr/bin/env node

// Simple deployment helper script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing Donaro backend for Vercel deployment...\n');

try {
  // Check if we're in the backend directory
  if (!fs.existsSync('package.json')) {
    console.error('Error: Please run this script from the backend directory');
    process.exit(1);
  }

  // Check if vercel.json exists
  if (!fs.existsSync('vercel.json')) {
    console.error('Error: vercel.json configuration file not found');
    console.log('Please ensure you have created the vercel.json file first');
    process.exit(1);
  }

  console.log('✓ Found vercel.json configuration');
  
  // Check if server.js exists
  if (!fs.existsSync('src/server.js')) {
    console.error('Error: src/server.js not found');
    process.exit(1);
  }

  console.log('✓ Found server.js file');
  
  // Check if API handler exists
  if (!fs.existsSync('api/index.js')) {
    console.error('Error: api/index.js not found');
    process.exit(1);
  }

  console.log('✓ Found API handler file');
  
  // Check if prisma schema exists
  if (!fs.existsSync('prisma/schema.prisma')) {
    console.error('Error: prisma/schema.prisma not found');
    process.exit(1);
  }

  console.log('✓ Found Prisma schema');
  
  console.log('\nDeployment preparation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Ensure you have the Vercel CLI installed: npm install -g vercel');
  console.log('2. Deploy to Vercel: vercel');
  console.log('3. After deployment, run production migrations: npm run migrate:prod');
  console.log('\nFor detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md in the project root.');

} catch (error) {
  console.error('Error during deployment preparation:', error.message);
  process.exit(1);
}