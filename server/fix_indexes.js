const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Access the native MongoDB driver collection
        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        // Find email index (could be named differently, usually email_1)
        const emailIndex = indexes.find(idx => idx.key.email === 1);

        if (emailIndex) {
            console.log(`Found email index: ${emailIndex.name}. Dropping it...`);
            await collection.dropIndex(emailIndex.name);
            console.log('Index dropped successfully.');
        } else {
            console.log('Email index not found.');
        }

        console.log('Done.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
