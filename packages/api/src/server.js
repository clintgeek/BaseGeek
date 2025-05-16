import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import mongoRoutes from './routes/mongo.js';
import redisRoutes from './routes/redis.js';
import postgresRoutes from './routes/postgres.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import noteGeekRoutes from './routes/noteGeek.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for rate limiting behind nginx
app.set('trust proxy', 1);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://datageek_admin:DataGeek_Admin_2024@192.168.1.17:27018/datageek?authSource=admin';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',    // Vite dev server
    'http://localhost:5001',    // Backend dev server
    'https://basegeek.clintgeek.com',  // Production domain
    'https://notegeek.clintgeek.com',  // NoteGeek production
    'http://192.168.1.17:5173'  // Local network access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteGeekRoutes);
app.use('/api/mongo', mongoRoutes);
app.use('/api/redis', redisRoutes);
app.use('/api/postgres', postgresRoutes);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`MongoDB status available at http://localhost:${PORT}/api/mongo/status`);
  console.log(`Redis status available at http://localhost:${PORT}/api/redis/status`);
  console.log(`Postgres status available at http://localhost:${PORT}/api/postgres/status`);
  console.log(`User API available at http://localhost:${PORT}/api/users/`);
  console.log(`NoteGeek API available at http://localhost:${PORT}/api/notes/`);
});