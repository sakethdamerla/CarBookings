import React from 'react';
import { Loader2, Car } from 'lucide-react';

const PageLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full animate-in fade-in duration-500">
            <div className="relative">
                {/* Outer Glow / Ring */}
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>

                {/* Main Spinner */}
                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-blue-50/50 flex flex-col items-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <Loader2 className="w-full h-full text-blue-600 animate-spin-slow opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Car className="w-10 h-10 text-blue-600 animate-bounce" />
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] ml-1">Loading</h3>
                        <div className="flex gap-1 justify-center mt-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
            </div>

            <style>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PageLoader;
