const express = require('express');
const router = express.Router();
const {
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
} = require('../controllers/driverController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getDrivers).post(protect, admin, createDriver);
router
    .route('/:id')
    .get(protect, getDriver)
    .put(protect, admin, updateDriver)
    .delete(protect, admin, deleteDriver);

module.exports = router;
