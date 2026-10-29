import serverless from 'serverless-http';
import app from '../../app.js';
import { connectDB } from '../../config/db.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Allow AWS Lambda / Netlify to freeze the process without waiting for MongoDB connection pool timers
  context.callbackWaitsForEmptyEventLoop = false;

  // Fast health check bypass to verify serverless function status
  if (event.path && (event.path.endsWith('/health') || event.path.endsWith('/health/'))) {
    return await serverlessHandler(event, context);
  }

  try {
    // Establish or reuse cached Mongoose connection
    await connectDB();
  } catch (err) {
    console.error('[Netlify Function] Database connection error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Database connection failed. Please ensure MONGODB_URI is configured correctly in Netlify Environment Variables.'
      })
    };
  }

  return await serverlessHandler(event, context);
};
