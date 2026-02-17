import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Share2, Heart, Star, ChevronRight, Check, ShieldCheck, Zap, Fuel, Users, Settings2, Compass, Info } from 'lucide-react';

const CarDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get(`/cars/${id}`);
                setCar(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!car) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Vehicle not found</div>;

    return (
        <div className="pb-32 bg-white">
            <div className="bg-black text-white p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[4rem] sticky top-0 z-30 shadow-xl">
                <div className="max-w-7xl mx-auto flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-6 p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 group">
                        <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic">{car.name}</h1>
                        <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">{car.model}</p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-16">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    {/* Image Section */}
                    <div className="lg:w-3/5 space-y-8">
                        <div className="aspect-[16/10] bg-gray-50 rounded-[3rem] border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 to-transparent"></div>
                            <img
                                src={car.images?.[0] || 'https://via.placeholder.com/600'}
                                alt={car.name}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="lg:w-2/5 space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest leading-none">
                                    {car.type}
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Daily Rate</div>
                                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-none">₹{car.pricePer24h}</div>
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3 mb-4">
                                <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-orange-700 uppercase tracking-tight">Pricing Notice</p>
                                    <p className="text-[10px] md:text-xs text-orange-600 font-medium leading-relaxed">
                                        The rate shown is for 24 hours. The final total amount will be calculated and provided by the admin after booking approval.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 mb-8">
                                <Compass className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-blue-700 uppercase tracking-tight">Mileage Limit</p>
                                    <p className="text-[10px] md:text-xs text-blue-600 font-medium leading-relaxed">
                                        Includes <span className="font-bold">300 km</span> per day. Exceeding this limit will incur additional charges as per the extra kilometer rate.
                                    </p>
                                </div>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 uppercase">Specifications</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Fuel, label: 'Fuel Type', value: car.fuelType },
                                { icon: Zap, label: 'Transmission', value: car.transmission },
                                { icon: Users, label: 'Capacity', value: `${car.seats || 5} Seats` },
                                { icon: Compass, label: 'Drive', value: 'Auto-Smart' },
                            ].map((spec, i) => (
                                <div key={i} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                        <div className="text-gray-400 group-hover:text-blue-600 transition-colors">{spec.icon && <spec.icon className="w-6 h-6" />}</div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                                    <p className="font-black text-gray-900 uppercase tracking-tight">{spec.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Booking Action - Large Screens */}
                        <div className="hidden lg:block pt-10">
                            <button
                                onClick={() => navigate(`/book/${car._id}`)}
                                className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-400 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Secure Booking
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Sticky Action - Mobile Only */}
            <div className="lg:hidden fixed bottom-24 left-4 right-4 z-40">
                <button
                    onClick={() => navigate(`/book/${car._id}`)}
                    className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-95"
                >
                    Book for ₹{car.pricePer24h}
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
            </div>
        </div>
    );
};

export default CarDetails;
