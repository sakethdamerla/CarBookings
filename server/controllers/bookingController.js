const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.mobile) {
        query.mobile = req.query.mobile;
    }
    const bookings = await Booking.find(query)
        .populate('car', 'name model registrationNumber images pricePer24h transmission fuelType seats')
        .populate('driver', 'name mobile licenseNumber')
        .sort({ createdAt: -1 });
    res.json(bookings);
});


// @desc    Get pending bookings
// @route   GET /api/bookings/pending
// @access  Private (Admin/Superadmin with permission)
const getPendingBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ status: 'pending' })
        .populate('car', 'name model registrationNumber')
        .populate('driver', 'name mobile licenseNumber')
        .sort({ createdAt: -1 });
    res.json(bookings);
});

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private (Admin/User)
const createBooking = asyncHandler(async (req, res) => {
    const {
        customerName,
        mobile,
        bookingType,
        car,
        driver,
        startDate,
        endDate,
        totalAmount,
        pickupLocation,
        dropLocation,
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        res.status(400);
        throw new Error('End date must be after start date');
    }

    // Check specific Car status
    if (car) {
        const carData = await require('../models/Car').findById(car);
        if (!carData) {
            res.status(404);
            throw new Error('Car not found');
        }
        if (carData.status !== 'available') {
            res.status(400);
            throw new Error(`Car is currently ${carData.status}`);
        }

        const carConflict = await Booking.findOne({
            car,
            status: { $ne: 'cancelled' },
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } },
            ],
        });

        if (carConflict) {
            res.status(400);
            throw new Error('Car is already booked for these dates');
        }
    }

    // Check for Driver Overlap
    if (driver) {
        const driverConflict = await Booking.findOne({
            driver,
            status: { $ne: 'cancelled' },
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } },
            ],
        });

        if (driverConflict) {
            res.status(400);
            throw new Error('Driver is already booked for these dates');
        }
    }

    const booking = await Booking.create({
        customerName,
        mobile,
        bookingType,
        car,
        driver,
        startDate,
        endDate,
        totalAmount,
        pickupLocation,
        dropLocation,
    });

    if (booking) {
        // Create notifications for Admins and Superadmins
        const staff = await User.find({ role: { $in: ['admin', 'superadmin'] } });

        for (const member of staff) {
            // Respect superadmin toggle if member is superadmin
            if (member.role === 'superadmin' && !member.notificationsEnabled) continue;

            await Notification.create({
                recipient: member._id,
                message: `New booking received from ${customerName}`,
                type: 'booking_created',
                bookingId: booking._id
            });
        }

        res.status(201).json(booking);
    } else {
        res.status(400);
        throw new Error('Invalid booking data');
    }
});

// @desc    Update/Cancel booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
        const oldStatus = booking.status;
        booking.status = req.body.status || booking.status;
        if (req.body.totalAmount !== undefined) {
            booking.totalAmount = req.body.totalAmount;
        }
        const updatedBooking = await booking.save();

        // If status changed (e.g. approved/rejected), notify user
        if (oldStatus !== updatedBooking.status) {
            // Find user by mobile (since we don't have user ref in booking, we match by mobile)
            const customer = await User.findOne({ mobile: booking.mobile, role: 'user' });
            if (customer) {
                let msg = `Your booking for ${booking.car?.name || 'vehicle'} has been ${updatedBooking.status}`;
                await Notification.create({
                    recipient: customer._id,
                    message: msg,
                    type: updatedBooking.status === 'approved' ? 'booking_approved' : 'booking_rejected',
                    bookingId: booking._id
                });
            }
        }

        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc    Get car availability for next 7 days
// @route   GET /api/bookings/car/:id/availability
// @access  Public
const getCarAvailability = asyncHandler(async (req, res) => {
    const carId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const bookings = await Booking.find({
        car: carId,
        status: { $ne: 'cancelled' },
        $or: [
            { startDate: { $lt: nextWeek }, endDate: { $gt: today } },
        ],
    }).select('startDate endDate status');

    res.json(bookings);
});

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
        res.status(400);
        throw new Error('Booking is already cancelled');
    }

    // Check 10-minute window
    const now = new Date();
    const createdAt = new Date(booking.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);

    if (diffInMinutes > 10) {
        res.status(400);
        throw new Error('Cancellation window (10 minutes) has expired');
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully' });
});

module.exports = {
    getBookings,
    getPendingBookings,
    createBooking,
    updateBooking,
    getCarAvailability,
    cancelBooking,
};
