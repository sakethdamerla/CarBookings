import { useEffect, useState, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Star, Heart, Fuel, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import GuestLoginModal from '../components/GuestLoginModal';

const Explore = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestUser, setGuestUser] = useState(JSON.parse(localStorage.getItem('guestUser')));
    const [pendingNavCarId, setPendingNavCarId] = useState(null);

    const { data: cars = [], isLoading: loading } = useQuery({
        queryKey: ['availableCars'],
        queryFn: async () => {
            const { data } = await api.get('/cars');
            return data.filter(c => c.status === 'available');
        },
    });

    useEffect(() => {
        const handleRefresh = () => queryClient.invalidateQueries(['availableCars']);
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
    }, [queryClient]);

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-32">
            <div className="bg-black text-white p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[3.5rem] sticky top-0 z-20 shadow-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-8">
                        <button onClick={() => navigate('/customer-home')} className="mr-6 p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95 group">
                            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">Explore</h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Discover your perfect ride</p>
                        </div>
                    </div>
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
                        <input
                            type="text"
                            placeholder="Search model, brand or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 md:py-5 bg-white text-gray-800 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 placeholder:text-gray-400 transition-all text-sm md:text-base font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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

export default Explore;
