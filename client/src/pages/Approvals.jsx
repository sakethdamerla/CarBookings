import { useEffect, useState, useCallback, useContext } from 'react';
import api from '../utils/api';
import { Check, X, Calendar, User, Truck, Phone, AlertCircle, Loader2, Clock, DollarSign, MapPin } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import moment from 'moment';
import { formatIST, getIST } from '../utils/dateUtils';

const ApprovalModal = ({ booking, onConfirm, onCancel, loading }) => {
    const [rate, setRate] = useState('');
    const startDate = getIST(booking.startDate);
    const endDate = getIST(booking.endDate);
    const duration = moment.duration(endDate.diff(startDate));

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-black text-white relative">
                    <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Check className="text-green-400" size={24} />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Approve Booking</h3>
                    </div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest pl-14">Review details and set the final rate</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                            <p className="font-black text-gray-900">
                                {days > 0 ? `${days}d ` : ''}{hours}h
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
                            <p className="font-black text-gray-900 truncate">{booking.car?.name || 'Manual Selection'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                        <div className="flex items-start gap-4">
                            <div className="mt-1"><Calendar className="w-4 h-4 text-blue-600" /></div>
                            <div className="flex-1 text-xs">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-blue-100/50">
                                    <span className="font-bold text-blue-900 uppercase">Pickup</span>
                                    <span className="font-black text-blue-600">{formatIST(booking.startDate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-900 uppercase">Dropoff</span>
                                    <span className="font-black text-blue-600">{formatIST(booking.endDate)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 pt-4 border-t border-blue-100/50">
                            <div className="mt-1"><MapPin className="w-4 h-4 text-orange-600" /></div>
                            <div className="flex-1 text-xs">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-orange-900 uppercase">Pickup</span>
                                    <span className="font-black text-orange-600 truncate ml-4">{booking.pickupLocation}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-orange-900 uppercase">Dropoff</span>
                                    <span className="font-black text-orange-600 truncate ml-4">{booking.dropLocation}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Final Total Rate (₹)</label>
                        <div className="relative group">
                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="number"
                                placeholder="Enter final amount..."
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="w-full pl-14 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-black text-lg"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(rate)}
                            disabled={loading || !rate}
                            className="flex-[2] py-5 bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-300 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={18} />}
                            Confirm Approval
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Approvals = () => {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const fetchPendingBookings = useCallback(async () => {
        try {
            const { data } = await api.get('/bookings/pending');
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch pending bookings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingBookings();

        // Listen for real-time refresh events
        window.addEventListener('refreshData', fetchPendingBookings);
        return () => window.removeEventListener('refreshData', fetchPendingBookings);
    }, [fetchPendingBookings]);

    const handleAction = async (id, status, totalAmount = null) => {
        if (status === 'rejected' && !window.confirm('Are you sure you want to reject this booking?')) return;

        setActionLoading(id);
        try {
            const payload = { status };
            if (totalAmount !== null) payload.totalAmount = totalAmount;

            await api.put(`/bookings/${id}`, payload);

            // Immediately remove from list and close modal
            setBookings(prev => prev.filter(b => b._id !== id));
            setSelectedBooking(null);

            // The refreshData event from socket will handle other tabs
        } catch (error) {
            console.error(`Failed to ${status} booking:`, error);
            alert(`Failed to ${status} booking`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!user || (user.role !== 'superadmin' && !user.permissions?.includes('approvals'))) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-semibold text-gray-700">Access Denied</h3>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Booking Approvals</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Review and finalize pending vehicle requests</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black bg-black text-white uppercase tracking-widest">
                                        {booking.bookingType.replace('_', ' ')}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Received</span>
                                        <span className="text-xs font-black text-gray-900">
                                            {moment(booking.createdAt).fromNow()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-50">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mr-4">
                                            <User className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                                            <p className="font-black text-gray-900 text-sm">{booking.customerName}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 border border-gray-100 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                <Calendar size={12} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Pickup</span>
                                            </div>
                                            <span className="font-black text-gray-900">{formatIST(booking.startDate, 'DD MMM, HH:mm')}</span>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                <Calendar size={12} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Dropoff</span>
                                            </div>
                                            <span className="font-black text-gray-900">{formatIST(booking.endDate, 'DD MMM, HH:mm')}</span>
                                        </div>
                                    </div>

                                    {booking.car && (
                                        <div className="flex items-center p-3 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                                            <Truck className="w-5 h-5 mr-4 text-blue-600" />
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Requested Car</p>
                                                <p className="font-black text-blue-900 text-sm">{booking.car.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start p-3 bg-orange-50/50 rounded-2xl border border-orange-100/30">
                                        <MapPin className="w-5 h-5 mr-4 text-orange-600 mt-1" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Route details</p>
                                            <p className="font-black text-orange-900 text-sm truncate">{booking.pickupLocation} → {booking.dropLocation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-50 mt-auto">
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        disabled={actionLoading === booking._id}
                                        className="flex-[2] bg-black text-white hover:bg-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-200 flex items-center justify-center active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(booking._id, 'rejected')}
                                        disabled={actionLoading === booking._id}
                                        className="flex-1 bg-gray-50 text-red-600 hover:bg-red-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-300">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Inbox Cleared</p>
                        <p className="text-gray-400 font-medium text-xs mt-2">No pending booking requests at the moment</p>
                    </div>
                )}
            </div>

            {selectedBooking && (
                <ApprovalModal
                    booking={selectedBooking}
                    onConfirm={(rate) => handleAction(selectedBooking._id, 'confirmed', rate)}
                    onCancel={() => setSelectedBooking(null)}
                    loading={actionLoading === selectedBooking._id}
                />
            )}
        </div>
    );
};

export default Approvals;
