import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Megaphone, Bell, X } from 'lucide-react';

const AnnouncementListener = () => {
    const [settings, setSettings] = useState(null);
    const [permission, setPermission] = useState(Notification?.permission || 'denied');
    const [showBanner, setShowBanner] = useState(Notification?.permission !== 'granted');
    const [lastTriggeredSlots, setLastTriggeredSlots] = useState({}); // { date: [time1, time2] }

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

    const triggerNotification = useCallback((timeSlot) => {
        if (!settings || !settings.isEnabled || settings.sentences.length === 0) return;
        if (permission !== 'granted') return;

        // Pick random sentences
        const shuffled = [...settings.sentences].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, settings.sentencesPerPopup);
        const message = selected.join(' ');

        new Notification('System Announcement', {
            body: message,
            icon: '/logo192.png',
        });

        const today = new Date().toDateString();
        setLastTriggeredSlots(prev => ({
            ...prev,
            [today]: [...(prev[today] || []), timeSlot]
        }));
    }, [settings, permission]);

    useEffect(() => {
        const checkTime = () => {
            if (!settings || !settings.isEnabled || !settings.postTimes || settings.postTimes.length === 0) return;

            const now = new Date();
            const today = now.toDateString();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');

            // Find if current time is in postTimes and hasn't been triggered yet today
            const matchingSlot = settings.postTimes.find(t => t === currentTime);
            const triggeredToday = lastTriggeredSlots[today] || [];

            if (matchingSlot && !triggeredToday.includes(matchingSlot)) {
                triggerNotification(matchingSlot);
            }
        };

        const timer = setInterval(checkTime, 30000); // Check every 30 seconds
        return () => clearInterval(timer);
    }, [settings, lastTriggeredSlots, triggerNotification]);

    if (!showBanner || permission === 'granted') return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                <div className="p-8 bg-black text-white relative">
                    <button onClick={() => setShowBanner(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-white/40">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col items-center text-center mt-4">
                        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-6 animate-pulse">
                            <Bell className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Stay Connected</h3>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                            Enable notifications to receive real-time system announcements and booking alerts.
                        </p>
                    </div>
                </div>

                <div className="p-8 space-y-4">
                    <button
                        onClick={requestPermission}
                        className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        Allow Notifications
                    </button>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="w-full py-5 bg-gray-100 text-gray-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementListener;
