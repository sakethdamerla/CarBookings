const express = require('express');
const router = express.Router();
const {
    getCars,
    getCar,
    createCar,
    updateCar,
    deleteCar,
} = require('../controllers/carController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/').get(optionalProtect, getCars).post(protect, admin, upload.single('image'), createCar);
router
    .route('/:id')
    .get(getCar)
    .put(protect, admin, upload.single('image'), updateCar)
    .delete(protect, admin, deleteCar);


module.exports = router;
