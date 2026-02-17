const asyncHandler = require('express-async-handler');
const Car = require('../models/Car');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Private (Admin/SuperAdmin/User?) - Let's say Admin/SuperAdmin for managing, User for booking
const getCars = asyncHandler(async (req, res) => {
    const cars = await Car.find({});
    res.json(cars);
});

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Private
const getCar = asyncHandler(async (req, res) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        res.json(car);
    } else {
        res.status(404);
        throw new Error('Car not found');
    }
});

// @desc    Create a car
// @route   POST /api/cars
// @access  Private/Admin
const createCar = asyncHandler(async (req, res) => {
    const { name, model, registrationNumber, type, pricePer24h, transmission, fuelType, seats } = req.body;
    let image = 'https://via.placeholder.com/300'; // Default

    if (req.file) {
        image = req.file.path;
    }

    const carExists = await Car.findOne({ registrationNumber });

    if (carExists) {
        res.status(400);
        throw new Error('Car with this registration number already exists');
    }

    const car = await Car.create({
        name,
        model,
        registrationNumber,
        type: type || 'Sedan',
        pricePer24h: pricePer24h ? Number(pricePer24h) : 0,
        transmission: (transmission && transmission !== 'undefined') ? transmission : 'Manual',
        fuelType: (fuelType && fuelType !== 'undefined') ? fuelType : 'Petrol',
        seats: seats ? Number(seats) : 4,
        images: [image],
    });

    if (car) {
        res.status(201).json(car);
    } else {
        res.status(400);
        throw new Error('Invalid car data');
    }
});

// @desc    Update a car
// @route   PUT /api/cars/:id
// @access  Private/Admin
const updateCar = asyncHandler(async (req, res) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        if (req.file) {
            car.images = [req.file.path];
        } else {
            car.images = req.body.images || car.images;
        }

        car.name = req.body.name || car.name;
        car.model = req.body.model || car.model;
        car.registrationNumber = req.body.registrationNumber || car.registrationNumber;
        car.type = req.body.type || car.type;
        car.status = req.body.status || car.status;
        car.pricePer24h = req.body.pricePer24h !== undefined && req.body.pricePer24h !== 'undefined' ? Number(req.body.pricePer24h) : car.pricePer24h;
        car.transmission = (req.body.transmission && req.body.transmission !== 'undefined') ? req.body.transmission : (car.transmission || 'Manual');
        car.fuelType = (req.body.fuelType && req.body.fuelType !== 'undefined') ? req.body.fuelType : (car.fuelType || 'Petrol');
        car.seats = req.body.seats !== undefined && req.body.seats !== 'undefined' ? Number(req.body.seats) : (car.seats || 4);
        car.assignedDriver = req.body.assignedDriver || car.assignedDriver;

        const updatedCar = await car.save();
        res.json(updatedCar);
    } else {
        res.status(404);
        throw new Error('Car not found');
    }
});

// @desc    Delete a car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
const deleteCar = asyncHandler(async (req, res) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        await car.deleteOne();
        res.json({ message: 'Car removed' });
    } else {
        res.status(404);
        throw new Error('Car not found');
    }
});

module.exports = {
    getCars,
    getCar,
    createCar,
    updateCar,
    deleteCar,
};
