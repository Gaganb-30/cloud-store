/**
 * Button Component
 */
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/20 dark:shadow-accent/10',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-white',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
};

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
                <Icon className="w-4 h-4" />
            ) : null}
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
