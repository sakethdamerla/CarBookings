const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, createAdmin, getAdmins, loginWithMobile, updateAdminPermissions, updateUserProfile, updateAdmin, deleteAdmin } = require('../controllers/authController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/admins')
    .post(protect, superAdmin, createAdmin)
    .get(protect, superAdmin, getAdmins);

router.route('/admins/:id')
    .put(protect, superAdmin, updateAdmin)
    .delete(protect, superAdmin, deleteAdmin);

router.route('/admins/:id/permissions').put(protect, superAdmin, updateAdminPermissions);
router.post('/mobile-login', loginWithMobile);

module.exports = router;
