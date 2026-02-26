import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import PageLoader from '../components/PageLoader';
import { Plus, Trash, Search, Shield, Mail, AlertCircle, Loader2, ChevronRight, Pencil, Calendar, Clock, Crown, X } from 'lucide-react';
import { formatIST } from '../utils/dateUtils';

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
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedAdmin, setSelectedAdmin] = useState(null); // For detail view
    const [extensionDays, setExtensionDays] = useState(30);
    const [actionLoading, setActionLoading] = useState(null);

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

    const handleExtendSubscription = async (id) => {
        try {
            setActionLoading(id);
            const { data } = await api.put(`/auth/admins/${id}/extend`, { days: parseInt(extensionDays) });
            setAdmins(admins.map(a => a._id === id ? { ...a, subscriptionEndDate: data.subscriptionEndDate } : a));
            if (selectedAdmin && selectedAdmin._id === id) {
                setSelectedAdmin({ ...selectedAdmin, subscriptionEndDate: data.subscriptionEndDate });
            }
        } catch (error) {
            console.error('Failed to extend subscription:', error);
            alert('Failed to extend subscription');
        } finally {
            setActionLoading(null);
        }
    };

    const fetchAdmins = useCallback(async () => {
        try {
            setPageLoading(true);
            const { data } = await api.get('/auth/admins');
            setAdmins(data);
        } catch (error) {
            console.error(error);
        } finally {
            setPageLoading(false);
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

            {pageLoading ? (
                <PageLoader />
            ) : (
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
                                <div className="flex justify-between items-start mb-2" onClick={() => setSelectedAdmin(admin)}>
                                    <div className="flex items-center">
                                        <div className="p-2 bg-purple-50 rounded-lg mr-3 text-purple-600">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{admin.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Clock size={10} />
                                                {admin.subscriptionEndDate ? formatIST(admin.subscriptionEndDate) : 'No Subscription'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                        {admin.role}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div
                                        onClick={() => setSelectedAdmin(admin)}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer"
                                    >
                                        View Details
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
                                        onClick={() => setSelectedAdmin(admin)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-purple-50 rounded-lg mr-3 text-purple-600">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800">{admin.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {admin.subscriptionEndDate ? formatIST(admin.subscriptionEndDate) : 'No Subscription'}
                                                    </div>
                                                </div>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPermissionModal({ visible: true, admin });
                                                    }}
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
            )}

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
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 transform transition-all scale-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Permissions</h3>
                                <p className="text-xs text-gray-500 font-medium">Control access for {permissionModal.admin?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            {['dashboard', 'cars', 'bookings', 'admins', 'approvals', 'settings'].map(page => (
                                <button
                                    key={page}
                                    onClick={() => togglePermission(permissionModal.admin, page)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${permissionModal.admin?.permissions?.includes(page)
                                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                                        : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="capitalize font-black text-xs uppercase tracking-widest">{page}</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${permissionModal.admin?.permissions?.includes(page) ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${permissionModal.admin?.permissions?.includes(page) ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setPermissionModal({ visible: false, admin: null })}
                            className="w-full py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
                        >
                            Close & Save
                        </button>
                    </div>
                </div>
            )}

            {/* Admin Details Modal */}
            {selectedAdmin && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="p-8 text-center relative bg-gradient-to-br from-indigo-600 to-purple-700">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
                                <Crown className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{selectedAdmin.name}</h3>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Admin Configuration</p>

                            <button
                                onClick={() => setSelectedAdmin(null)}
                                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Permissions</p>
                                    <p className="text-xl font-black text-gray-900">{selectedAdmin.permissions?.length || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-xl font-black text-green-600 uppercase">Active</p>
                                </div>
                            </div>

                            {/* Subscription Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subscription Renewal</h4>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${new Date(selectedAdmin.subscriptionEndDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {new Date(selectedAdmin.subscriptionEndDate) > new Date() ? 'Valid' : 'Expired'}
                                    </span>
                                </div>
                                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ending On</p>
                                        <p className="text-lg font-black text-indigo-900">
                                            {selectedAdmin.subscriptionEndDate ? formatIST(selectedAdmin.subscriptionEndDate) : 'Not Set'}
                                        </p>
                                    </div>
                                </div>

                                {/* Extension Controls */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={extensionDays}
                                            onChange={(e) => setExtensionDays(e.target.value)}
                                            className="w-20 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-center text-gray-900 transition-all shadow-inner"
                                            placeholder="Days"
                                        />
                                        <button
                                            onClick={() => handleExtendSubscription(selectedAdmin._id)}
                                            disabled={actionLoading === selectedAdmin._id}
                                            className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                        >
                                            {actionLoading === selectedAdmin._id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                            Extend Days
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center font-bold px-4 italic">Extend the duration of this admin's system access in days.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        setPermissionModal({ visible: true, admin: selectedAdmin });
                                        setSelectedAdmin(null);
                                    }}
                                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Permissions
                                </button>
                                <button
                                    onClick={() => setSelectedAdmin(null)}
                                    className="px-6 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;
