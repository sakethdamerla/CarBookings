import { useEffect, useState, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Car, Calendar, DollarSign, Clock, UserCheck, Info, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import Swal from 'sweetalert2';
import moment from 'moment';
import { formatIST, getIST } from '../utils/dateUtils';
import GuestLoginModal from '../components/GuestLoginModal';

const BookingDetailModal = ({ booking, onClose }) => {
    if (!booking) return null;

    const isCarWithDriver = booking.bookingType === 'car_with_driver';
    const start = getIST(booking.startDate);
    const end = getIST(booking.endDate);
    const duration = moment.duration(end.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 bg-black text-white relative shrink-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Car className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Booking Invoice</h3>
                    </div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest pl-14">Detailed breakdown of your session</p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {booking.status}
                        </span>
                    </div>

                    {/* Route & Vehicle */}
                    <div className="space-y-4">
                        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><MapPin size={16} className="text-black" /></div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Journey Route</p>
                                    <p className="font-black text-gray-900 text-sm">{booking.pickupLocation} → {booking.dropLocation}</p>
                                </div>
                            </div>
                            <div className="h-[1px] bg-gray-200 w-full opacity-50"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-xl shadow-sm"><Clock size={16} className="text-black" /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Duration</p>
                                        <p className="font-black text-gray-900 text-sm">{days > 0 ? `${days}d ` : ''}{hours}h</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking Type</p>
                                    <p className="font-black text-gray-900 text-[10px] uppercase italic">{booking.bookingType.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Section */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 italic">Billing Breakdown</h4>
                        <div className="space-y-4">
                            {isCarWithDriver ? (
                                <>
                                    <div className="flex justify-between items-center px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                            <label className="text-[11px] font-black text-gray-600 uppercase">Vehicle Charges</label>
                                        </div>
                                        <span className="font-black text-gray-900">₹{booking.carRate || '0'}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                                            <label className="text-[11px] font-black text-gray-600 uppercase">Driver Allowance</label>
                                        </div>
                                        <span className="font-black text-gray-900">₹{booking.driverRate || '0'}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                                        <label className="text-[11px] font-black text-gray-600 uppercase">Total Base Fare</label>
                                    </div>
                                    <span className="font-black text-gray-900">₹{booking.totalAmount || 'Awaiting'}</span>
                                </div>
                            )}

                            {booking.extraKmPrice > 0 && (
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                        <label className="text-[11px] font-black text-gray-600 uppercase">Extra Kms Charges</label>
                                    </div>
                                    <span className="font-black text-gray-900">₹{booking.extraKmPrice}</span>
                                </div>
                            )}

                            {booking.extraTimePrice > 0 && (
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                        <label className="text-[11px] font-black text-gray-600 uppercase">Extra Time Charges</label>
                                    </div>
                                    <span className="font-black text-gray-900">₹{booking.extraTimePrice}</span>
                                </div>
                            )}

                            <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-center px-4">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Final Payable</p>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase italic">Inclusive of all taxes</p>
                                </div>
                                <span className="text-4xl font-black text-gray-900 tracking-tighter italic">₹{booking.totalAmount || '---'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 flex items-center gap-3 opacity-50">
                        <Info size={14} className="text-gray-400" />
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">This is a system generated invoice. For any queries contact your provider.</p>
                    </div>
                </div>

                {/* Bottom Action */}
                <div className="p-8 pt-0 mt-auto shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 active:scale-95 transition-all"
                    >
                        Close Bill
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomerBookings = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const guestUser = JSON.parse(localStorage.getItem('guestUser'));
    const userMobile = user?.mobile || guestUser?.mobile;

    const { data: bookings = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['customerBookings', userMobile],
        queryFn: async () => {
            if (!userMobile) return [];
            const { data } = await api.get(`/bookings?mobile=${userMobile}`);
            return data;
        },
        enabled: !!userMobile,
    });

    useEffect(() => {
        // Update timer every second for cancellation countdown
        const timerInterval = setInterval(() => setNow(new Date()), 1000);

        const handleRefresh = () => queryClient.invalidateQueries(['customerBookings', userMobile]);
        window.addEventListener('refreshData', handleRefresh);

        return () => {
            clearInterval(timerInterval);
            window.removeEventListener('refreshData', handleRefresh);
        };
    }, [userMobile, queryClient]);

    const handleCancel = async (e, bookingId) => {
        e.stopPropagation();
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
                queryClient.invalidateQueries(['customerBookings', userMobile]);
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
            case 'confirmed': return 'bg-green-100 text-green-700 font-black';
            case 'approved': return 'bg-green-100 text-green-700 font-black';
            case 'pending': return 'bg-yellow-100 text-yellow-700 font-black';
            case 'cancelled': return 'bg-red-100 text-red-700 font-black';
            case 'completed': return 'bg-blue-100 text-blue-700 font-black';
            default: return 'bg-gray-100 text-gray-700 font-black';
        }
    };

    if (!userMobile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-gray-200">
                        <UserCheck className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 leading-tight">Identity Required</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-relaxed">Please provide your mobile number to view your booking history</p>
                    </div>
                    <button
                        onClick={() => setShowGuestModal(true)}
                        className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 transition-all shadow-2xl shadow-gray-400 active:scale-95"
                    >
                        Enter Name & Mobile
                    </button>
                    <button
                        onClick={() => navigate('/customer/home')}
                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                    >
                        Go back to home
                    </button>
                </div>
                <GuestLoginModal
                    isOpen={showGuestModal}
                    onClose={() => setShowGuestModal(false)}
                    onConfirm={() => {
                        setShowGuestModal(false);
                        // The userMobile will update via storage event or re-render
                        window.location.reload();
                    }}
                />
            </div>
        );
    }

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bookings.map((booking) => {
                            const createdAt = new Date(booking.createdAt);
                            const diffMs = (10 * 60 * 1000) - (now - createdAt);
                            const canCancel = diffMs > 0 && booking.status === 'pending';
                            const minutes = Math.floor(diffMs / 60000);
                            const seconds = Math.floor((diffMs % 60000) / 1000);

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col overflow-hidden relative cursor-pointer active:scale-[0.98]"
                                >
                                    {/* Status & Cancellation Overlay */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className={`text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-widest font-black shadow-sm ${getStatusColor(booking.status)}`}>
                                            {booking.status === 'confirmed' ? 'confirmed' : (booking.status === 'approved' ? 'confirmed' : booking.status)}
                                        </span>
                                    </div>

                                    {/* Top Section: Car Info */}
                                    <div className="p-6 pb-0 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-black group-hover:bg-blue-50 transition-colors border border-gray-100">
                                            <Car className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tighter leading-none mb-1">{booking.car?.name}</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{booking.car?.model}</p>
                                        </div>
                                    </div>

                                    {/* Middle Section: Booking Details */}
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                                                <div className="flex items-center gap-1.5 font-black text-gray-900 text-xs">
                                                    <Clock size={12} className="text-blue-500" />
                                                    {(() => {
                                                        const start = getIST(booking.startDate);
                                                        const end = getIST(booking.endDate);
                                                        const duration = moment.duration(end.diff(start));
                                                        const days = Math.floor(duration.asDays());
                                                        const hours = duration.hours();
                                                        return `${days > 0 ? `${days}d ` : ''}${hours}h`;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</p>
                                                <div className="flex items-center gap-1.5 font-black text-gray-900 text-[10px] uppercase">
                                                    <span className={booking.bookingType === 'car_with_driver' ? 'text-blue-600' : 'text-gray-500'}>
                                                        {booking.bookingType === 'car_with_driver' ? 'With Driver' : 'Car Only'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <Calendar size={12} className="text-gray-300" />
                                                    Pickup
                                                </div>
                                                <span className="text-[11px] font-black text-gray-900 uppercase">
                                                    {formatIST(booking.startDate, 'DD MMM, HH:mm')}
                                                </span>
                                            </div>
                                            <div className="h-[1px] bg-gray-50 w-full"></div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <Calendar size={12} className="text-gray-300" />
                                                    Dropoff
                                                </div>
                                                <span className="text-[11px] font-black text-gray-900 uppercase">
                                                    {formatIST(booking.endDate, 'DD MMM, HH:mm')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 px-2">
                                            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-[8px] font-black text-white">
                                                {booking.owner?.name?.charAt(0) || 'P'}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Provided by: <span className="text-gray-900">{booking.owner?.username || booking.owner?.name || 'Official Provider'}</span>
                                            </span>
                                        </div>

                                        <div className="h-[1px] bg-gray-50 w-full my-1"></div>

                                        <div className="flex justify-between items-center px-2">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</div>
                                            <span className={`font-black tracking-tighter ${!booking.totalAmount ? 'text-orange-500 text-xs italic' : 'text-2xl text-gray-900'}`}>
                                                {booking.totalAmount ? `₹${booking.totalAmount}` : 'Awaiting Rate'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Section */}
                                    {canCancel && (
                                        <div className="mt-auto p-6 pt-0">
                                            <div className="bg-gray-900 rounded-3xl p-5 space-y-4 shadow-lg">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                                    <span>Action window</span>
                                                    <span className="flex items-center gap-1.5 text-white bg-white/10 px-3 py-1 rounded-full border border-white/5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleCancel(e, booking._id)}
                                                    className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl"
                                                >
                                                    Cancel My Booking
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar for Cancellation */}
                                    {canCancel && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                                            <div
                                                className="h-full bg-red-500 transition-all duration-1000"
                                                style={{ width: `${(diffMs / (10 * 60 * 1000)) * 100}%` }}
                                            ></div>
                                        </div>
                                    )}
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

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
};

export default CustomerBookings;
