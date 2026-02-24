import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import {
    Bell,
    BellOff,
    Settings,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Megaphone,
    Plus,
    Trash2,
    Clock,
    Hash
} from 'lucide-react';

const SuperAdminSettings = () => {
    const { user } = useContext(AuthContext);
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Announcement Settings State
    const [announcementSettings, setAnnouncementSettings] = useState({
        isEnabled: false,
        sentences: [],
        sentencesPerPopup: 1,
        postTime: '09:00'
    });
    const [newSentence, setNewSentence] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncementSettings();
    }, []);

    const fetchAnnouncementSettings = async () => {
        try {
            setSettingsLoading(true);
            const { data } = await api.get('/announcements/settings');
            setAnnouncementSettings(data);
        } catch (error) {
            console.error('Failed to fetch announcement settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const { data } = await api.put('/auth/profile', {
                notificationsEnabled: notificationsEnabled
            });
            localStorage.setItem('user', JSON.stringify(data));
            setMessage({ type: 'success', text: 'Profile settings updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnnouncements = async () => {
        setLoading(true);
        try {
            await api.put('/announcements/settings', announcementSettings);
            setMessage({ type: 'success', text: 'Announcement engine updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update announcements' });
        } finally {
            setLoading(false);
        }
    };

    const addSentence = () => {
        if (!newSentence.trim()) return;
        setAnnouncementSettings({
            ...announcementSettings,
            sentences: [...announcementSettings.sentences, newSentence.trim()]
        });
        setNewSentence('');
    };

    const removeSentence = (index) => {
        const updated = announcementSettings.sentences.filter((_, i) => i !== index);
        setAnnouncementSettings({ ...announcementSettings, sentences: updated });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            <div>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center gap-4">
                    <Settings className="w-10 h-10 text-black" />
                    Global Settings
                </h2>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-2 ml-1 opacity-60">System configuration & personalization</p>
            </div>

            {message.text && (
                <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${message.type === 'success' ? 'bg-black text-white' : 'bg-red-500 text-white'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <AlertCircle size={20} />}
                    <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            {/* Profile Notifications Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">My Alerts</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose opacity-60">Personal notification preferences for your superadmin account.</p>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-100 border border-gray-100 group hover:border-black transition-colors duration-500">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${notificationsEnabled ? 'bg-black text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>
                                        {notificationsEnabled ? <Bell size={28} /> : <BellOff size={28} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase tracking-tight">Real-time Bookings</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Receive alerts for new reservations</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 ${notificationsEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-500 ${notificationsEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="px-8 py-4 bg-black text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />}
                                    Save Preference
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcement Engine Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="sticky top-8">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Announcement Engine</h3>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose opacity-60 italic mb-4">Global ephemeral notifications.</p>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-relaxed">
                                These popups are purely visual and will not be stored in any user's notification history.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-gray-100 border border-gray-100 relative overflow-hidden">
                        {settingsLoading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-[3rem]">
                                <Loader2 className="w-10 h-10 text-black animate-spin" />
                            </div>
                        )}

                        <div className="space-y-10">
                            {/* Global Toggle */}
                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${announcementSettings.isEnabled ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-200 text-gray-400'}`}>
                                        <Megaphone size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase tracking-tight">Active Engine</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global system-wide switch</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAnnouncementSettings({ ...announcementSettings, isEnabled: !announcementSettings.isEnabled })}
                                    className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 ${announcementSettings.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-500 ${announcementSettings.isEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Scheduling & Config */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Trigger Time</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="time"
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[1.5rem] outline-none font-bold text-gray-900 transition-all"
                                            value={announcementSettings.postTime}
                                            onChange={(e) => setAnnouncementSettings({ ...announcementSettings, postTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Random sentences</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[1.5rem] outline-none font-bold text-gray-900 transition-all"
                                            value={announcementSettings.sentencesPerPopup}
                                            onChange={(e) => setAnnouncementSettings({ ...announcementSettings, sentencesPerPopup: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sentences Management */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Sentence Pool ({announcementSettings.sentences.length})</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Type an motivational or info sentence..."
                                        className="flex-1 px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[1.5rem] outline-none font-bold text-gray-900 transition-all text-sm"
                                        value={newSentence}
                                        onChange={(e) => setNewSentence(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSentence()}
                                    />
                                    <button
                                        onClick={addSentence}
                                        className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {announcementSettings.sentences.map((s, idx) => (
                                        <div key={idx} className="group p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-200 transition-all animate-in slide-in-from-right-4 duration-300">
                                            <p className="text-sm font-bold text-gray-700">{s}</p>
                                            <button
                                                onClick={() => removeSentence(idx)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {announcementSettings.sentences.length === 0 && (
                                        <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No sentences added to the pool yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-10 border-t border-gray-50 flex justify-end">
                                <button
                                    onClick={handleSaveAnnouncements}
                                    disabled={loading}
                                    className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                    Deploy Announcement Engine
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
