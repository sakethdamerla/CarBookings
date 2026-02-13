const asyncHandler = require('express-async-handler');
const Car = require('../models/Car');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

// @desc    Get dashboard stats
// @route   GET /api/stats
// @access  Private (Admin)
const getStats = asyncHandler(async (req, res) => {
    const totalCars = await Car.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Calculate total revenue (assuming totalAmount is populated)
    const bookings = await Booking.find({ status: 'completed' });
    const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.totalAmount || 0), 0);

    // Get monthly bookings (simple aggregation)
    const monthlyBookings = await Booking.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } } // Sort by month
    ]);

    res.json({
        totalCars,
        totalDrivers,
        totalBookings,
        totalRevenue,
        monthlyBookings
    });
});

module.exports = { getStats };
