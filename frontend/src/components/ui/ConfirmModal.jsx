/**
 * Confirm Modal Component
 * Custom styled confirmation dialog with warning support
 */
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning', // 'warning' | 'danger' | 'info'
    details = [],
    note = '',
    loading = false,
}) {
    if (!isOpen) return null;

    const variantStyles = {
        warning: {
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            buttonClass: 'bg-amber-500 hover:bg-amber-600',
        },
        danger: {
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonClass: 'bg-red-500 hover:bg-red-600',
        },
        info: {
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonClass: 'bg-blue-500 hover:bg-blue-600',
        },
    };

    const styles = variantStyles[variant] || variantStyles.warning;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`p-3 rounded-full ${styles.iconBg}`}>
                                        <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            {message}
                                        </p>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Details List */}
                                {details.length > 0 && (
                                    <div className="mt-4 ml-16 space-y-2">
                                        {details.map((detail, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                {detail}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Note */}
                                {note && (
                                    <div className="mt-4 ml-16 p-3 bg-gray-100 dark:bg-dark-700 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            <strong>Note:</strong> {note}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-dark-900/50 flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    {cancelText}
                                </Button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${styles.buttonClass} disabled:opacity-50`}
                                >
                                    {loading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
