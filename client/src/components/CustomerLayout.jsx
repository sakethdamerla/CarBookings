import { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Calendar, User, Home, LogOut } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const CustomerLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleNav = (path) => {
        navigate(path);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center">
            {/* Main Content Area - Centered with max-width for desktop */}
            <div className="w-full max-w-[1400px] flex-1 flex flex-col relative">
                <main className="flex-1 w-full">
                    <Outlet />
                </main>

                {/* Bottom Navigation - Unified for all pages */}
                <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none pb-4 md:pb-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 py-3 px-6 flex justify-between items-center text-gray-400 shadow-2xl rounded-full w-[92%] max-w-lg pointer-events-auto transition-all duration-300 gap-2">
                        <button
                            onClick={() => handleNav('/customer/home')}
                            className={`flex flex-col items-center transition-all active:scale-90 ${isActive('/customer/home') ? 'text-black scale-110' : 'hover:text-gray-600'}`}
                        >
                            <Home className={`w-6 h-6 mb-1 ${isActive('/customer/home') ? 'text-black' : ''}`} />
                            <span className="text-[10px] font-bold">Home</span>
                        </button>

                        <button
                            onClick={() => handleNav('/customer/explore')}
                            className={`flex flex-col items-center transition-all active:scale-90 ${isActive('/customer/explore') ? 'text-black scale-110' : 'hover:text-gray-600'}`}
                        >
                            <MapPin className={`w-6 h-6 mb-1 ${isActive('/customer/explore') ? 'text-black' : ''}`} />
                            <span className={`text-[10px] ${isActive('/customer/explore') ? 'font-bold' : ''}`}>Explore</span>
                        </button>

                        <button
                            onClick={() => handleNav('/customer/bookings')}
                            className={`flex flex-col items-center transition-all active:scale-90 ${isActive('/customer/bookings') ? 'text-black scale-110' : 'hover:text-gray-600'}`}
                        >
                            <Calendar className={`w-6 h-6 mb-1 ${isActive('/customer/bookings') ? 'text-black' : ''}`} />
                            <span className={`text-[10px] ${isActive('/customer/bookings') ? 'font-bold' : ''}`}>Bookings</span>
                        </button>

                        <button
                            onClick={() => handleNav('/customer/profile')}
                            className={`flex flex-col items-center transition-all active:scale-90 ${isActive('/customer/profile') ? 'text-black scale-110' : 'hover:text-gray-600'}`}
                        >
                            <User className={`w-6 h-6 mb-1 ${isActive('/customer/profile') ? 'text-black' : ''}`} />
                            <span className={`text-[10px] ${isActive('/customer/profile') ? 'font-bold' : ''}`}>Profile</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerLayout;
