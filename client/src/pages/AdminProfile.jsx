import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import { User, Mail, Phone, Lock, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminProfile = () => {
    const { user, login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showChangePassword, setShowChangePassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data } = await api.put('/auth/profile', {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password || undefined
            });

            // Update local storage and context
            localStorage.setItem('user', JSON.stringify(data));
            // We can't directly call login because it expects email/password and hits an endpoint
            // But we can reload or update context manually if AuthContext supports it
            // For now, let's just show success and hint at reload or update
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // To update the sidebar/header immediately, we'd need a setUser in context
            // Let's assume the user will see the changes on next login or we could trigger a refresh
            window.location.reload();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-500">Manage your account settings and credentials</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-purple-400" /> Business Name (Public)
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-white border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-bold text-purple-700"
                                    placeholder="e.g. Royal Car Rentals"
                                />
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider ml-1">This name will be shown to customers as the provider</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" /> Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    placeholder="+91 00000 00000"
                                />
                            </div>

                        </div>

                        {!showChangePassword ? (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowChangePassword(true)}
                                    className="text-purple-600 text-sm font-bold flex items-center gap-2 hover:text-purple-700 transition-colors"
                                >
                                    <Lock size={16} />
                                    Change Password?
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" /> New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                        placeholder="Min 6 characters"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" /> Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <div className="col-span-full">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                                        }}
                                        className="text-gray-400 text-xs font-bold hover:text-gray-600"
                                    >
                                        Cancel Password Change
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Update Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
