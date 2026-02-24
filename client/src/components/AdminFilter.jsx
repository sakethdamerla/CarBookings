import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Filter, User, Users } from 'lucide-react';

const AdminFilter = ({ onFilterChange, selectedAdminId }) => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const { data } = await api.get('/auth/admins');
                setAdmins(data);
            } catch (error) {
                console.error('Failed to fetch admins:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, []);

    if (loading) return null;

    return (
        <div className="flex items-center gap-3 bg-white p-2 md:p-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                <Filter size={18} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:inline">View:</span>
                <select
                    value={selectedAdminId || ''}
                    onChange={(e) => onFilterChange(e.target.value || null)}
                    className="bg-transparent border-none outline-none text-xs md:text-sm font-black text-gray-900 cursor-pointer uppercase tracking-tight"
                >
                    <option value="">All Admins</option>
                    {admins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                            {admin.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AdminFilter;
