import { useContext, useState } from 'react';
import { ArrowLeft, User, Phone, LogOut, Loader2, Mail, KeyRound, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';


const CustomerProfile = () => {
    const { user, loginWithMobile, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Guest States
    const [guestName, setGuestName] = useState('');
    const [guestMobile, setGuestMobile] = useState('');
    const [error, setError] = useState('');

    const guestUser = JSON.parse(localStorage.getItem('guestUser'));

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        if (!guestName || !guestMobile) {
            setError('Please fill all fields');
            return;
        }
        try {
            await loginWithMobile(guestMobile, guestName);
            // AuthContext updates user state, which triggers re-render
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to identify');
        }
    };

    const handleLogout = () => {
        if (user) logout();
        localStorage.removeItem('guestUser');
        navigate('/customer/home');
    };

    return (
        <div className="pb-32">
            <div className="bg-black pb-20 pt-12 md:pt-20 px-6 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center mb-10">
                        <button onClick={() => navigate('/customer/home')} className="mr-6 bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 backdrop-blur-md transition-all active:scale-95 group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">Account</h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-white/20 to-white/5 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center border-4 border-white/10 backdrop-blur-xl shadow-2xl">
                            <User className="w-14 h-14 md:w-20 md:h-20 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                                {user?.name || guestUser?.name || 'Guest User'}
                            </h2>
                            <div className="inline-block bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                                <p className="text-blue-300 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                                    {user ? (user.role === 'admin' ? 'Administrator' : 'Verified Member') : 'USER'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20 space-y-6">
                {!user && !guestUser ? (
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-gray-100">
                        <div className="mb-10 text-center">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">Identify Yourself</h3>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Provide your details to continue</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest mb-6 border border-red-100 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleGuestSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -track-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-800"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -track-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="tel"
                                        placeholder="+91 00000 00000"
                                        value={guestMobile}
                                        onChange={(e) => setGuestMobile(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-800"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-black text-white font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-gray-400 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                Save Identity
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8 border-b border-gray-50 pb-4">Safe Information</h3>
                            <div className="flex items-center gap-6 text-gray-700">
                                <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-black border border-gray-100">
                                    <Phone className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered Contact</p>
                                    <p className="font-black text-xl md:text-2xl tracking-tighter text-gray-900">{user?.mobile || guestUser?.mobile || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8 border-b border-gray-50 pb-4">Notification Settings</h3>
                            <div className="space-y-6">
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">Ensure you receive instant alerts for your booking updates. You can test your device settings below.</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={async () => {
                                            if (!('Notification' in window)) return alert('Notifications not supported');
                                            const perm = await Notification.requestPermission();
                                            if (perm !== 'granted') return alert('Please allow notification permission first');

                                            if ('serviceWorker' in navigator) {
                                                const reg = await navigator.serviceWorker.ready;
                                                reg.showNotification('Test Notification', {
                                                    body: 'Local system notifications are working!',
                                                    icon: '/download.png',
                                                    vibrate: [100, 50, 100],
                                                    badge: '/download.png'
                                                });
                                            }
                                        }}
                                        className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
                                    >
                                        <Bell className="w-4 h-4" />
                                        Test Notifications
                                    </button>

                                    <button
                                        onClick={async () => {
                                            try {
                                                const { subscribeToPush } = await import('../utils/pushUtils');
                                                await subscribeToPush();
                                                alert('Push subscription refreshed. You will now receive background alerts.');
                                            } catch (err) {
                                                alert('Failed to enable background alerts');
                                            }
                                        }}
                                        className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
                                    >
                                        <Bell className="w-4 h-4" />
                                        Make sure Notifications on
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-xl border border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-4 text-red-600 font-black uppercase tracking-widest text-xs py-5 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
                            >
                                <LogOut className="w-5 h-5" />
                                {user ? 'Sign Out of Account' : 'Logout'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerProfile;

