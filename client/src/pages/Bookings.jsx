import { useState, useEffect, useCallback, useContext } from 'react';
import PageLoader from '../components/PageLoader';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Calendar as CalendarIcon,
    List,
    Plus,
    Search,
    Filter,
    Car as CarIcon,
    User,
    Phone,
    Clock,
    ArrowUpRight,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MapPin,
    Save
} from 'lucide-react';
import api from '../utils/api';
import { formatIST, getIST } from '../utils/dateUtils';
import AdminFilter from '../components/AdminFilter';
import AuthContext from '../context/AuthContext';

const localizer = momentLocalizer(moment);

const Bookings = () => {
    const { user } = useContext(AuthContext);
    const [ownerId, setOwnerId] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('calendar'); // 'list' or 'calendar'
    const [showForm, setShowForm] = useState(false);
    const [selectedDateBookings, setSelectedDateBookings] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Track specific booking ID being updated
    const [extraChargeModal, setExtraChargeModal] = useState(null); // Stores the booking object
    const [extraChargeType, setExtraChargeType] = useState('kms'); // 'kms' or 'time'
    const [extraChargeData, setExtraChargeData] = useState({ kms: '', pricePerKm: '', hours: '', pricePerHour: '' });

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/bookings', { params: { ownerId } });
            setBookings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ownerId]);

    useEffect(() => {
        fetchBookings();

        // Listen for real-time refresh events
        window.addEventListener('refreshData', fetchBookings);
        return () => window.removeEventListener('refreshData', fetchBookings);
    }, [fetchBookings]);

    // Transform bookings for Calendar - Filter out cancelled/rejected ones
    const calendarEvents = bookings
        .filter(b => !['cancelled', 'rejected'].includes(b.status))
        .map(b => ({
            id: b._id,
            title: `${b.customerName} (${b.bookingType === 'driver_only' ? 'Driver' : b.bookingType === 'car_only' ? 'Car' : 'Both'})`,
            start: new Date(b.startDate),
            end: new Date(b.endDate),
            resource: b,
            allDay: false
        }));

    const handleSelectEvent = (event) => {
        setSelectedDateBookings([event.resource]);
    };

    const handleSelectSlot = (slotInfo) => {
        // Find bookings that overlap with the selected slot (day)
        const dayBookings = bookings.filter(b =>
            getIST(b.startDate).isSame(slotInfo.start, 'day') ||
            getIST(b.endDate).isSame(slotInfo.start, 'day') ||
            getIST(slotInfo.start).isBetween(b.startDate, b.endDate, 'day', '[]')
        );

        if (dayBookings.length > 0) {
            setSelectedDateBookings(dayBookings);
        }
    };

    const handleStatusUpdate = async (id, status, currentAmount) => {
        let finalAmount = currentAmount;

        if (status === 'confirmed') {
            const amountInput = prompt("Enter Final Total Amount (₹):", currentAmount || 0);
            if (amountInput === null) return; // Cancelled
            finalAmount = amountInput;
        }

        try {
            setActionLoading(id);
            await api.put(`/bookings/${id}`, { status, totalAmount: finalAmount });

            // Close the modal after success
            setSelectedDateBookings(null);

            // Refresh data
            fetchBookings();
        } catch (error) {
            console.error(error);
            alert("Failed to update booking status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAmountUpdate = async (id, amount) => {
        try {
            await api.put(`/bookings/${id}`, { totalAmount: amount });
            fetchBookings();
            setSelectedDateBookings(prev => prev ? prev.map(b => b._id === id ? { ...b, totalAmount: amount } : b) : null);
        } catch (error) {
            console.error('Failed to update amount:', error);
        }
    };

    const handleExtraCharges = async () => {
        if (!extraChargeModal || !extraChargeData.kms || !extraChargeData.pricePerKm) return;

        const extraAmount = parseFloat(extraChargeData.kms) * parseFloat(extraChargeData.pricePerKm);
        const newTotal = (extraChargeModal.totalAmount || 0) + extraAmount;

        try {
            setActionLoading(extraChargeModal._id);
            await api.put(`/bookings/${extraChargeModal._id}`, { totalAmount: newTotal });

            // Refresh and close modals
            fetchBookings();
            setExtraChargeModal(null);
            setExtraChargeData({ kms: '', pricePerKm: '', hours: '', pricePerHour: '' });
            setSelectedDateBookings(null);
        } catch (error) {
            console.error('Failed to add extra charges:', error);
            alert("Failed to add extra charges");
        } finally {
            setActionLoading(null);
        }
    };

    const handleExtraTimeCharges = async () => {
        if (!extraChargeModal || !extraChargeData.hours || !extraChargeData.pricePerHour) return;

        const extraAmount = parseFloat(extraChargeData.hours) * parseFloat(extraChargeData.pricePerHour);
        const newTotal = (extraChargeModal.totalAmount || 0) + extraAmount;

        try {
            setActionLoading(extraChargeModal._id);
            await api.put(`/bookings/${extraChargeModal._id}`, { totalAmount: newTotal });

            fetchBookings();
            setExtraChargeModal(null);
            setExtraChargeData({ kms: '', pricePerKm: '', hours: '', pricePerHour: '' });
            setSelectedDateBookings(null);
        } catch (error) {
            console.error('Failed to add extra time charges:', error);
            alert("Failed to add extra charges");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Booking Management</h2>
                        <p className="text-sm text-gray-500 font-medium">Schedule and track vehicle reservations</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-200 hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-sm font-bold flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Booking
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100">
                    <div className="flex-1">
                        {user?.role === 'superadmin' && (
                            <AdminFilter onFilterChange={setOwnerId} selectedAdminId={ownerId} />
                        )}
                    </div>
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex">
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex-1 px-4 py-2 rounded-xl flex items-center justify-center transition-all text-xs font-bold uppercase tracking-widest ${view === 'calendar' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5 mr-2" /> Calendar
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`flex-1 px-4 py-2 rounded-xl flex items-center justify-center transition-all text-xs font-bold uppercase tracking-widest ${view === 'list' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <List className="w-3.5 h-3.5 mr-2" /> List View
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <BookingForm onClose={() => setShowForm(false)} onSuccess={fetchBookings} />
            )}

            {/* Booking Details Modal */}
            {selectedDateBookings && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 transform transition-all scale-100 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
                            <button onClick={() => setSelectedDateBookings(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {selectedDateBookings.map(booking => (
                                <div key={booking._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {booking.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{booking.customerName}</h4>
                                                <p className="text-xs text-gray-500">{booking.mobile}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2 flex justify-between items-center">
                                                <span>Vehicle & Driver</span>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${booking.bookingType === 'car_with_driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {booking.bookingType === 'car_with_driver' ? 'With Driver' : 'Car Only'}
                                                </span>
                                            </p>
                                            <div className="space-y-1">
                                                {booking.car && <div className="flex items-center text-gray-700 font-medium"><CarIcon className="w-3.5 h-3.5 mr-2 text-blue-500" /> {booking.car.name}</div>}
                                                {booking.driver && <div className="flex items-center text-gray-700 font-medium"><User className="w-3.5 h-3.5 mr-2 text-green-500" /> {booking.driver.name}</div>}
                                                {!booking.car && !booking.driver && <span className="text-gray-400 italic">No resources assigned</span>}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Handling Location</p>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-start text-gray-700">
                                                    <MapPin className="w-3 h-3 mr-2 text-orange-500 mt-0.5" />
                                                    <span className="font-semibold uppercase text-[10px] mr-1">Pickup:</span>
                                                    {booking.pickupLocation}
                                                </div>
                                                <div className="flex items-start text-gray-700">
                                                    <MapPin className="w-3 h-3 mr-2 text-red-500 mt-0.5" />
                                                    <span className="font-semibold uppercase text-[10px] mr-1">Drop:</span>
                                                    {booking.dropLocation}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-100 md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Schedule & Timestamps</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] md:text-xs">
                                                <div className="flex items-start text-gray-700">
                                                    <Clock className="w-3 h-3 mr-2 text-blue-500 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold uppercase block text-gray-400">Pickup Time:</span>
                                                        <span className="font-black">{moment(booking.startDate).format('DD MMM, YYYY - hh:mm A')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start text-gray-700">
                                                    <Clock className="w-3 h-3 mr-2 text-indigo-500 mt-0.5" />
                                                    <div>
                                                        <span className="font-bold uppercase block text-gray-400">Drop Time:</span>
                                                        <span className="font-black">{moment(booking.endDate).format('DD MMM, YYYY - hh:mm A')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-col gap-3">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-bold">₹</span>
                                                {booking.status === 'pending' ? (
                                                    <input
                                                        type="number"
                                                        className="w-24 p-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                                                        defaultValue={booking.totalAmount || ''}
                                                        onBlur={(e) => {
                                                            const newAmount = e.target.value;
                                                            if (newAmount !== booking.totalAmount?.toString()) {
                                                                handleAmountUpdate(booking._id, newAmount);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="font-black text-lg text-gray-900">
                                                        {booking.totalAmount?.toLocaleString() || '0'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap justify-end gap-2">
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'confirmed', booking.totalAmount)}
                                                    disabled={actionLoading === booking._id}
                                                    className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading === booking._id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        'Approve Reservation'
                                                    )}
                                                </button>
                                            )}

                                            {booking.status === 'confirmed' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setExtraChargeType('kms');
                                                            setExtraChargeModal(booking);
                                                        }}
                                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        Extra KMS
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setExtraChargeType('time');
                                                            setExtraChargeModal(booking);
                                                        }}
                                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        Extra Time
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking._id, 'completed', booking.totalAmount)}
                                                        disabled={actionLoading === booking._id}
                                                        className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === booking._id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            'Mark Completed'
                                                        )}
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'completed' && (
                                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                    <Check className="w-3 h-3" /> Job Completed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Extra Charges Modal */}
            {extraChargeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in zoom-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-sm overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className={`p-8 text-center relative ${extraChargeType === 'kms' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-purple-600 to-pink-700'}`}>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
                                {extraChargeType === 'kms' ? <MapPin className="w-10 h-10 text-white" /> : <Clock className="w-10 h-10 text-white" />}
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Extra {extraChargeType === 'kms' ? 'Distance' : 'Time'}</h3>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Calculate additional costs</p>

                            <button
                                onClick={() => setExtraChargeModal(null)}
                                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {extraChargeType === 'kms' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Extra KMs Driven</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="number"
                                                placeholder="e.g. 50"
                                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-blue-600 outline-none font-black text-gray-900 transition-all shadow-inner"
                                                value={extraChargeData.kms}
                                                onChange={(e) => setExtraChargeData({ ...extraChargeData, kms: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Price per KM (₹)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 group-focus-within:text-blue-600">₹</div>
                                            <input
                                                type="number"
                                                placeholder="e.g. 15"
                                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-blue-600 outline-none font-black text-gray-900 transition-all shadow-inner"
                                                value={extraChargeData.pricePerKm}
                                                onChange={(e) => setExtraChargeData({ ...extraChargeData, pricePerKm: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Extra Hours Used</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                            <input
                                                type="number"
                                                placeholder="e.g. 3"
                                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-purple-600 outline-none font-black text-gray-900 transition-all shadow-inner"
                                                value={extraChargeData.hours}
                                                onChange={(e) => setExtraChargeData({ ...extraChargeData, hours: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Price per Hour (₹)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 group-focus-within:text-purple-600">₹</div>
                                            <input
                                                type="number"
                                                placeholder="e.g. 200"
                                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-purple-600 outline-none font-black text-gray-900 transition-all shadow-inner"
                                                value={extraChargeData.pricePerHour}
                                                onChange={(e) => setExtraChargeData({ ...extraChargeData, pricePerHour: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Summary View */}
                            {((extraChargeType === 'kms' && extraChargeData.kms && extraChargeData.pricePerKm) ||
                                (extraChargeType === 'time' && extraChargeData.hours && extraChargeData.pricePerHour)) && (
                                    <div className={`p-6 rounded-[2rem] border-2 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300 ${extraChargeType === 'kms' ? 'bg-blue-50 border-blue-100 shadow-lg shadow-blue-500/10' : 'bg-purple-50 border-purple-100 shadow-lg shadow-purple-500/10'}`}>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Added Total</p>
                                            <p className={`text-2xl font-black ${extraChargeType === 'kms' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                ₹{extraChargeType === 'kms'
                                                    ? (parseFloat(extraChargeData.kms) * parseFloat(extraChargeData.pricePerKm)).toLocaleString()
                                                    : (parseFloat(extraChargeData.hours) * parseFloat(extraChargeData.pricePerHour)).toLocaleString()
                                                }
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-2xl ${extraChargeType === 'kms' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setExtraChargeModal(null)}
                                    className="py-5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={extraChargeType === 'kms' ? handleExtraCharges : handleExtraTimeCharges}
                                    disabled={actionLoading ||
                                        (extraChargeType === 'kms' ? (!extraChargeData.kms || !extraChargeData.pricePerKm) : (!extraChargeData.hours || !extraChargeData.pricePerHour))}
                                    className={`py-5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all active:scale-95 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2 ${extraChargeType === 'kms' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'}`}
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden min-h-[500px] p-2 md:p-8">
                {loading ? (
                    <PageLoader />
                ) : view === 'calendar' ? (
                    <div className="h-[450px] md:h-[750px] booking-calendar text-[10px] md:text-sm">
                        <BigCalendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', fontFamily: 'inherit' }}
                            eventPropGetter={(event) => {
                                let bgColor = '#3b82f6'; // blue
                                if (event.resource.bookingType === 'driver_only') bgColor = '#10b981'; // green
                                if (event.resource.status === 'completed') bgColor = '#6366f1'; // indigo
                                if (event.resource.status === 'cancelled') bgColor = '#ef4444'; // red

                                return {
                                    className: 'rounded-lg border-0 shadow-sm opacity-90 hover:opacity-100 transition-all hover:scale-[1.02]',
                                    style: { backgroundColor: bgColor }
                                };
                            }}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                            views={['month']}
                            defaultView="month"
                            components={{
                                event: ({ event }) => (
                                    <div className="flex flex-col gap-0.5 p-1 overflow-hidden leading-tight">
                                        <span className="font-bold truncate text-[8px] md:text-[10px] uppercase tracking-tighter">{event.resource.customerName}</span>
                                        <span className="text-[7px] md:text-[8px] opacity-80 truncate font-medium">{formatIST(event.start, 'HH:mm')}</span>
                                    </div>
                                )
                            }}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Mobile List View (Cards) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {bookings.map(booking => (
                                <div key={booking._id} onClick={() => setSelectedDateBookings([booking])} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-95 active:bg-gray-50 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                                                {booking.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{booking.customerName}</div>
                                                <div className="text-xs text-gray-500">{booking.mobile}</div>
                                                <div className="mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${booking.bookingType === 'car_with_driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {booking.bookingType === 'car_with_driver' ? 'With Driver' : 'Car Only'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
                                            <Clock className="w-3 h-3 text-green-500" />
                                            {formatIST(booking.startDate, 'D MMM, HH:mm')}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
                                            <Clock className="w-3 h-3 text-red-500" />
                                            {formatIST(booking.endDate, 'D MMM, HH:mm')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop List View (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule & Duration</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Resources</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.length > 0 ? bookings.map(booking => (
                                        <tr key={booking._id} onClick={() => setSelectedDateBookings([booking])} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm mr-3">
                                                        {booking.customerName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{booking.customerName}</div>
                                                        <div className="text-xs text-gray-500">{booking.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-gray-200 ${booking.bookingType === 'car_with_driver' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {booking.bookingType === 'car_with_driver' ? 'With Driver' : 'Car Only'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5 text-green-500" /> {formatIST(booking.startDate, 'MMM D, HH:mm')}</div>
                                                    <div className="flex items-center"><Clock className="w-3 h-3 mr-1.5 text-red-500" /> {formatIST(booking.endDate, 'MMM D, HH:mm')}</div>
                                                    <div className="text-[10px] font-bold text-blue-600 mt-1 uppercase">
                                                        Duration: {(() => {
                                                            const start = getIST(booking.startDate);
                                                            const end = getIST(booking.endDate);
                                                            const duration = moment.duration(end.diff(start));
                                                            const days = Math.floor(duration.asDays());
                                                            const hours = duration.hours();
                                                            return `${days > 0 ? `${days}d ` : ''}${hours}h`;
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {booking.car && <div className="flex items-center text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit"><CarIcon className="w-3 h-3 mr-1" /> {booking.car.name}</div>}
                                                    {booking.driver && <div className="flex items-center text-xs text-gray-700 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit"><User className="w-3 h-3 mr-1" /> {booking.driver.name}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No bookings found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Bookings;
