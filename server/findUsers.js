const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const findUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: { $in: ['admin', 'superadmin'] } }, 'name email role');
        console.log('Admin/Superadmin Users:');
        users.forEach(u => console.log(`- ${u.name} (${u.email}): ${u.role}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findUsers();
