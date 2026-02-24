const express = require('express');
const router = express.Router();
const {
    getAnnouncementSettings,
    updateAnnouncementSettings,
    getPublicAnnouncementSettings
} = require('../controllers/announcementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/settings')
    .get(protect, admin, getAnnouncementSettings)
    .put(protect, admin, updateAnnouncementSettings);

router.get('/public', getPublicAnnouncementSettings);

module.exports = router;
