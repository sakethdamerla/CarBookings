const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
    api_key: process.env.CLOUDINARY_URL.split(':')[1].replace('//', ''),
    api_secret: process.env.CLOUDINARY_URL.split(':')[2].split('@')[0],
});

module.exports = cloudinary;
