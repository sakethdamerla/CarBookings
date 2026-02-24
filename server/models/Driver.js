const mongoose = require('mongoose');

const driverSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['available', 'on_duty'],
        default: 'available',
    },
    assignedCar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        default: null,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
