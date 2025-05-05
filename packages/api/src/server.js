import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoRoutes from './routes/mongo.js';
import redisRoutes from './routes/redis.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/mongo', mongoRoutes);
app.use('/api/redis', redisRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`MongoDB status available at http://localhost:${PORT}/api/mongo/status`);
  console.log(`Redis status available at http://localhost:${PORT}/api/redis/status`);
});