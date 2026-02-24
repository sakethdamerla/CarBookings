const asyncHandler = require('express-async-handler');
const Car = require('../models/Car');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

// @desc    Get dashboard stats
// @route   GET /api/stats
// @access  Private (Admin)
const getStats = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user) {
        if (req.user.role === 'admin') {
            query.owner = req.user._id;
        } else if (req.user.role === 'superadmin' && req.query.ownerId) {
            query.owner = req.query.ownerId;
        }
    }

    console.log(`[StatsDebug] Role: ${req.user?.role}, UserID: ${req.user?._id}, Query:`, query);

    const totalCars = await Car.countDocuments(query);
    const totalDrivers = await Driver.countDocuments(query);
    const totalBookings = await Booking.countDocuments(query);

    // Calculate total revenue (confirmed and completed)
    const bookings = await Booking.find({ ...query, status: { $in: ['confirmed', 'completed'] } });
    const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.totalAmount || 0), 0);

    // Get monthly bookings (simple aggregation)
    const pipeline = [];

    // Always apply the base query to the aggregation if it exists
    if (Object.keys(query).length > 0) {
        const matchQuery = { ...query };
        // Ensure owner is an ObjectId for MongoDB aggregation
        if (matchQuery.owner) {
            const mongoose = require('mongoose');
            if (typeof matchQuery.owner === 'string') {
                matchQuery.owner = new mongoose.Types.ObjectId(matchQuery.owner);
            } else if (matchQuery.owner instanceof mongoose.Types.ObjectId === false) {
                // It might be a Mongoose document or something else, force to ObjectId
                matchQuery.owner = new mongoose.Types.ObjectId(matchQuery.owner.toString());
            }
        }
        pipeline.push({ $match: matchQuery });
    }

    pipeline.push(
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    );

    console.log(`[StatsDebug] Aggregation Pipeline:`, JSON.stringify(pipeline, null, 2));
    const monthlyBookings = await Booking.aggregate(pipeline);

    res.json({
        totalCars,
        totalDrivers,
        totalBookings,
        totalRevenue,
        monthlyBookings
    });
});

module.exports = { getStats };
