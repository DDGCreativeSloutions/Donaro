// Vercel serverless function handler
const serverless = require('serverless-http');
const app = require('../src/server.js');

// Create serverless handler
const handler = serverless(app, {
  binary: ['*/*'],
  request: function(req, event, context) {
    // Add any request preprocessing here if needed
    return req;
  }
});

// Vercel expects a handler function that receives (req, res) parameters
module.exports = async (req, res) => {
  try {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    // Use serverless-http to handle the request
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};