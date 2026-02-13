import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, Car, User, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCars: 0,
        totalDrivers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        monthlyBookings: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/stats');
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { name: 'Total Cars', value: stats.totalCars, icon: Car, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
        { name: 'Total Drivers', value: stats.totalDrivers, icon: User, color: 'from-green-500 to-green-600', textColor: 'text-green-600' },
        { name: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
        { name: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="space-y-3">
                                    <div className="h-4 w-20 bg-gray-100 rounded"></div>
                                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    cards.map((item) => (
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
                    ))
                )}
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
        </div>
    );
};

export default Dashboard;
