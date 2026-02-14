const expressAsyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Register a push subscription
// @route   POST /api/push/subscribe
// @access  Private
const subscribe = expressAsyncHandler(async (req, res) => {
    const subscription = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Check if subscription already exists
        const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.status(201).json({ message: 'Push subscription saved' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Unsubscribe from push notifications
// @route   POST /api/push/unsubscribe
// @access  Private
const unsubscribe = expressAsyncHandler(async (req, res) => {
    const { endpoint } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
        await user.save();
        res.json({ message: 'Push subscription removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    subscribe,
    unsubscribe
};
