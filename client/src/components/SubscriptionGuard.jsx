import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { AlertCircle, Lock, MessageCircle } from 'lucide-react';

const SubscriptionGuard = ({ children }) => {
    const { user } = useContext(AuthContext);

    // Only apply to admins and superadmins (or as requested)
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return children;
    }

    const isExpired = user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date();

    if (isExpired) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-md w-full space-y-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-100 blur-3xl rounded-full opacity-50 animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-red-100 shadow-xl">
                            <Lock size={40} className="animate-bounce" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">Access Blocked</h2>
                        <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                            <p className="text-gray-600 font-bold leading-relaxed">
                                "Your subscription has expired. Please contact your System Administrator to restore access"
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            href="https://wa.me/919999999999" // Placeholder for superadmin contact
                            className="flex items-center justify-center gap-3 w-full py-5 bg-green-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                        >
                            <MessageCircle size={18} />
                            Contact Superadmin
                        </a>
                        <button
                            onClick={() => {
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                            className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            Log Out Account
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-50 italic">
                        Subscription Security Protocol v1.0
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default SubscriptionGuard;
