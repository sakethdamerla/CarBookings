const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');

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
        booking.status = req.body.status || booking.status;
        if (req.body.totalAmount !== undefined) {
            booking.totalAmount = req.body.totalAmount;
        }
        const updatedBooking = await booking.save();
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
