import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const PWAInstaller = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the popup after a short delay
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

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPopup(false);
    };

    if (!showPopup) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[9999] animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
                <button
                    onClick={() => setShowPopup(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                            <Download className="text-white w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Install App</h3>
                            <p className="text-xs text-gray-500 font-medium font-bold uppercase tracking-widest">Get the best experience</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                        Install our app for a faster experience and easier access to your car bookings.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={handleInstall}
                            className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Install Now
                        </button>
                    </div>

                    {/* iOS Helper */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">
                        <Share size={12} className="text-gray-400" />
                        <span>iPhone: Tap Share & "Add to Home Screen"</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAInstaller;
