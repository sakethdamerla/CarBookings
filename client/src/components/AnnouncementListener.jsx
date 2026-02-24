import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Megaphone, Bell, X } from 'lucide-react';

const AnnouncementListener = () => {
    const [settings, setSettings] = useState(null);
    const [permission, setPermission] = useState(Notification?.permission || 'denied');
    const [showBanner, setShowBanner] = useState(Notification?.permission !== 'granted');
    const [lastTriggeredDate, setLastTriggeredDate] = useState(null);

    const fetchPublicSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/announcements/public');
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch public announcement settings:', error);
        }
    }, []);

    useEffect(() => {
        fetchPublicSettings();
        // Refresh settings every 5 minutes to stay in sync with admin changes
        const interval = setInterval(fetchPublicSettings, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchPublicSettings]);

    const requestPermission = async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
            setShowBanner(false);
        }
    };

    const triggerNotification = useCallback(() => {
        if (!settings || !settings.isEnabled || settings.sentences.length === 0) return;
        if (permission !== 'granted') return;

        // Pick random sentences
        const shuffled = [...settings.sentences].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, settings.sentencesPerPopup);
        const message = selected.join(' ');

        new Notification('System Announcement', {
            body: message,
            icon: '/logo192.png', // Assuming base icon path
        });

        setLastTriggeredDate(new Date().toDateString());
    }, [settings, permission]);

    useEffect(() => {
        const checkTime = () => {
            if (!settings || !settings.isEnabled || !settings.postTime) return;

            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');

            // Only trigger once per day at the specified time
            if (currentTime === settings.postTime && lastTriggeredDate !== now.toDateString()) {
                triggerNotification();
            }
        };

        const timer = setInterval(checkTime, 30000); // Check every 30 seconds
        return () => clearInterval(timer);
    }, [settings, lastTriggeredDate, triggerNotification]);

    if (!showBanner || permission === 'granted') return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-2 md:p-4 shadow-2xl flex items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center animate-pulse shrink-0">
                        <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-sm font-black uppercase tracking-tight">Enable Notifications</p>
                        <p className="hidden md:block text-[10px] font-bold opacity-80 uppercase tracking-widest leading-tight">Stay updated with system announcements and booking alerts.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={requestPermission}
                        className="px-3 md:px-6 py-1.5 md:py-2 bg-white text-blue-600 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
                    >
                        Allow
                    </button>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementListener;
