/**
 * Navbar Component
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Upload,
    FolderOpen,
    Settings,
    LogOut,
    Moon,
    Sun,
    Shield,
    Menu,
    X,
    Cloud,
    BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUpload } from '../../context/UploadContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { clearQueue } = useUpload();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        clearQueue();
        logout();
    };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: FolderOpen },
        { to: '/upload', label: 'Upload', icon: Upload },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/settings', label: 'Settings', icon: Settings },
    ];

    if (isAdmin) {
        navLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
    }

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <Cloud className="w-8 h-8 text-accent" />
                        <span className="text-xl font-bold text-gradient">CloudVault</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {isAuthenticated && navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive(link.to)
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                                    }`}
                            >
                                <link.icon className="w-4 h-4" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-600" />
                            )}
                        </motion.button>

                        {isAuthenticated ? (
                            <>
                                {/* User Avatar */}
                                <div className="hidden md:flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(user?.email)}`}>
                                        {getInitials(user?.email)}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-gray-300"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="btn btn-ghost">Log in</Link>
                                <Link to="/register" className="btn btn-primary">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden py-4 border-t border-gray-200 dark:border-dark-700"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive(link.to)
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                <link.icon className="w-5 h-5" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 dark:text-gray-300"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </motion.div>
                )}
            </div>
        </nav>
    );
}
