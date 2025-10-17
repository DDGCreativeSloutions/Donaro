// Vercel serverless function handler
const app = require('../src/server.js');

// Vercel expects a handler function that receives (req, res) parameters
module.exports = (req, res) => {
  // Set headers for CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass the request and response to the Express app
  return app(req, res);
};