const mongoose = require('mongoose');
const Car = require('./models/Car');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkCars = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cars = await Car.find({}).populate('owner', 'name email');
        console.log('Current Cars:');
        cars.forEach(c => {
            console.log(`- Car: ${c.name}, Owner: ${c.owner ? c.owner.name : 'NONE'} (${c.owner ? c.owner.email : 'NONE'})`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCars();
