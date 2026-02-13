import { useEffect, useState, useCallback, useContext } from 'react';
import api from '../utils/api';
import { Check, X, Calendar, User, Truck, Phone, AlertCircle, Loader2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Approvals = () => {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

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
    }, [fetchPendingBookings]);

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this booking?`)) return;

        setActionLoading(id);
        try {
            await api.put(`/bookings/${id}`, { status });
            // Optimistically update UI
            setBookings(prev => prev.filter(b => b._id !== id));
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
                <h2 className="text-2xl font-bold text-gray-800">Booking Approvals</h2>
                <p className="text-gray-500">Manage pending booking requests</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-95 flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 uppercase tracking-widest">
                                        {booking.bookingType.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold">
                                        {new Date(booking.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-gray-700">
                                        <User className="w-4 h-4 mr-3 text-purple-600" />
                                        <span className="font-bold text-sm">{booking.customerName}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                        <span className="text-xs font-semibold">{booking.mobile}</span>
                                    </div>
                                    <div className="flex items-start text-gray-600">
                                        <Calendar className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                                        <div className="text-xs font-semibold">
                                            <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                                            <div className="text-gray-400 text-[10px] uppercase">to</div>
                                            <div>{new Date(booking.endDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    {booking.car && (
                                        <div className="flex items-center text-gray-600">
                                            <Truck className="w-4 h-4 mr-3 text-blue-600" />
                                            <span className="text-xs font-semibold">{booking.car.name}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-50 mt-auto">
                                    <button
                                        onClick={() => handleAction(booking._id, 'confirmed')}
                                        disabled={actionLoading === booking._id}
                                        className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center active:scale-95"
                                    >
                                        {actionLoading === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(booking._id, 'rejected')}
                                        disabled={actionLoading === booking._id}
                                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center active:scale-95"
                                    >
                                        {actionLoading === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1.5" />}
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <Check className="w-12 h-12 text-gray-200" />
                        </div>
                        <p className="font-semibold">No pending approvals</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Approvals;
