import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, List, Calendar as CalendarIcon, Clock, User, Car as CarIcon, AlertCircle, Loader2, X, MapPin } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import { formatIST, getIST } from '../utils/dateUtils';

const localizer = momentLocalizer(moment);

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('calendar'); // 'list' or 'calendar'
    const [showForm, setShowForm] = useState(false);
    const [selectedDateBookings, setSelectedDateBookings] = useState(null);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/bookings');
            setBookings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

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
            await api.put(`/bookings/${id}`, { status, totalAmount: finalAmount });
            fetchBookings();
            setSelectedDateBookings(prev => prev ? prev.map(b => b._id === id ? { ...b, status, totalAmount: finalAmount } : b) : null);
        } catch (error) {
            console.error(error);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
                    <p className="text-gray-500">Schedule and track vehicle reservations</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center transition-all ${view === 'calendar' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center transition-all ${view === 'list' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <List className="w-4 h-4 mr-2" /> List View
                        </button>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-sm font-semibold flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Booking
                    </button>
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
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Vehicle & Driver</p>
                                            <div className="space-y-1">
                                                {booking.car && <div className="flex items-center text-gray-700"><CarIcon className="w-3 h-3 mr-2 text-blue-500" /> {booking.car.name}</div>}
                                                {booking.driver && <div className="flex items-center text-gray-700"><User className="w-3 h-3 mr-2 text-green-500" /> {booking.driver.name}</div>}
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
                                        <div className="bg-white p-3 rounded-lg border border-gray-100 col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Schedule & Timestamps</p>
                                            <div className="grid grid-cols-2 gap-4 text-[10px] md:text-xs">
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

                                        <div className="flex justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            {booking.status === 'confirmed' ? 'Reservation Finalized' : 'Awaiting Approval'}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(booking._id, 'confirmed', booking.totalAmount)} className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg">Approve Reservation</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] p-2 md:p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-[600px]">
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                    </div>
                ) : view === 'calendar' ? (
                    <div className="h-[500px] md:h-[700px] booking-calendar text-xs md:text-sm">
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', fontFamily: 'inherit' }}
                            eventPropGetter={(event) => {
                                let bgColor = '#8b5cf6'; // default purple
                                if (event.resource.bookingType === 'driver_only') bgColor = '#10b981'; // green
                                if (event.resource.bookingType === 'car_only') bgColor = '#3b82f6'; // blue
                                if (event.resource.status === 'cancelled') bgColor = '#ef4444'; // red

                                return {
                                    className: 'rounded-md border-0 shadow-sm opacity-90 hover:opacity-100 transition-opacity',
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
                                    <div className="flex flex-col gap-0.5 p-0.5 overflow-hidden">
                                        <span className="font-semibold truncate">{event.resource.customerName}</span>
                                        <span className="text-[8px] md:text-[10px] opacity-90 truncate">{formatIST(event.start, 'HH:mm')}</span>
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
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200 capitalize">
                                                    {booking.bookingType.replace(/_/g, ' ')}
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
        </div>
    );
};

export default Bookings;
