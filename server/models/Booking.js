const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    customerName: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    bookingType: {
        type: String,
        enum: ['car_only', 'driver_only', 'car_with_driver'],
        required: true,
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
        default: 'pending',
    },
    pickupLocation: {
        type: String,
        required: true,
    },
    dropLocation: {
        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
    },
}, {
    timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
