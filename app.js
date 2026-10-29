import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { getStats } from './controllers/itemController.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const publicPath = path.resolve('public');

const app = express();

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Dedicated API Router
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/items', itemRoutes);
apiRouter.use('/claims', claimRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.get('/stats', getStats);
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusFind Portal API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API router for local (/api), Netlify serverless rewrites, and root fallback
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/.netlify/functions/api/api', apiRouter);
app.use(apiRouter);

// Serve public static frontend assets in standalone mode
app.use(express.static(publicPath));

// API 404 handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

// Friendly HTML page fallback for non-API requests (direct page access in local server mode)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/.netlify')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
