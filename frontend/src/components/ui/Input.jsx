/**
 * Input Component
 */
import { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
            w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-800
            focus:ring-2 focus:ring-accent focus:border-transparent outline-none
            transition-all duration-200 placeholder:text-gray-400
            ${Icon ? 'pl-10' : ''}
            ${error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-dark-600'
                        }
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
