/**
 * Spinner Component
 */
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <Loader2 className={`animate-spin text-accent ${sizes[size]} ${className}`} />
    );
}

export function LoadingScreen({ message = 'Loading...' }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}
