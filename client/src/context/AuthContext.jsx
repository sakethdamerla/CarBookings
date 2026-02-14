import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { subscribeToPush } from '../utils/pushUtils';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            subscribeToPush();

            // Initialize socket connection
            const newSocket = io(window.location.origin.replace('3000', '5000'), {
                query: { userId: user._id }
            });

            // Authenticate socket with user ID
            newSocket.on('connect', () => {
                console.log('[SocketDebug] Connected to server, authenticating...');
                newSocket.emit('authenticate', user._id);
            });

            newSocket.on('notification', (newNotification) => {
                console.log('Real-time notification received (Global):', newNotification);
                // Broadcast a global event for components to refresh their data
                window.dispatchEvent(new CustomEvent('refreshData', { detail: newNotification }));

                // Browser alert
                if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Booking Update', {
                            body: newNotification.message,
                            icon: '/download.png',
                            badge: '/download.png',
                            vibrate: [200, 100, 200],
                            tag: 'booking-update',
                            renotify: true
                        });
                    });
                }

                // Also dispatch a secondary event for NotificationCenter to catch
                window.dispatchEvent(new CustomEvent('notificationReceived', { detail: newNotification }));
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [user]);


    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const loginWithMobile = async (mobile, name) => {
        const { data } = await api.post('/auth/mobile-login', { mobile, name });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithMobile, logout, loading, socket }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
