import { Link, Outlet, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { LayoutDashboard, Car, User, Calendar, LogOut, Menu, X, ChevronRight, Shield, Settings } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Layout = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [];

    if (user?.role === 'superadmin' || user?.permissions?.includes('dashboard')) {
        navItems.push({ path: '/admin', label: 'Dashboard', icon: LayoutDashboard });
    }

    if (user?.role === 'superadmin' || user?.permissions?.includes('cars')) {
        navItems.push({ path: '/admin/cars', label: 'Cars', icon: Car });
    }
    if (user?.role === 'superadmin' || user?.permissions?.includes('bookings')) {
        navItems.push({ path: '/admin/bookings', label: 'Bookings', icon: Calendar });
    }


    if (user?.role === 'superadmin') {
        navItems.push({ path: '/admin/admins', label: 'Admins', icon: Shield });
    }

    if (user?.role === 'superadmin' || user?.permissions?.includes('approvals')) {
        navItems.push({ path: '/admin/approvals', label: 'Approvals', icon: Calendar });
    }

    if (user?.role === 'superadmin') {
        navItems.push({ path: '/admin/settings', label: 'Settings', icon: Settings });
    }

    navItems.push({ path: '/admin/profile', label: 'Profile', icon: User });


    const isActive = (path) => location.pathname === path;

    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:translate-x-0 md:w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20 md:relative shadow-lg overflow-hidden`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    <div className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 truncate ${isSidebarOpen ? 'text-xl' : 'hidden'}`}>
                        BookMyCar
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hidden md:block">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 group ${isActive(item.path)
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                                } whitespace-nowrap`}
                        >
                            <item.icon size={20} className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                            <span className={`${isSidebarOpen ? 'block' : 'hidden'} font-medium`}>{item.label}</span>
                            {isSidebarOpen && isActive(item.path) && <ChevronRight size={16} className="ml-auto opacity-70" />}
                        </Link>
                    ))}
                </nav>

            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 md:hidden">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">
                            {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()}
                        </h2>

                    </div>
                    <div className="flex items-center space-x-3">
                        <NotificationCenter />
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 group"
                            title="Logout"
                        >
                            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-tight hidden sm:block">Exit</span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-inner ml-2">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <span className="text-gray-700 font-medium hidden md:block">{user?.name}</span>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div >
        </div >
    );
};

export default Layout;
