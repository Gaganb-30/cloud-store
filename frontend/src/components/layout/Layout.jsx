/**
 * Layout Component
 */
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-dark-800">
                <p>© {new Date().getFullYear()} CloudVault. Fast & secure file hosting.</p>
            </footer>
        </div>
    );
}
