import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import { Bell, BellOff, Settings, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const SuperAdminSettings = () => {
    const { user } = useContext(AuthContext);
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const { data } = await api.put('/auth/profile', {
                notificationsEnabled: notificationsEnabled
            });
            // Update local storage
            localStorage.setItem('user', JSON.stringify(data));
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            // Soft refresh context
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center gap-3">
                    <Settings className="w-8 h-8 text-black" />
                    SuperAdmin Settings
                </h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Configure global application preferences and your personal dashboard settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Notifications</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">Control which alerts you receive. Disabling this will stop all booking and system notifications from appearing in your feed.</p>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span className="text-sm font-bold uppercase tracking-tight">{message.text}</span>
                            </div>
                        )}

                        <div className="space-y-8">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${notificationsEnabled ? 'bg-black text-white shadow-xl shadow-gray-200' : 'bg-gray-100 text-gray-400'}`}>
                                        {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase tracking-tight">Booking Notifications</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Receive alerts for every new booking</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${notificationsEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-10 py-4 bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSettings;
