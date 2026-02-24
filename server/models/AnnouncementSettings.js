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
    postTime: {
        type: String, // format "HH:mm"
        default: "09:00",
    },
    lastTriggered: {
        type: Date,
    }
}, {
    timestamps: true,
});

const AnnouncementSettings = mongoose.model('AnnouncementSettings', announcementSettingsSchema);

module.exports = AnnouncementSettings;
