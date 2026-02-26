const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '60d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.role === 'user') {
            res.status(401);
            throw new Error('Customers must use mobile login');
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            subscriptionEndDate: user.subscriptionEndDate,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Protected for Admin creation)
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            notificationsEnabled: user.notificationsEnabled,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            subscriptionEndDate: user.subscriptionEndDate,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a new admin
// @route   POST /api/auth/admins
// @access  Private (SuperAdmin)
const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, permissions } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        username: req.body.username || '',
        email,
        password,
        role: 'admin',
        permissions: permissions || [],
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            subscriptionEndDate: user.subscriptionEndDate,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update admin permissions
// @route   PUT /api/auth/admins/:id/permissions
// @access  Private (SuperAdmin)
const updateAdminPermissions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user && user.role === 'admin') {
        user.permissions = req.body.permissions || user.permissions;
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
        });
    } else {
        res.status(404);
        throw new Error('Admin not found');
    }
});

// @desc    Update admin details
// @route   PUT /api/auth/admins/:id
// @access  Private (SuperAdmin)
const updateAdmin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user && user.role === 'admin') {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.username = req.body.username !== undefined ? req.body.username : user.username;

        if (req.body.password) {
            user.password = req.body.password;
        }

        if (req.body.permissions) {
            user.permissions = req.body.permissions;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
        });
    } else {
        res.status(404);
        throw new Error('Admin not found');
    }
});

// @desc    Delete admin
// @route   DELETE /api/auth/admins/:id
// @access  Private (SuperAdmin)
const deleteAdmin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user && user.role === 'admin') {
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'Admin removed' });
    } else {
        res.status(404);
        throw new Error('Admin not found');
    }
});

// @desc    Extend admin subscription
// @route   PUT /api/auth/admins/:id/extend
// @access  Private (SuperAdmin)
const extendSubscription = asyncHandler(async (req, res) => {
    const { days } = req.body;
    const user = await User.findById(req.params.id);

    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        const currentEnd = user.subscriptionEndDate && user.subscriptionEndDate > new Date()
            ? user.subscriptionEndDate
            : new Date();

        user.subscriptionEndDate = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            subscriptionEndDate: updatedUser.subscriptionEndDate,
        });
    } else {
        res.status(404);
        throw new Error('User not found or not an admin');
    }
});

// @desc    Get all admins
// @route   GET /api/auth/admins
// @access  Private (SuperAdmin)
const getAdmins = asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
});

// @desc    Login or Register user with mobile
// @route   POST /api/auth/mobile-login
// @access  Public
const loginWithMobile = asyncHandler(async (req, res) => {
    try {
        const { mobile, name } = req.body;

        if (!mobile) {
            res.status(400);
            throw new Error('Please provide a mobile number');
        }

        // Standardize mobile to last 10 digits for consistent lookups
        const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

        let user = await User.findOne({
            $or: [
                { mobile: mobile.trim() },
                { mobile: { $regex: new RegExp(normalizedMobile + '$') } }
            ]
        });

        if (!user) {
            // Create new user if not exists
            if (!name) {
                res.status(400);
                throw new Error('Please provide your name for registration');
            }
            user = await User.create({
                name,
                mobile: normalizedMobile, // Store standardized version
                role: 'user',
            });
        } else {
            // Update to standardized mobile if needed and set name
            if (name) user.name = name;
            user.mobile = normalizedMobile;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            mobile: user.mobile,
            role: user.role,
            permissions: user.permissions,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Error in loginWithMobile:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.username = req.body.username !== undefined ? req.body.username : user.username;
        user.email = req.body.email || user.email;
        user.mobile = req.body.mobile || user.mobile;

        if (req.body.notificationsEnabled !== undefined) {
            user.notificationsEnabled = req.body.notificationsEnabled;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            mobile: updatedUser.mobile,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
            subscriptionEndDate: updatedUser.subscriptionEndDate,
            notificationsEnabled: updatedUser.notificationsEnabled,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    authUser,
    registerUser,
    getUserProfile,
    createAdmin,
    getAdmins,
    loginWithMobile,
    updateAdminPermissions,
    updateUserProfile,
    updateAdmin,
    deleteAdmin,
    extendSubscription
};
