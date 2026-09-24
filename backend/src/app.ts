import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { json } from 'body-parser';
import { pool } from './db';
import meetingsRouter from './routes/meetings';
import leadsRouter from './routes/leads';
import analysisRouter from './routes/analysis';
import webhookRouter from './routes/webhook';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

dotenv.config({ path: './.env' });

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(json());

// Request logging (sanitized)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] || `${Date.now()}-${Math.random()}`;
  (req as any).correlationId = correlationId;
  logger.info(`Incoming ${req.method} ${req.path}`, { correlationId, body: req.body });
  next();
});

// Auth middleware for protected routes
app.use('/api', authMiddleware);

// Register routers
app.use('/api/meetings', meetingsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/webhook', webhookRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err, correlationId: err?.correlationId });
  const status = err.status || 500;
  const message = err.isPublic ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Backend server listening on port ${PORT}`);
});

export default app;
