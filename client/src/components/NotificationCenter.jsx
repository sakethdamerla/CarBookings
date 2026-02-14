import { useState, useEffect, useRef, useContext } from 'react';
import { Bell, CheckSquare, X, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import { formatIST } from '../utils/dateUtils';
import { io } from 'socket.io-client';
import { apiUrl } from '../utils/api';

const NotificationCenter = ({ trigger }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const lastNotifiedId = useRef(null);
    const [showPermissionButton, setShowPermissionButton] = useState(false);

    const fetchNotifications = async () => {
        // Only fetch if user is authenticated
        if (!user) return;

        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            const newUnreadCount = data.filter(n => !n.isRead).length;
            setUnreadCount(newUnreadCount);

            // Trigger browser notification for the latest unread item if it's new
            const latestUnread = data.filter(n => !n.isRead)[0];
            if (latestUnread && latestUnread._id !== lastNotifiedId.current) {
                if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('New Car Booking Alert', {
                            body: latestUnread.message,
                            icon: '/download.png',
                            vibrate: [200, 100, 200],
                            badge: '/download.png',
                            tag: 'booking-update', // Prevent duplicate alerts
                            renotify: true
                        });
                    });
                }
                lastNotifiedId.current = latestUnread._id;
            }
        } catch (error) {
            // Silently fail for unauthenticated users
            if (error.response?.status !== 401) {
                console.error('Failed to fetch notifications:', error);
            }
        }
    };

    useEffect(() => {
        const handleNewNotification = (e) => {
            const newNotification = e.detail;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        window.addEventListener('notificationReceived', handleNewNotification);
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000); // Background sync

        return () => {
            window.removeEventListener('notificationReceived', handleNewNotification);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        if (!user) return;
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        if (!user) return;
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking_created': return <Clock className="text-zinc-400" size={18} />;
            case 'booking_approved': return <CheckCircle2 className="text-black" size={18} />;
            case 'booking_rejected': return <XCircle className="text-zinc-600" size={18} />;
            case 'booking_cancelled': return <X className="text-zinc-400" size={18} />;
            default: return <Info className="text-zinc-400" size={18} />;
        }
    };

    const requestPermissionManually = async () => {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                console.log('Manual permission request result:', permission);
                if (permission === 'granted') {
                    setShowPermissionButton(false);
                }
            } catch (err) {
                console.error('Manual permission request failed:', err);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {showPermissionButton && (
                <button
                    onClick={requestPermissionManually}
                    className="absolute -top-12 right-0 bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-2xl hover:bg-gray-900 transition-all z-50 whitespace-nowrap border border-white/10"
                >
                    🔔 Enable Notifications
                </button>
            )}
            {trigger ? (
                <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                    {trigger(unreadCount)}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse shadow-lg">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-x-4 top-[80px] md:absolute md:left-auto md:right-0 md:top-full md:mt-4 md:w-[420px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-6 duration-500 scale-100 origin-top-right">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] font-black text-gray-900 underline underline-offset-4 uppercase tracking-widest hover:text-black transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => markAsRead(n._id)}
                                        className={`p-5 hover:bg-gray-50 transition-all cursor-pointer group flex gap-5 active:bg-gray-100 ${!n.isRead ? 'bg-zinc-50/50' : ''}`}
                                    >
                                        <div className="mt-1 transition-transform group-hover:scale-110">{getIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm leading-relaxed ${!n.isRead ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock size={10} className="text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {formatIST(n.createdAt, 'hh:mm A')}
                                                </span>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2.5 h-2.5 bg-black rounded-full mt-2 ring-4 ring-black/5 animate-pulse"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell size={24} className="text-gray-300" />
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
