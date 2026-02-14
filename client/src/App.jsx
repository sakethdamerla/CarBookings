import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Bookings from './pages/Bookings';
import Admins from './pages/Admins';
import Approvals from './pages/Approvals';
import AdminProfile from './pages/AdminProfile';
import CustomerLogin from './pages/CustomerLogin';
import CustomerHome from './pages/CustomerHome';
import CustomerBookings from './pages/CustomerBookings';
import CustomerProfile from './pages/CustomerProfile';
import Explore from './pages/Explore';
import CarDetails from './pages/CarDetails';
import BookCar from './pages/BookCar';
import SuperAdminSettings from './pages/SuperAdminSettings';
import CustomerLayout from './components/CustomerLayout';
import Layout from './components/Layout';
import PWAInstaller from './components/PWAInstaller';


// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" />;
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/customer/home" replace />;
};

function App() {
  return (
    <AuthProvider>
      <PWAInstaller />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/customer/login" element={<CustomerLogin />} />

          <Route path="/" element={<RootRedirect />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="cars" element={<Cars />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="admins" element={<Admins />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Customer Routes - Public with Layout */}
          <Route element={<CustomerLayout />}>
            <Route path="/customer/home" element={<CustomerHome />} />
            <Route path="/car/:id" element={<CarDetails />} />
            <Route path="/customer/bookings" element={<CustomerBookings />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/explore" element={<Explore />} />
            <Route path="/book/:id" element={<BookCar />} />
          </Route>

          {/* Legacy/Utility Redirects */}
          <Route path="/cars" element={<Navigate to="/admin/cars" replace />} />
          <Route path="/bookings" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="/admins" element={<Navigate to="/admin/admins" replace />} />
          <Route path="/approvals" element={<Navigate to="/admin/approvals" replace />} />

          {/* Catch-all route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
