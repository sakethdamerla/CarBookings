const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await Driver.find({}).populate('assignedCar', 'name model registrationNumber');
    res.json(drivers);
});

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
const getDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id).populate('assignedCar', 'name model registrationNumber');

    if (driver) {
        res.json(driver);
    } else {
        res.status(404);
        throw new Error('Driver not found');
    }
});

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = asyncHandler(async (req, res) => {
    const { name, mobile, licenseNumber, assignedCar } = req.body;

    const driverExists = await Driver.findOne({ licenseNumber });

    if (driverExists) {
        res.status(400);
        throw new Error('Driver with this license number already exists');
    }

    const driver = await Driver.create({
        name,
        mobile,
        licenseNumber,
        assignedCar,
    });

    if (driver) {
        res.status(201).json(driver);
    } else {
        res.status(400);
        throw new Error('Invalid driver data');
    }
});

// @desc    Update a driver
// @route   PUT /api/drivers/:id
// @access  Private/Admin
const updateDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (driver) {
        driver.name = req.body.name || driver.name;
        driver.mobile = req.body.mobile || driver.mobile;
        driver.licenseNumber = req.body.licenseNumber || driver.licenseNumber;
        driver.status = req.body.status || driver.status;
        driver.assignedCar = req.body.assignedCar || driver.assignedCar;

        const updatedDriver = await driver.save();
        res.json(updatedDriver);
    } else {
        res.status(404);
        throw new Error('Driver not found');
    }
});

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (driver) {
        await driver.deleteOne();
        res.json({ message: 'Driver removed' });
    } else {
        res.status(404);
        throw new Error('Driver not found');
    }
});

module.exports = {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
};
