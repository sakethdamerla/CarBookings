import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const PWAInstaller = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => {
                const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
                if (!isAppInstalled) {
                    setShowPopup(true);
                }
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowPopup(false);
    };

    if (!showPopup) return null;

    return (
        <div className="fixed top-0 inset-x-0 z-[10000] animate-in slide-in-from-top duration-700">
            <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-white/20 rounded-md">
                        <Download size={14} className="text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Install Car Bookings App for a better experience</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleInstall}
                        className="bg-white text-indigo-600 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        Install Now
                    </button>
                    <button onClick={() => setShowPopup(false)} className="text-white/60 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstaller;
