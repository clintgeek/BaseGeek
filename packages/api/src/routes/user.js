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

export default router;