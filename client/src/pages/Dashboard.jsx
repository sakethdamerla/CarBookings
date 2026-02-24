import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Users, Car, User, Calendar, TrendingUp, DollarSign, MapPin, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { formatIST } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import AdminFilter from '../components/AdminFilter';
import AuthContext from '../context/AuthContext';
import { useContext, useState } from 'react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [ownerId, setOwnerId] = useState(null);

    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['stats', ownerId],
        queryFn: async () => {
            const params = {};
            if (ownerId) params.ownerId = ownerId;
            const { data } = await api.get('/stats', { params });
            return data;
        },
    });

    const { data: pendingBookings, isLoading: pendingLoading, error: pendingError } = useQuery({
        queryKey: ['pendingBookings', ownerId],
        queryFn: async () => {
            const params = {};
            if (ownerId) params.ownerId = ownerId;
            const { data } = await api.get('/bookings/pending', { params });
            return data.slice(0, 5);
        },
    });

    const loading = statsLoading || pendingLoading;
    const error = statsError || pendingError;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold">Failed to load dashboard data</h3>
                <p className="text-sm opacity-70">Please check your connection and try again.</p>
            </div>
        );
    }

    const cards = [
        { name: 'Total Cars', value: stats?.totalCars || 0, icon: Car, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
        { name: 'Total Drivers', value: stats?.totalDrivers || 0, icon: User, color: 'from-green-500 to-green-600', textColor: 'text-green-600' },
        { name: 'Total Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
        { name: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                    <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
                </div>
                {user?.role === 'superadmin' && (
                    <AdminFilter onFilterChange={setOwnerId} selectedAdminId={ownerId} />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((item) => (
                    <div key={item.name} className="relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 group">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{item.name}</p>
                                <h3 className="text-3xl font-bold text-gray-800">{item.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-gray-50 ${item.textColor}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                            Recent Activity
                        </h3>
                        <span className="text-sm text-gray-400">This Month</span>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">Activity Chart Placeholder</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                            Revenue Trends
                        </h3>
                        <span className="text-sm text-gray-400">This Year</span>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">Revenue Analysis Placeholder</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Recent Pending Requests</h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Bookings awaiting your approval</p>
                    </div>
                    <button
                        onClick={() => navigate('/approvals')}
                        className="p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl transition-all group"
                    >
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Route</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pendingBookings && pendingBookings.length > 0 ? (
                                pendingBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400">
                                                    {booking.customerName ? booking.customerName[0] : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-sm">{booking.customerName}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{booking.mobile}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-gray-900 text-sm whitespace-nowrap">{booking.car?.name || 'Manual'}</p>
                                            <p className={`text-[8px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest inline-block ${booking.bookingType === 'car_with_driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                {booking.bookingType === 'car_with_driver' ? 'With Driver' : 'Car Only'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                                <div className="max-w-[150px]">
                                                    <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tighter">{booking.pickupLocation}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tighter">to {booking.dropLocation}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-black text-gray-900">
                                                    {formatIST(booking.startDate, 'DD MMM')} - {formatIST(booking.endDate, 'DD MMM')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No pending requests</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
