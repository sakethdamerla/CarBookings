const mongoose = require('mongoose');

const carSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['SUV', 'Sedan', 'Hatchback'],
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'maintenance', 'booked'],
        default: 'available',
    },
    pricePer24h: {
        type: Number,
        default: 0,
    },
    transmission: {
        type: String, // 'Manual', 'Automatic'
        default: 'Manual'
    },
    fuelType: {
        type: String, // 'Petrol', 'Diesel', 'Electric', 'Hybrid'
        default: 'Petrol'
    },
    seats: {
        type: Number,
        default: 4
    },
    images: [{
        type: String, // URLs
    }],
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null,
    },
}, {
    timestamps: true,
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
