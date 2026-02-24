const asyncHandler = require('express-async-handler');
const AnnouncementSettings = require('../models/AnnouncementSettings');

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
    const { isEnabled, sentences, sentencesPerPopup, postTime } = req.body;

    let settings = await AnnouncementSettings.findOne();
    if (!settings) {
        settings = await AnnouncementSettings.create(req.body);
    } else {
        settings.isEnabled = isEnabled ?? settings.isEnabled;
        settings.sentences = sentences ?? settings.sentences;
        settings.sentencesPerPopup = sentencesPerPopup ?? settings.sentencesPerPopup;
        settings.postTime = postTime ?? settings.postTime;
        await settings.save();
    }

    res.json(settings);
});

// @desc    Get public announcement settings (for listener)
// @route   GET /api/announcements/public
// @access  Public
const getPublicAnnouncementSettings = asyncHandler(async (req, res) => {
    const settings = await AnnouncementSettings.findOne().select('isEnabled sentences sentencesPerPopup postTime lastTriggered');
    res.json(settings || { isEnabled: false });
});

module.exports = {
    getAnnouncementSettings,
    updateAnnouncementSettings,
    getPublicAnnouncementSettings
};
