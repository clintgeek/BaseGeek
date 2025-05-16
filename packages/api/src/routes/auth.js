import express from 'express';
import rateLimit from 'express-rate-limit';
import authService from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        message: 'Too many login attempts, please try again later',
        code: 'AUTH_RATE_LIMIT'
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { identifier, password, app } = req.body;
        const result = await authService.login(identifier, password, app);
        res.json(result);
    } catch (error) {
        res.status(401).json({
            message: error.message,
            code: 'LOGIN_ERROR'
        });
    }
});

// @desc    Validate token
// @route   POST /api/auth/validate
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { token, app } = req.body;
        const result = await authService.validateToken(token);
        res.json(result);
    } catch (error) {
        res.status(401).json({
            message: error.message,
            code: 'TOKEN_VALIDATION_ERROR'
        });
    }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
    try {
        const { token, app } = req.body;
        const result = await authService.refreshToken(token, app);
        res.json(result);
    } catch (error) {
        res.status(401).json({
            message: error.message,
            code: 'TOKEN_REFRESH_ERROR'
        });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await authService.getUserProfile(userId);
        res.json(profile);
    } catch (error) {
        res.status(404).json({
            message: error.message,
            code: 'PROFILE_ERROR'
        });
    }
});

export default router;