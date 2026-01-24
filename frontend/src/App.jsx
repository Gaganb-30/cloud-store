/**
 * App Component
 * Main routing and app structure
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { LoadingScreen } from './components/ui/Spinner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import FileDetails from './pages/FileDetails';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import PublicDownload from './pages/PublicDownload';
import Analytics from './pages/Analytics';
import AdminViewUser from './pages/AdminViewUser';
import ForgotPassword from './pages/ForgotPassword';
import DMCA from './pages/DMCA';
import Contact from './pages/Contact';
import Premium from './pages/Premium';
import Docs from './pages/Docs';
import AdminDocs from './pages/AdminDocs';

// Protected Route
function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

// Guest Route (redirect if logged in)
function GuestRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default function App() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route element={<Layout />}>
                    {/* Public */}
                    <Route path="/" element={<Home />} />
                    <Route path="/file/:fileId" element={<FileDetails />} />
                    <Route path="/d/:fileId" element={<PublicDownload />} />
                    <Route path="/dmca" element={<DMCA />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/premium" element={<Premium />} />
                    <Route path="/docs" element={<Docs />} />

                    {/* Guest Only */}
                    <Route
                        path="/login"
                        element={
                            <GuestRoute>
                                <Login />
                            </GuestRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <GuestRoute>
                                <Register />
                            </GuestRoute>
                        }
                    />
                    <Route
                        path="/forgot-password"
                        element={
                            <GuestRoute>
                                <ForgotPassword />
                            </GuestRoute>
                        }
                    />

                    {/* Protected */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/upload"
                        element={
                            <ProtectedRoute>
                                <Upload />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/files"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <Analytics />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Only */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <Admin />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/view-user/:userId"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminViewUser />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/docs"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminDocs />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}
