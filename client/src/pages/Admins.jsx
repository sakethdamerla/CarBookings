import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { Plus, Trash, Search, Shield, Mail, AlertCircle, Loader2, ChevronRight, Pencil } from 'lucide-react';

const Admins = () => {
    const [admins, setAdmins] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [permissionModal, setPermissionModal] = useState({ visible: false, admin: null });
    const [editingAdmin, setEditingAdmin] = useState(null);

    const togglePermission = async (admin, page) => {
        const hasPermission = admin.permissions?.includes(page);
        const newPermissions = hasPermission
            ? admin.permissions.filter(p => p !== page)
            : [...(admin.permissions || []), page];

        try {
            await api.put(`/auth/admins/${admin._id}/permissions`, { permissions: newPermissions });
            // Optimistically update
            setAdmins(admins.map(a => a._id === admin._id ? { ...a, permissions: newPermissions } : a));
            // Update modal state too
            setPermissionModal(prev => ({ ...prev, admin: { ...prev.admin, permissions: newPermissions } }));
        } catch (error) {
            console.error('Failed to update permissions:', error);
            alert('Failed to update permissions');
        }
    };

    const fetchAdmins = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/admins');
            setAdmins(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();

        // Listen for real-time refresh events
        window.addEventListener('refreshData', fetchAdmins);
        return () => window.removeEventListener('refreshData', fetchAdmins);
    }, [fetchAdmins]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editingAdmin) {
                await api.put(`/auth/admins/${editingAdmin._id}`, formData);
            } else {
                await api.post('/auth/admins', formData);
            }
            fetchAdmins();
            setFormVisible(false);
            setEditingAdmin(null);
            setFormData({ name: '', email: '', password: '' });
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingAdmin ? 'update' : 'create'} admin`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '' // Don't show password
        });
        setFormVisible(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            try {
                await api.delete(`/auth/admins/${id}`);
                setAdmins(admins.filter(a => a._id !== id));
            } catch (error) {
                console.error('Failed to delete admin:', error);
                alert('Failed to delete admin');
            }
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
                    <p className="text-gray-500">Manage system administrators</p>
                </div>
                <button
                    onClick={() => setFormVisible(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-sm font-semibold flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Admin
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                        <div key={admin._id} className="p-4 active:bg-gray-50 transition-all border-b border-gray-100 last:border-0 relative group">
                            <div className="flex justify-between items-start mb-2" onClick={() => setPermissionModal({ visible: true, admin })}>
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-50 rounded-lg mr-3 text-purple-600">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{admin.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{admin.email}</div>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                    {admin.role}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <div
                                    onClick={() => setPermissionModal({ visible: true, admin })}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1 cursor-pointer"
                                >
                                    {admin.permissions?.length || 0} Permissions
                                    <ChevronRight size={12} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(admin)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, admin._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No admins found.</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Details</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                                <tr key={admin._id}
                                    onClick={() => setPermissionModal({ visible: true, admin })}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-purple-50 rounded-lg mr-3 text-purple-600">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="font-semibold text-gray-800">{admin.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <Mail className="w-4 h-4 mr-2 opacity-70" />
                                            {admin.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setPermissionModal({ visible: true, admin })}
                                                className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all ${admin.permissions?.length > 0
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                    }`}
                                            >
                                                {admin.permissions?.length || 0} Permissions
                                            </button>
                                            <div className="h-4 w-[1px] bg-gray-100 mx-1"></div>
                                            <button
                                                onClick={() => handleEdit(admin)}
                                                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Edit Admin"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, admin._id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Admin"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No admins found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {formVisible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</h3>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" placeholder="e.g. Jane Doe" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" placeholder="e.g. admin@company.com" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {editingAdmin && <span className="text-[10px] text-gray-400 font-normal italic">(Leave blank to keep current)</span>}
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingAdmin}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormVisible(false);
                                        setEditingAdmin(null);
                                        setFormData({ name: '', email: '', password: '' });
                                    }}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md transition-colors flex items-center">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingAdmin ? 'Update Admin' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {permissionModal.visible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Permissions</h3>
                        <p className="text-gray-500 mb-6">
                            Manage access for <span className="font-semibold text-gray-800">{permissionModal.admin?.name}</span>
                        </p>

                        <div className="space-y-3 mb-8">
                            {['dashboard', 'cars', 'drivers', 'bookings', 'approvals'].map(page => (
                                <div key={page} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <span className="capitalize font-medium text-gray-700">{page}</span>
                                    <button
                                        onClick={() => togglePermission(permissionModal.admin, page)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${permissionModal.admin?.permissions?.includes(page)
                                            ? 'bg-purple-600'
                                            : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${permissionModal.admin?.permissions?.includes(page)
                                            ? 'left-7'
                                            : 'left-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPermissionModal({ visible: false, admin: null })}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;
