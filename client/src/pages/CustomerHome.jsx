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
                            <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">Handpicked for you</p>
                        </div>
                        <button className="text-black text-sm font-black uppercase tracking-widest hover:underline decoration-4 underline-offset-8">See All</button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64 col-span-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filteredCars.map(car => (
                                <div
                                    key={car._id}
                                    onClick={() => navigate(`/car/${car._id}`)}
                                    className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full flex items-center font-black text-[10px] md:text-xs uppercase tracking-tighter">
                                            <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                            <span>4.9</span>
                                        </div>
                                        <button className="bg-white/80 p-2.5 rounded-2xl shadow-sm text-gray-200 hover:text-red-500 transition-all backdrop-blur-sm">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="aspect-[16/9] mb-4 flex items-center justify-center relative z-10 rounded-2xl overflow-hidden">
                                        <img
                                            src={car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300'}
                                            alt={car.name}
                                            className="w-full h-full object-cover drop-shadow-2xl transition-all duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                                                    {car.type}
                                                </div>
                                                <h3 className="font-black text-gray-900 text-xl md:text-2xl tracking-tighter uppercase">{car.name}</h3>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-black font-black text-xl md:text-2xl tracking-tighter">₹{car.pricePer24h || 0}</div>
                                                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest -mt-1">/ 24h</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 py-3 border-y border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                                    <Settings2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{car.transmission}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                                    <Fuel className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{car.fuelType}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const storedGuest = localStorage.getItem('guestUser');
                                                if (!storedGuest && !user) {
                                                    setPendingNavCarId(car._id);
                                                    setShowGuestModal(true);
                                                } else {
                                                    navigate(`/car/${car._id}`);
                                                }
                                            }}
                                            className="w-full mt-4 py-3 md:py-4 bg-black text-white rounded-[1.25rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 overflow-hidden relative group/btn"
                                        >
                                            <span className="relative z-10">Book This Vehicle</span>
                                            <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                        </button>
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
