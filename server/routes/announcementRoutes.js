const express = require('express');
const router = express.Router();
const {
    getAnnouncementSettings,
    updateAnnouncementSettings,
    getPublicAnnouncementSettings,
    manualTriggerAnnouncement,
    manualTriggerSpecificAnnouncement
} = require('../controllers/announcementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/settings')
    .get(protect, admin, getAnnouncementSettings)
    .put(protect, admin, updateAnnouncementSettings);

router.post('/trigger', protect, admin, manualTriggerAnnouncement);
router.post('/trigger-specific', protect, admin, manualTriggerSpecificAnnouncement);
router.get('/public', getPublicAnnouncementSettings);

module.exports = router;
