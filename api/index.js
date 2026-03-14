// Vercel Serverless Function entry point
// This imports the Express app and exports it as a handler

const { initDb } = require('../backend/src/db/database');
const app = require('../backend/src/server');

let initialized = false;

module.exports = async (req, res) => {
  // Initialize DB schema once per serverless instance (cold start)
  if (!initialized) {
    try {
      await initDb();
      initialized = true;
    } catch (err) {
      console.error('DB init error:', err);
    }
  }
  return app(req, res);
};
