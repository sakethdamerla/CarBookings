import { useEffect, useState, useContext } from 'react';
import { ArrowLeft, Car, Calendar, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import Swal from 'sweetalert2';

const CustomerBookings = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    const guestUser = JSON.parse(localStorage.getItem('guestUser'));
    const userMobile = user?.mobile || guestUser?.mobile;

    const fetchBookings = async () => {
        try {
            if (userMobile) {
                const { data } = await api.get(`/bookings?mobile=${userMobile}`);
                setBookings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        // Update timer every second
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [userMobile]);

    const handleCancel = async (bookingId) => {
        const result = await Swal.fire({
            title: 'Cancel Booking?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/bookings/${bookingId}/cancel`);
                await Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
                fetchBookings();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to cancel', 'error');
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="pb-32">
            <div className="bg-white p-6 md:p-10 sticky top-0 z-10 shadow-sm flex items-center mb-8 border-b border-gray-100">
                <div className="max-w-7xl mx-auto w-full flex items-center">
                    <button onClick={() => navigate('/customer/home')} className="mr-6 p-2 hover:bg-gray-50 rounded-full transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-gray-800 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">My Bookings</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => {
                            const createdAt = new Date(booking.createdAt);
                            const diffMs = (10 * 60 * 1000) - (now - createdAt);
                            const canCancel = diffMs > 0 && booking.status === 'pending';
                            const minutes = Math.floor(diffMs / 60000);
                            const seconds = Math.floor((diffMs % 60000) / 1000);

                            return (
                                <div key={booking._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                                    {canCancel && (
                                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gray-50">
                                            <div
                                                className="h-full bg-black transition-all duration-1000"
                                                style={{ width: `${(diffMs / (10 * 60 * 1000)) * 100}%` }}
                                            ></div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-black group-hover:bg-blue-50 transition-colors">
                                                <Car className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 text-lg md:text-xl uppercase tracking-tighter leading-none mb-1">{booking.car?.name}</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{booking.car?.model}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mt-auto">
                                        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <span className="tracking-tight uppercase">
                                                {new Date(booking.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(booking.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end pt-2">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</div>
                                            <span className={`font-black tracking-tighter ${!booking.totalAmount ? 'text-orange-500 text-xs text-right italic' : 'text-2xl text-gray-900'}`}>
                                                {booking.totalAmount ? `₹${booking.totalAmount}` : 'Admin will update rate'}
                                            </span>
                                        </div>

                                        {canCancel && (
                                            <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col gap-4">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
                                                    <span>Action window</span>
                                                    <span className="flex items-center gap-1.5 text-black">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleCancel(booking._id)}
                                                    className="w-full py-4 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest border border-red-50 hover:bg-red-100 hover:border-red-200 transition-all active:scale-95"
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-gray-100">
                        <Clock className="w-20 h-20 mx-auto mb-6 text-gray-100" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Your booking history is empty</p>
                        <button
                            onClick={() => navigate('/customer/explore')}
                            className="mt-8 px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all active:scale-95"
                        >
                            Explore Cars
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerBookings;
