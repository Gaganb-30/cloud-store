/**
 * Layout Component
 */
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="py-8 border-t border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-900">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Footer Links - Properly Aligned */}
                    <div className="flex items-center justify-center gap-8 mb-6">
                        <Link
                            to="/premium"
                            className="group relative text-sm font-medium transition-all duration-300"
                        >
                            {/* Subtle glow on hover */}
                            <span className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                                <span className="text-purple-400">⭐</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 font-semibold">
                                    Get Premium
                                </span>
                            </span>
                        </Link>

                        <Link
                            to="/contact"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
                        >
                            Contact Us
                        </Link>

                        <Link
                            to="/dmca"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
                        >
                            DMCA Policy
                        </Link>

                        <Link
                            to="/docs"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
                        >
                            Docs & FAQ
                        </Link>
                    </div>

                    {/* Copyright */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} CloudVault. Fast & secure file hosting.
                    </p>
                </div>
            </footer>
        </div>
    );
}
