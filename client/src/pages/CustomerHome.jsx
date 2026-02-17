import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import { Car, User, MapPin, Search, Heart, Star, LogOut, Calendar, Fuel, Bell, Settings2 } from 'lucide-react';
import GuestLoginModal from '../components/GuestLoginModal';
import NotificationCenter from '../components/NotificationCenter';

const CustomerHome = () => {
    const { user, logout } = useContext(AuthContext); // Get user
    const [cars, setCars] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestUser, setGuestUser] = useState(JSON.parse(localStorage.getItem('guestUser')));
    const [pendingNavCarId, setPendingNavCarId] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(
        'Notification' in window ? Notification.permission : 'denied'
    );
    const navigate = useNavigate();

    // Mock categories/brands for UI matching


    useEffect(() => {
        const fetchCars = async () => {
            try {
                const { data } = await api.get('/cars');
                setCars(data.filter(c => c.status === 'available'));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, []);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                const { subscribeToPush } = await import('../utils/pushUtils');
                subscribeToPush();
            }
        }
    };

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNav = (path) => {
        navigate(path);
    };

    return (
        <div className="pb-32">
            {/* Notification Permission Banner */}
            {user && notificationPermission === 'default' && (
                <div className="bg-zinc-900 text-white px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-700 sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                            <Bell className="w-5 h-5 text-white animate-bounce" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.1em]">Enable Premium Updates</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.05em] mt-1">Receive instance alerts for booking approvals & status changes</p>
                        </div>
                    </div>
                    <button
                        onClick={requestNotificationPermission}
                        className="bg-white text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-100 transition-all active:scale-95 whitespace-nowrap"
                    >
                        Allow Notifications
                    </button>
                </div>
            )}
            {/* Black Header Section */}
            <div className="bg-black text-white p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[3.5rem] shadow-xl sticky top-0 z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center text-gray-400 mb-1 text-xs md:text-sm font-medium uppercase tracking-widest">
                                <span className="opacity-80">Welcome back,</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{user?.name || guestUser?.name || 'Guest'}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationCenter
                                trigger={(unreadCount) => (
                                    <div className="bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-2xl border border-white/10 backdrop-blur-md transition-all group active:scale-95 relative">
                                        <Bell className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-12 transition-transform" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-2 right-2 w-5 h-5 bg-white text-black text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black animate-pulse shadow-lg">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
                        <input
                            type="text"
                            placeholder="Search for your dream car..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-14 py-4 md:py-5 bg-white text-gray-800 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-sm md:text-base font-medium"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 p-2 md:p-3 rounded-xl text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 space-y-12">
                {/* Popular Cars */}
                <section>
                    <div className="flex justify-between items-end mb-8 px-2">
                        <div>
                            <h2 className="font-black text-2xl md:text-3xl text-gray-900 tracking-tight">Popular Cars</h2>
                            <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">Available in 10+ locations</p>
                        </div>
                        <button className="text-black text-sm font-black uppercase tracking-widest hover:underline decoration-4 underline-offset-8">See All</button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64 col-span-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            {filteredCars.map(car => (
                                <div
                                    key={car._id}
                                    onClick={() => navigate(`/car/${car._id}`)}
                                    className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group flex flex-col"
                                >
                                    <div className="aspect-[16/10] mb-3 flex items-center justify-center rounded-2xl overflow-hidden bg-gray-50">
                                        <img
                                            src={car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300'}
                                            alt={car.name}
                                            className="w-full h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    <div className="px-1 text-center">
                                        <h3 className="font-black text-gray-900 text-sm md:text-base tracking-tighter uppercase line-clamp-1">{car.name}</h3>
                                        <div className="mt-1">
                                            <span className="text-blue-600 font-black text-base md:text-lg tracking-tighter">₹{car.pricePer24h || 0}</span>
                                            <span className="text-gray-400 text-[8px] font-bold uppercase tracking-widest ml-1">/ 24h</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {filteredCars.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 mt-8">
                            <Search className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest">No matching vehicles found</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Footer Section */}
            <footer className="max-w-7xl h-1 mx-auto px-4 md:px-8 py-10 pb-36 mt-30 text-center border-t border-gray-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">© 2026 All Rights Reserved</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mt-2 italic flex items-center justify-center gap-2">
                    <span className="w-4 h-[1px] bg-gray-100"></span>
                    Developed by Saketh
                    <span className="w-4 h-[1px] bg-gray-100"></span>
                </p>
            </footer>

            {/* Guest Login Modal */}
            <GuestLoginModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onConfirm={(userData) => {
                    setGuestUser(userData);
                    if (pendingNavCarId) {
                        navigate(`/car/${pendingNavCarId}`);
                    }
                }}
            />
        </div>
    );
};

// No extra imports needed

export default CustomerHome;
