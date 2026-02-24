const mongoose = require('mongoose');

const announcementSettingsSchema = mongoose.Schema({
    isEnabled: {
        type: Boolean,
        default: false,
    },
    sentences: {
        type: [String],
        default: [],
    },
    sentencesPerPopup: {
        type: Number,
        default: 1,
    },
    postTimes: {
        type: [String], // array of "HH:mm" strings
        default: ["09:00"],
    },
    lastTriggered: {
        type: Date,
    }
}, {
    timestamps: true,
});

const AnnouncementSettings = mongoose.model('AnnouncementSettings', announcementSettingsSchema);

module.exports = AnnouncementSettings;
