const express = require('express');
const router = express.Router();
const {
    getBookings,
    getPendingBookings,
    createBooking,
    updateBooking,
    cancelBooking,
    getCarAvailability,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getBookings).post(createBooking);
router.route('/pending').get(protect, getPendingBookings);
router.route('/:id/cancel').post(cancelBooking);
router.route('/car/:id/availability').get(getCarAvailability);
router.route('/:id').put(protect, updateBooking);



module.exports = router;
