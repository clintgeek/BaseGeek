import express from 'express';
import rateLimit from 'express-rate-limit';
import authService from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';
import { User } from '../models/user.js';
import jwt from 'jsonwebtoken';

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
        console.log('Login request received:', {
            body: req.body,
            headers: req.headers,
            ip: req.ip
        });

        const { identifier, password, app } = req.body;

        // Validate required fields
        if (!identifier || !password) {
            console.error('Missing credentials:', {
                identifier: !!identifier,
                password: !!password,
                body: req.body
            });
            return res.status(400).json({
                message: 'Missing credentials',
                code: 'LOGIN_ERROR'
            });
        }

        // Validate app
        if (!app || !['basegeek', 'notegeek', 'bujogeek'].includes(app.toLowerCase())) {
            console.error('Invalid app:', {
                app,
                validApps: ['basegeek', 'notegeek', 'bujogeek']
            });
            return res.status(400).json({
                message: 'Invalid app',
                code: 'LOGIN_ERROR'
            });
        }

        console.log('Attempting login for:', {
            identifier,
            app: app.toLowerCase(),
            timestamp: new Date().toISOString()
        });

        const result = await authService.login(identifier, password, app.toLowerCase());

        console.log('Login successful for:', {
            identifier,
            app: app.toLowerCase(),
            userId: result.user.id,
            timestamp: new Date().toISOString()
        });

        res.json(result);
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            stack: error.stack,
            identifier: req.body.identifier,
            app: req.body.app,
            timestamp: new Date().toISOString()
        });

        // Determine appropriate status code
        const statusCode = error.message.includes('Invalid credentials') ? 401 : 500;

        res.status(statusCode).json({
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
        res.json({
            valid: true,
            user: {
                id: result.userId,
                username: result.username,
                email: result.email,
                app: result.app
            }
        });
    } catch (error) {
        res.status(401).json({
            message: error.message,
            code: 'TOKEN_VALIDATION_ERROR',
            valid: false
        });
    }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken, app } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: 'Refresh token is required',
                code: 'TOKEN_REFRESH_ERROR'
            });
        }

        // Validate the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Generate new access token
        const accessToken = authService.generateToken(user, app);

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token: accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                app
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
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

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, app } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                code: 'USER_EXISTS'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            profile: {},
            lastLogin: new Date()
        });

        await user.save();

        // Generate token
        const token = await authService.generateToken(user, app);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            message: error.message,
            code: 'REGISTER_ERROR'
        });
    }
});

// @desc    Debug: Check user data
// @route   GET /api/auth/debug/user/:identifier
// @access  Public
router.get('/debug/user/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Return user data without sensitive information
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Debug user error:', error);
        res.status(500).json({
            message: error.message,
            code: 'DEBUG_ERROR'
        });
    }
});

// @desc    Reset user password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { identifier, newPassword } = req.body;

        if (!identifier || !newPassword) {
            return res.status(400).json({
                message: 'Identifier and new password are required',
                code: 'MISSING_DATA'
            });
        }

        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password updated successfully',
            code: 'PASSWORD_UPDATED'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            message: error.message,
            code: 'RESET_ERROR'
        });
    }
});

export default router;