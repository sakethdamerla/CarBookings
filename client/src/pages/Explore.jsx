import { useEffect, useState, useContext } from 'react';
import { ArrowLeft, Search, Star, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import GuestLoginModal from '../components/GuestLoginModal';

const Explore = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestUser, setGuestUser] = useState(JSON.parse(localStorage.getItem('guestUser')));
    const [pendingNavCarId, setPendingNavCarId] = useState(null);

    const fetchCars = async () => {
        try {
            const { data } = await api.get('/cars');
            setCars(data.filter(c => c.status === 'available'));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCars();
        const interval = setInterval(fetchCars, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-32">
            <div className="bg-black text-white p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[3.5rem] sticky top-0 z-20 shadow-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-8">
                        <button onClick={() => navigate('/customer/home')} className="mr-6 p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95 group">
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

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {filteredCars.map(car => (
                    <div
                        key={car._id}
                        onClick={() => navigate(`/car/${car._id}`)}
                        className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-black/5 transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="aspect-[16/10] mb-6 bg-gray-50 rounded-[2rem] overflow-hidden relative border border-gray-100 flex items-center justify-center p-6 group-hover:bg-gray-100/50 transition-colors">
                            <img
                                src={car.images && car.images.length > 0 ? car.images[0] : 'https://via.placeholder.com/300'}
                                alt={car.name}
                                className="w-full h-full object-cover drop-shadow-2xl transition-all duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-xl text-xs md:text-sm font-black shadow-xl tracking-tight">
                                ₹{car.pricePer24h || 0}
                            </div>
                        </div>
                        <div className="px-2 mt-auto">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-black text-gray-900 text-xl md:text-2xl leading-none uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{car.name}</h3>
                                <div className="flex items-center text-orange-400 text-xs font-black bg-orange-50 px-2 py-1 rounded-lg">
                                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                    <span>4.9</span>
                                </div>
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mb-6">{car.model}</p>

                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                {[car.type, car.transmission, car.fuelType].map((tag, i) => (
                                    <span key={i} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:bg-white transition-colors">{tag}</span>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    className="py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 active:scale-95"
                                >
                                    Specs
                                </button>
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
                                    className="py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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

export default Explore;
