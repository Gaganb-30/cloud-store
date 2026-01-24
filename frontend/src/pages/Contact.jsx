/**
 * Contact Page
 */
import { motion } from 'framer-motion';
import { MessageCircle, Crown, Shield, Zap, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contact() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-dark-900 dark:to-dark-800"
        >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Contact
                    </span>
                    <Link
                        to="/"
                        className="text-sm text-gray-500 hover:text-accent transition-colors"
                    >
                        Back to app →
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Title */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Get In Touch
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Have questions? Want to upgrade to Premium? Reach out to us!
                    </p>
                </div>

                {/* Main Contact Card - Premium */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-12"
                >
                    {/* Glowing border effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-2xl blur-lg opacity-75 animate-pulse" />

                    <div className="relative bg-gray-900 dark:bg-dark-800 rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Crown className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Premium Inquiries</h2>
                                <p className="text-gray-400">Upgrade to unlimited storage & features</p>
                            </div>
                        </div>

                        {/* Discord Contact */}
                        <div className="bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-xl p-6 mb-4">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-8 h-8 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                <span className="text-xl font-bold text-white">Discord</span>
                            </div>
                            <div className="flex items-center justify-between bg-[#5865F2]/10 rounded-lg p-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Add me on Discord</p>
                                    <p className="text-2xl font-bold text-white font-mono">@6_venomx_9</p>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText('@6_venomx_9')}
                                    className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        {/* Email Contact */}
                        <div className="bg-accent/20 border border-accent/30 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xl font-bold text-white">Email</span>
                            </div>
                            <div className="flex items-center justify-between bg-accent/10 rounded-lg p-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Send us an email</p>
                                    <a href="mailto:support@toxicgame.net" className="text-2xl font-bold text-accent hover:underline">
                                        support@toxicgame.net
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Premium Benefits */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                <p className="text-white font-medium">Unlimited Storage</p>
                                <p className="text-gray-400 text-sm">No file size limits</p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                <p className="text-white font-medium">No Expiry</p>
                                <p className="text-gray-400 text-sm">Files never expire</p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                                <Crown className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                <p className="text-white font-medium">Priority Support</p>
                                <p className="text-gray-400 text-sm">Fast response times</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Other Contact Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* General Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-dark-700 rounded-xl p-6 border border-gray-200 dark:border-dark-600"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <HeartHandshake className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General Support</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            For general questions, bug reports, or feature requests, reach out on Discord.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Response time: Within 24 hours
                        </p>
                    </motion.div>

                    {/* DMCA Requests */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-dark-700 rounded-xl p-6 border border-gray-200 dark:border-dark-600"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DMCA Requests</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            For copyright takedown requests, please visit our DMCA policy page.
                        </p>
                        <Link
                            to="/dmca"
                            className="text-accent hover:underline font-medium"
                        >
                            View DMCA Policy →
                        </Link>
                    </motion.div>
                </div>

                {/* Footer Note */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        We typically respond within 24 hours. Thank you for using CloudVault!
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
