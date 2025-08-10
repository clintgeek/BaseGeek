import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { User } from '../models/user.js';

const router = express.Router();

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({
            message: err.message,
            code: 'GET_USER_ERROR'
        });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Update profile fields
        const { username, email, profile } = req.body;
        if (username) user.username = username;
        if (email) user.email = email.toLowerCase();
        if (profile) user.profile = { ...user.profile, ...profile };

        await user.save();

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({
            message: err.message,
            code: 'UPDATE_PROFILE_ERROR'
        });
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, '-passwordHash').lean();
        res.json({
            users: users.map(user => ({
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                lastLogin: user.lastLogin
            }))
        });
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({
            message: err.message,
            code: 'GET_ALL_USERS_ERROR'
        });
    }
});

// @desc    Create user (admin use)
// @route   POST /api/users
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { username, email, password, profile } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'username, email, and password are required', code: 'VALIDATION_ERROR' });
        }

        const existing = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
        if (existing) {
            return res.status(400).json({ message: 'User already exists', code: 'USER_EXISTS' });
        }

        const user = new User({ username, email: email.toLowerCase(), password, profile: profile || {} });
        await user.save();

        res.status(201).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile,
            }
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ message: err.message, code: 'CREATE_USER_ERROR' });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({
            message: err.message,
            code: 'DELETE_USER_ERROR'
        });
    }
});

export default router;