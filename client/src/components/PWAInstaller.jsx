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
        <div className="fixed bottom-2 z-[9999] left-2 right-2 md:left-auto md:right-8 md:w-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl p-2 pl-3 border border-white/10 flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <Download className="text-white w-4 h-4" />
                    </div>
                    <div className="hidden xs:block">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Install App</h3>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Install the app now</p>
                    <button
                        onClick={handleInstall}
                        className="bg-white text-black ml-14 px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 whitespace-nowrap"
                    >
                        Install Now
                    </button>

                    <div className="hidden sm:flex items-center gap-2 text-[8px] text-gray-400 font-bold uppercase tracking-widest border-l border-white/10 pl-4 whitespace-nowrap">
                        <Share className="w-3 h-3" />
                        iOS: Add to Home Screen
                    </div>
                </div>

                <button onClick={() => setShowPopup(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                    <X size={14} className="text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default PWAInstaller;
