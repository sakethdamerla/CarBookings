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
    Hash,
    X
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
        postTimes: ['09:00']
    });
    const [newSentence, setNewSentence] = useState('');
    const [newTime, setNewTime] = useState('09:00');
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncementSettings();
    }, []);

    const fetchAnnouncementSettings = async () => {
        try {
            setSettingsLoading(true);
            const { data } = await api.get('/announcements/settings');
            // Ensure postTimes exists and is an array (fallback for migration)
            const postTimes = Array.isArray(data.postTimes) ? data.postTimes : (data.postTime ? [data.postTime] : ['09:00']);
            setAnnouncementSettings({ ...data, postTimes });
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
            setMessage({ type: 'success', text: 'Profile updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnnouncements = async () => {
        setLoading(true);
        try {
            await api.put('/announcements/settings', announcementSettings);
            setMessage({ type: 'success', text: 'Settings deployed!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to deploy' });
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

    const addTime = () => {
        if (!newTime || announcementSettings.postTimes.includes(newTime)) return;
        setAnnouncementSettings({
            ...announcementSettings,
            postTimes: [...announcementSettings.postTimes, newTime].sort()
        });
    };

    const removeTime = (timeToRemove) => {
        const updated = announcementSettings.postTimes.filter(t => t !== timeToRemove);
        setAnnouncementSettings({ ...announcementSettings, postTimes: updated });
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8 md:space-y-12 pb-24 animate-in fade-in duration-500">
            <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter italic flex flex-col md:flex-row items-center gap-2 md:gap-4">
                    <Settings className="w-8 h-8 md:w-10 md:h-10 text-black" />
                    Global Settings
                </h2>
                <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2 opacity-60">System configuration & personalization</p>
            </div>

            {message.text && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] md:w-auto">
                    <div className={`p-4 rounded-2xl shadow-2xl shadow-black/10 flex items-center justify-center gap-3 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-400" /> : <AlertCircle size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Profile Notifications Section */}
            <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-gray-100/50 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${notificationsEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm md:text-base">Real-time Bookings</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Alerts for my account</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                        <button
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 ${notificationsEnabled ? 'bg-black' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-500 ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="p-3 md:px-6 md:py-3 bg-black text-white rounded-xl md:rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} className="md:hidden" />}
                            <span className="hidden md:inline">Save</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Announcement Engine Section */}
            <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden">
                {settingsLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                    </div>
                )}

                <div className="space-y-8 md:space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-6 md:pb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${announcementSettings.isEnabled ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base">Announcement Engine</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Ephemeral Global Popups</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAnnouncementSettings({ ...announcementSettings, isEnabled: !announcementSettings.isEnabled })}
                            className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 self-end md:self-auto ${announcementSettings.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-500 ${announcementSettings.isEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Trigger Times */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} className="text-blue-600" />
                                Trigger Times
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none font-bold text-gray-900 transition-all text-sm"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                />
                                <button
                                    onClick={addTime}
                                    className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {announcementSettings.postTimes.map((time, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">
                                        {time}
                                        <button onClick={() => removeTime(time)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sentences Count */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={12} className="text-blue-600" />
                                Sentences Per Popup
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none font-bold text-gray-900 transition-all text-sm"
                                value={announcementSettings.sentencesPerPopup}
                                onChange={(e) => setAnnouncementSettings({ ...announcementSettings, sentencesPerPopup: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    {/* Sentence Pool */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Megaphone size={12} className="text-blue-600" />
                            Sentence Pool ({announcementSettings.sentences.length})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a motivational sentence..."
                                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none font-bold text-gray-900 transition-all text-sm"
                                value={newSentence}
                                onChange={(e) => setNewSentence(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addSentence()}
                            />
                            <button
                                onClick={addSentence}
                                className="p-3 bg-black text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {announcementSettings.sentences.map((s, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-transparent hover:border-gray-200 transition-all text-xs font-bold text-gray-700">
                                    <span className="truncate flex-1">{s}</span>
                                    <button onClick={() => removeSentence(idx)} className="ml-4 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-50">
                        <button
                            onClick={handleSaveAnnouncements}
                            disabled={loading || announcementSettings.postTimes.length === 0}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                            Deploy Engine
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SuperAdminSettings;
