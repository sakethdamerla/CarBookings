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
            email: user.email,
            role: user.role,
            permissions: user.permissions,
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
            email: user.email,
            role: user.role,
            permissions: user.permissions,
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
        email,
        password,
        role: 'admin',
        permissions: permissions || [],
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
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
            email: updatedUser.email,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
        });
    } else {
        res.status(404);
        throw new Error('Admin not found');
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

        let user = await User.findOne({ mobile });

        if (!user) {
            // Create new user if not exists
            if (!name) {
                res.status(400);
                throw new Error('Please provide your name for registration');
            }
            user = await User.create({
                name,
                mobile,
                role: 'user',
            });
        } else if (name) {
            // Optional: Update name if provided and user exists (basic profile update on login)
            user.name = name;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
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
            email: updatedUser.email,
            mobile: updatedUser.mobile,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
            notificationsEnabled: updatedUser.notificationsEnabled,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { authUser, registerUser, getUserProfile, createAdmin, getAdmins, loginWithMobile, updateAdminPermissions, updateUserProfile };
