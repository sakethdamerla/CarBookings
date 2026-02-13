import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Calendar, Clock, ChevronRight, Check, Star, MapPin, UserCheck, Car } from 'lucide-react';
import GuestLoginModal from '../components/GuestLoginModal';
import Swal from 'sweetalert2';

const BookCar = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestUser, setGuestUser] = useState(JSON.parse(localStorage.getItem('guestUser')));

    // Selection State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [endTime, setEndTime] = useState('18:00');
    const [bookingType, setBookingType] = useState('car_only');

    const [pickupLocation, setPickupLocation] = useState('');
    const [dropLocation, setDropLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [carRes, bookingsRes] = await Promise.all([
                    api.get(`/cars/${id}`),
                    api.get(`/bookings/car/${id}/availability`)
                ]);
                setCar(carRes.data);
                setBookings(bookingsRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!car) return <div className="min-h-screen flex items-center justify-center">Car not found</div>;

    const handleBooking = async () => {
        const storedGuest = localStorage.getItem('guestUser');
        if (!storedGuest) {
            setShowGuestModal(true);
            return;
        }

        if (!pickupLocation) {
            setError('Please enter pickup location');
            setTimeout(() => {
                document.getElementById('booking-details')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }
        if (bookingType === 'car_with_driver' && !dropLocation) {
            setError('Please enter drop location');
            setTimeout(() => {
                document.getElementById('booking-details')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const payload = {
                customerName: guestUser?.name,
                mobile: guestUser?.mobile,
                bookingType: bookingType,
                car: car._id,
                startDate: `${startDate}T${startTime}`,
                endDate: `${endDate}T${endTime}`,
                pickupLocation: pickupLocation,
                dropLocation: bookingType === 'car_only' ? pickupLocation : dropLocation
            };

            await api.post('/bookings', payload);

            await Swal.fire({
                title: 'Booking Requested!',
                text: 'Your request is received. The final price will be calculated and shared by the Admin shortly.',
                icon: 'success',
                confirmButtonColor: '#2563EB',
                confirmButtonText: 'Great!'
            });

            navigate('/customer-home');
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    const checkAvailability = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayBookings = bookings.filter(b => {
            const start = new Date(b.startDate).toISOString().split('T')[0];
            const end = new Date(b.endDate).toISOString().split('T')[0];
            return dateStr >= start && dateStr <= end;
        });

        if (dayBookings.length === 0) return 'available';

        // Check if there's any gap in a 24h period (simplified logic)
        // For now, if there's at least one booking, we call it semi-booked unless it covers a vast range
        // A more complex check would look for a total of 15+ hours booked
        const totalMinutes = dayBookings.reduce((acc, b) => {
            const s = new Date(b.startDate);
            const e = new Date(b.endDate);
            // Limit range to the current dayStr
            const dayStart = new Date(`${dateStr}T00:00:00`);
            const dayEnd = new Date(`${dateStr}T23:59:59`);
            const rangeStart = s < dayStart ? dayStart : s;
            const rangeEnd = e > dayEnd ? dayEnd : e;
            return acc + (rangeEnd - rangeStart) / (1000 * 60);
        }, 0);

        if (totalMinutes >= 20 * 60) return 'booked'; // Consider >20h as fully booked
        return 'semi-booked';
    };

    const getBookedIntervals = () => {
        return bookings.filter(b => {
            const bStart = new Date(b.startDate).toISOString().split('T')[0];
            const bEnd = new Date(b.endDate).toISOString().split('T')[0];
            // Show intervals if they involve either the start or end date selected
            return startDate === bStart || startDate === bEnd || endDate === bStart || endDate === bEnd;
        }).map(b => ({
            start: new Date(b.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            end: new Date(b.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        })).sort((a, b) => a.start.localeCompare(b.start));
    };

    const calculateDuration = () => {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        const diff = end - start;
        if (diff <= 0) return "Invalid period";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days} day${days > 1 ? 's' : ''} ${remainingHours > 0 ? `${remainingHours}h` : ''}`;
        }
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    };

    const bookedIntervals = getBookedIntervals();

    return (
        <div className="pb-32 bg-white">
            {/* Header */}
            <div className="bg-black text-white p-6 md:p-10 sticky top-0 z-30 shadow-xl rounded-b-[2.5rem] md:rounded-b-[4rem]">
                <div className="max-w-7xl mx-auto flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-6 p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 group">
                        <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic">Set Schedule</h1>
                        <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none mt-1">Configure your booking</p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-16">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                    {/* Left Column: Selection & Form */}
                    <div className="lg:w-3/5 space-y-8">
                        {/* Dates Selection */}
                        <div className="bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-xl md:text-2xl tracking-tighter uppercase">Select Dates</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">When do you need the car?</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            if (e.target.value > endDate) setEndDate(e.target.value);
                                        }}
                                        className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                                    <input
                                        type="date"
                                        min={startDate}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pick Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Already Booked Alerts */}
                        {bookedIntervals.length > 0 && (
                            <div className="bg-orange-50/50 p-8 rounded-[3rem] border border-orange-100 animate-in fade-in duration-500">
                                <h4 className="text-xs font-black text-orange-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Already Booked for these dates
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {bookedIntervals.map((interval, i) => (
                                        <div key={i} className="bg-white px-5 py-3 rounded-2xl border border-orange-200 shadow-sm flex items-center gap-2">
                                            <span className="text-sm font-black text-orange-600">{interval.start} - {interval.end}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Details */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                            <div>
                                <h3 className="font-black text-gray-900 text-xl tracking-tighter uppercase">Delivery Details</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Where should we handle the car?</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pickup Address</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Enter full address for pickup"
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {bookingType === 'car_with_driver' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Drop Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Enter full address for drop"
                                                value={dropLocation}
                                                onChange={(e) => setDropLocation(e.target.value)}
                                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary & Confirmation */}
                    <div className="lg:w-2/5 space-y-8">
                        {/* Car Summary */}
                        <div className="bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                            <div className="relative z-10 flex items-center gap-6 mb-8 pb-8 border-b border-white/10 text-left">
                                <div className="w-24 h-24 bg-white/10 rounded-[2rem] p-3 backdrop-blur-md flex items-center justify-center">
                                    <img src={car.images?.[0]} className="w-full h-full object-contain drop-shadow-2xl" alt="" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter">{car.name}</h4>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{car.model}</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-left">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Duration</p>
                                        <p className="text-3xl font-black tracking-tighter uppercase">{calculateDuration()}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Clock className="w-7 h-7 text-white" />
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4 text-left">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Base Amount</span>
                                        <span className="font-black text-xl tracking-tighter italic">₹{car.pricePer24h} / 24h</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pricing Type</span>
                                        <span className="text-xs font-black bg-blue-500 px-3 py-1 rounded-lg uppercase">Daily rate applies</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Driver Choice */}
                        <div
                            onClick={() => setBookingType(bookingType === 'car_only' ? 'car_with_driver' : 'car_only')}
                            className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer group flex items-center gap-6 ${bookingType === 'car_with_driver' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all ${bookingType === 'car_with_driver' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {bookingType === 'car_with_driver' ? <UserCheck className="w-8 h-8" /> : <Car className="w-8 h-8" />}
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-black text-gray-900 text-lg md:text-xl tracking-tighter uppercase">Chauffeur Service</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Professional drivers available</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-all relative ${bookingType === 'car_with_driver' ? 'bg-black' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bookingType === 'car_with_driver' ? 'left-7' : 'left-1'}`}></div>
                            </div>
                        </div>

                        {/* Action - Desktop */}
                        <div className="hidden lg:block pt-10">
                            <button
                                onClick={handleBooking}
                                disabled={isSubmitting}
                                className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 group ${isSubmitting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-black text-white shadow-gray-400 hover:bg-blue-600 active:scale-95'}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Confirm Reservation
                                        <Check className="w-6 h-6 stroke-[3px]" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Action - Mobile Only */}
            <div className="lg:hidden fixed bottom-24 left-4 right-4 z-40">
                <button
                    onClick={handleBooking}
                    disabled={isSubmitting}
                    className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white'}`}
                >
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            Confirm Booking
                            <Check className="w-6 h-6 stroke-[3px]" />
                        </>
                    )}
                </button>
            </div>

            <GuestLoginModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onConfirm={(userData) => {
                    setGuestUser(userData);
                }}
            />
        </div>
    );
};

export default BookCar;
