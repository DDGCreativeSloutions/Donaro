#!/usr/bin/env node

// Railway deployment helper script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚂 Preparing Donaro backend for Railway deployment...\n');

try {
  // Check if we're in the project root (has backend folder)
  if (!fs.existsSync('backend/package.json')) {
    console.error('❌ Error: Please run this script from the project root directory');
    process.exit(1);
  }

  // Check if railway.toml exists
  if (!fs.existsSync('backend/railway.toml')) {
    console.error('❌ Error: backend/railway.toml configuration file not found');
    console.log('✅ Creating backend/railway.toml...');
    fs.writeFileSync('backend/railway.toml', `[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"

[environments]
production = { variables = { NODE_ENV = "production" } }
`);
  }

  console.log('✅ Found/created backend/railway.toml configuration');

  // Check if nixpacks.toml exists
  if (!fs.existsSync('backend/nixpacks.toml')) {
    console.log('✅ Creating backend/nixpacks.toml...');
    fs.writeFileSync('backend/nixpacks.toml', `[phases.setup]
nixPkgs = ["nodejs-18_x", "openssl", "pkg-config", "python3"]

[phases.install]
cmds = ["npm ci --only=production"]

[start]
cmd = "npm start"
`);
  }

  console.log('✅ Found/created backend/nixpacks.toml configuration');

  // Check if server.js exists
  if (!fs.existsSync('backend/src/server.js')) {
    console.error('❌ Error: backend/src/server.js not found');
    process.exit(1);
  }

  console.log('✅ Found backend/src/server.js file');

  // Check if API handler exists
  if (!fs.existsSync('backend/api/index.js')) {
    console.error('❌ Error: backend/api/index.js not found');
    process.exit(1);
  }

  console.log('✅ Found backend/api/index.js file');

  // Check if prisma schema exists
  if (!fs.existsSync('backend/prisma/schema.prisma')) {
    console.error('❌ Error: backend/prisma/schema.prisma not found');
    process.exit(1);
  }

  console.log('✅ Found Prisma schema');

  console.log('\n🎉 Railway deployment preparation completed successfully!');
  console.log('\n📋 Next steps for Railway deployment:');
  console.log('1. Install Railway CLI: npm install -g @railway/cli');
  console.log('2. Login to Railway: railway login');
  console.log('3. Initialize project: railway init (in backend directory)');
  console.log('4. Deploy: railway up');
  console.log('5. Run production migrations: railway run npm run migrate:prod');
  console.log('\n🔗 Railway Dashboard: https://railway.app');

} catch (error) {
  console.error('❌ Error during deployment preparation:', error.message);
  process.exit(1);
}