const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const bookings = await Booking.find({}).populate('owner', 'name email');
        console.log('Current Bookings:');
        bookings.forEach(b => {
            console.log(`- Booking ID: ${b._id}, Owner: ${b.owner ? b.owner.name : 'NONE'} (${b.owner ? b.owner.email : 'NONE'})`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkBookings();
