const asyncHandler = require('express-async-handler');
const AnnouncementSettings = require('../models/AnnouncementSettings');
const { triggerAnnouncement, triggerSpecificAnnouncement } = require('../utils/announcementEngine');

// @desc    Get announcement settings
// @route   GET /api/announcements/settings
// @access  Private/Admin
const getAnnouncementSettings = asyncHandler(async (req, res) => {
    let settings = await AnnouncementSettings.findOne();
    if (!settings) {
        settings = await AnnouncementSettings.create({});
    }
    res.json(settings);
});

// @desc    Update announcement settings
// @route   PUT /api/announcements/settings
// @access  Private/Admin
const updateAnnouncementSettings = asyncHandler(async (req, res) => {
    let settings = await AnnouncementSettings.findOne();

    if (!settings) {
        settings = new AnnouncementSettings(req.body);
    } else {
        if (req.body.isEnabled !== undefined) settings.isEnabled = req.body.isEnabled;
        if (req.body.sentences !== undefined) settings.sentences = req.body.sentences;
        if (req.body.sentencesPerPopup !== undefined) settings.sentencesPerPopup = req.body.sentencesPerPopup;
        if (req.body.postTimes !== undefined) settings.postTimes = req.body.postTimes;
    }

    // Ensure array changes are tracked
    if (req.body.sentences) settings.markModified('sentences');
    if (req.body.postTimes) settings.markModified('postTimes');

    await settings.save();
    res.json(settings);
});

// @desc    Get public announcement settings (for listener)
// @route   GET /api/announcements/public
// @access  Public
const getPublicAnnouncementSettings = asyncHandler(async (req, res) => {
    const settings = await AnnouncementSettings.findOne().select('isEnabled sentences sentencesPerPopup postTimes lastTriggered');
    res.json(settings || { isEnabled: false });
});

// @desc    Trigger announcement manually (for testing)
// @route   POST /api/announcements/trigger
// @access  Private/Admin
const manualTriggerAnnouncement = asyncHandler(async (req, res) => {
    const settings = await AnnouncementSettings.findOne();
    if (!settings) {
        res.status(404);
        throw new Error('Announcement settings not found');
    }
    await triggerAnnouncement(settings);
    res.json({ message: 'Announcement triggered manually' });
});

// @desc    Trigger specific announcement manually
// @route   POST /api/announcements/trigger-specific
// @access  Private/Admin
const manualTriggerSpecificAnnouncement = asyncHandler(async (req, res) => {
    const { sentence } = req.body;
    if (!sentence) {
        res.status(400);
        throw new Error('Sentence is required');
    }
    await triggerSpecificAnnouncement(sentence);
    res.json({ message: 'Specific announcement triggered manually' });
});

module.exports = {
    getAnnouncementSettings,
    updateAnnouncementSettings,
    getPublicAnnouncementSettings,
    manualTriggerAnnouncement,
    manualTriggerSpecificAnnouncement
};
