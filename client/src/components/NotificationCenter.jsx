import { useState, useEffect, useRef, useContext } from 'react';
import { Bell, CheckSquare, X, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';

const NotificationCenter = () => {
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
        // Request notification permission when user is authenticated
        if (user && 'Notification' in window) {
            console.log('=== NOTIFICATION DEBUG ===');
            console.log('User authenticated:', !!user);
            console.log('Notification API available:', 'Notification' in window);
            console.log('Current permission:', Notification.permission);
            console.log('Browser:', navigator.userAgent);

            if (Notification.permission === 'default') {
                console.log('Requesting notification permission...');
                // Request immediately
                Notification.requestPermission().then(permission => {
                    console.log('Permission response:', permission);
                    if (permission === 'default') {
                        setShowPermissionButton(true);
                    }
                }).catch(err => {
                    console.error('Permission request error:', err);
                    setShowPermissionButton(true);
                });
            } else if (Notification.permission === 'denied') {
                console.log('Notifications are blocked. User needs to enable in browser settings.');
                setShowPermissionButton(true);
            } else {
                console.log('Notifications already granted!');
            }
        } else {
            console.log('Notification conditions not met:', { user: !!user, hasNotificationAPI: 'Notification' in window });
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [user]);

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
            case 'booking_created': return <Clock className="text-blue-500" size={18} />;
            case 'booking_approved': return <CheckCircle2 className="text-green-500" size={18} />;
            case 'booking_rejected': return <XCircle className="text-red-500" size={18} />;
            case 'booking_cancelled': return <X className="text-gray-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
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
                    className="absolute -top-12 right-0 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all z-50 whitespace-nowrap"
                >
                    🔔 Enable Notifications
                </button>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0">
                        <h3 className="font-black text-gray-900 uppercase tracking-tighter">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => markAsRead(n._id)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex gap-4 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="mt-1">{getIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!n.isRead ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
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
