const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitNotification, emitToAllStaff } = require('../utils/socketService');
const webpush = require('web-push');

// Configure web-push defensively
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:saketh@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('VAPID keys not found. Push notifications will be disabled.');
}

const sendPushNotification = async (userId, title, body, url = '/') => {
    try {
        const user = await User.findById(userId);
        if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            const payload = JSON.stringify({ title, body, url });
            const pushPromises = user.pushSubscriptions.map(subscription =>
                webpush.sendNotification(subscription, payload).catch(error => {
                    console.error('Error sending push notification:', error);
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Remove expired subscription
                        return User.updateOne(
                            { _id: userId },
                            { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
                        );
                    }
                })
            );
            await Promise.all(pushPromises);
        }
    } catch (error) {
        console.error('Failed to send push notification:', error);
    }
};

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
            status: { $nin: ['cancelled', 'rejected'] },
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
            status: { $nin: ['cancelled', 'rejected'] },
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } },
            ],
        });

        if (driverConflict) {
            res.status(400);
            throw new Error('Driver is already booked for these dates');
        }
    }

    // Standardize mobile for consistent User linking
    const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

    // Ensure User record exists for notifications (even for guests)
    let bookingUser = req.user?._id;
    if (!bookingUser && mobile) {
        let existingUser = await User.findOne({
            $or: [
                { mobile: mobile.trim() },
                { mobile: { $regex: new RegExp(normalizedMobile + '$') } }
            ]
        });

        if (!existingUser) {
            existingUser = await User.create({
                name: customerName,
                mobile: normalizedMobile,
                role: 'user'
            });
        } else {
            // Update to normalized mobile if needed
            if (existingUser.mobile !== normalizedMobile) {
                existingUser.mobile = normalizedMobile;
                await existingUser.save();
            }
        }
        bookingUser = existingUser._id;
    }

    const booking = await Booking.create({
        customerName,
        mobile: normalizedMobile, // Store standardized version
        bookingType,
        car,
        driver,
        startDate,
        endDate,
        totalAmount,
        pickupLocation,
        dropLocation,
        user: bookingUser
    });

    if (booking) {
        // Create notifications for Admins and Superadmins
        const staff = await User.find({ role: { $in: ['admin', 'superadmin'] } });

        const msg = `New booking received from ${customerName}`;
        for (const member of staff) {
            // Respect superadmin toggle if member is superadmin
            if (member.role === 'superadmin' && !member.notificationsEnabled) continue;

            const notification = await Notification.create({
                recipient: member._id,
                message: msg,
                type: 'booking_created',
                bookingId: booking._id
            });

            // Emit to admin via socket
            emitNotification(member._id, notification);
        }

        // Global staff/admin event for live dashboard updates
        emitToAllStaff({
            type: 'booking_created',
            booking: await booking.populate('car', 'name model registrationNumber')
        });

        // Notify Admins
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        for (const admin of admins) {
            await sendPushNotification(
                admin._id,
                'New Booking Request',
                `New booking from ${customerName} for ${carData?.name || 'Car'}.`,
                '/admin/bookings'
            );
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
            // Find user - prioritize the user ID ref, fallback to mobile
            let recipientId = booking.user;

            if (!recipientId) {
                // Normalize mobile to last 10 digits
                const normalizedMobile = booking.mobile.replace(/\D/g, '').slice(-10);

                const customer = await User.findOne({
                    $or: [
                        { mobile: booking.mobile.trim() },
                        { mobile: { $regex: new RegExp(normalizedMobile + '$') } }
                    ],
                    role: 'user'
                });
                recipientId = customer?._id;
                console.log(`[NotificationDebug] Recipient lookup for mobile ${booking.mobile} (normalized: ${normalizedMobile}): ${recipientId || 'NOT FOUND'}`);
            } else {
                console.log(`[NotificationDebug] Found recipientId from booking.user: ${recipientId}`);
            }

            if (recipientId) {
                // Populate car details for better notification message if not already populated
                if (!updatedBooking.populated('car')) {
                    await updatedBooking.populate('car', 'name');
                }

                let notificationType;
                let notificationTitle;

                switch (updatedBooking.status) {
                    case 'confirmed':
                        notificationType = 'booking_approved';
                        notificationTitle = 'Booking Approved';
                        break;
                    case 'rejected':
                        notificationType = 'booking_rejected';
                        notificationTitle = 'Booking Rejected';
                        break;
                    case 'cancelled':
                        notificationType = 'booking_cancelled';
                        notificationTitle = 'Booking Cancelled';
                        break;
                    default:
                        // No notification for other statuses (e.g., 'completed', 'pending')
                        break;
                }

                if (notificationType) {
                    let msg = `Your booking for ${updatedBooking.car?.name || 'vehicle'} has been ${updatedBooking.status}`;
                    const notification = await Notification.create({
                        recipient: recipientId,
                        message: msg,
                        type: notificationType,
                        bookingId: booking._id
                    });

                    if (notification) {
                        console.log(`[NotificationDebug] Notification created for ${recipientId}: ${notification._id}`);
                    }

                    // Emit to client via socket
                    emitNotification(recipientId, notification);

                    // Send Push Notification
                    await sendPushNotification(
                        recipientId,
                        notificationTitle,
                        msg,
                        '/customer/bookings'
                    );
                } else {
                    console.log(`[NotificationDebug] No notification type determined for status: ${updatedBooking.status}`);
                }
            } else {
                console.warn(`[NotificationDebug] Could not find recipient for notification. Booking ID: ${booking._id}, Mobile: ${booking.mobile}`);
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
        status: { $nin: ['cancelled', 'rejected'] },
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
