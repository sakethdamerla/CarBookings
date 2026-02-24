const AnnouncementSettings = require('../models/AnnouncementSettings');
const User = require('../models/User');
const webpush = require('web-push');

// Configure web-push (re-using logic from bookingController or centralizing it)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:saketh@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const sendPush = async (user, payload) => {
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

    const pushPromises = user.pushSubscriptions.map(subscription =>
        webpush.sendNotification(subscription, payload)
            .catch(error => {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    return User.updateOne(
                        { _id: user._id },
                        { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
                    );
                }
            })
    );
    await Promise.all(pushPromises);
};

const triggerAnnouncement = async (settings) => {
    if (!settings || !settings.isEnabled || settings.sentences.length === 0) return;

    // Pick random sentences
    const shuffled = [...settings.sentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, settings.sentencesPerPopup || 1);
    const message = selected.join(' ');

    const payload = JSON.stringify({
        title: 'Important Announcement',
        body: message,
        url: '/customer/home'
    });

    const users = await User.find({
        'pushSubscriptions.0': { $exists: true },
        notificationsEnabled: true
    });

    console.log(`[AnnouncementEngine] Sending to ${users.length} users at ${new Date().toISOString()}`);

    const broadcastPromises = users.map(user => sendPush(user, payload));
    await Promise.all(broadcastPromises);

    settings.lastTriggered = new Date();
    await settings.save();
};

const triggerSpecificAnnouncement = async (sentence) => {
    if (!sentence) return;

    const payload = JSON.stringify({
        title: 'Important Announcement',
        body: sentence,
        url: '/customer/home'
    });

    const users = await User.find({
        'pushSubscriptions.0': { $exists: true },
        notificationsEnabled: true
    });

    console.log(`[AnnouncementEngine] Sending manual specific announcement to ${users.length} users`);

    const broadcastPromises = users.map(user => sendPush(user, payload));
    await Promise.all(broadcastPromises);
};

const startAnnouncementEngine = () => {
    console.log('[AnnouncementEngine] Engine started');

    // Run every minute
    setInterval(async () => {
        try {
            const now = new Date();
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const settings = await AnnouncementSettings.findOne();
            if (!settings || !settings.isEnabled) return;

            // Check if current time is in postTimes
            if (settings.postTimes.includes(currentTimeStr)) {
                // Prevent duplicate triggers in the same minute
                const lastTriggered = settings.lastTriggered ? new Date(settings.lastTriggered) : null;
                const isAlreadyTriggered = lastTriggered &&
                    lastTriggered.getHours() === now.getHours() &&
                    lastTriggered.getMinutes() === now.getMinutes();

                if (!isAlreadyTriggered) {
                    await triggerAnnouncement(settings);
                }
            }
        } catch (error) {
            console.error('[AnnouncementEngine] Error:', error);
        }
    }, 60000); // Check every 60 seconds
};

module.exports = { startAnnouncementEngine, triggerAnnouncement, triggerSpecificAnnouncement };
