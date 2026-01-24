/**
 * Premium Page
 * Information for site owners about getting free premium access
 */
import { motion } from 'framer-motion';
import { Crown, Globe, BarChart3, CheckCircle, XCircle, Shield, Mail, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Premium() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-dark-900 dark:to-dark-800"
        >
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-cyan-500/20" />

                <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mb-6">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm font-medium text-purple-300">Premium Access</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Free Premium for{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                            Site Owners
                        </span>
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        If you run a website with significant traffic, you may be eligible for free premium access
                        with unlimited storage and no file expiry.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Eligibility Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-accent" />
                        Eligibility Requirements
                    </h2>

                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">250K+ Monthly Visitors</h3>
                                <p className="text-gray-400">Based on SimilarWeb or Google Analytics data</p>
                            </div>
                        </div>
                        <p className="text-gray-300">
                            If your website receives <strong className="text-green-400">250,000+ monthly visitors</strong> according to
                            SimilarWeb or verified Google Analytics, you qualify for free premium access.
                        </p>
                    </div>
                </section>

                {/* What to Send */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <Globe className="w-7 h-7 text-accent" />
                        What to Send Us
                    </h2>

                    <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-accent font-bold text-lg">1.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Your Website URL</strong>
                                <p className="text-gray-600 dark:text-gray-400">The main domain of your website</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-accent font-bold text-lg">2.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Visitor Statistics</strong>
                                <p className="text-gray-600 dark:text-gray-400">
                                    SimilarWeb link or Google Analytics screenshot showing monthly traffic
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-accent font-bold text-lg">3.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Type of Content</strong>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Brief description of what content you'll be hosting
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Allowed Content */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-accent" />
                        Content Policy
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Allowed */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Allowed Content
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Software & Applications
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Games & Game Mods
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Images & Graphics
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Documents & PDFs
                                </li>
                                <li className="flex items-start gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                                    <span>
                                        Videos <span className="text-yellow-400 text-sm">(removed if copyright claim received)</span>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Not Allowed */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                Not Allowed
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Adult/Pornographic Content
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    CSAM or Child Exploitation
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Malware or Viruses
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Phishing or Scam Content
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    Other Illegal Content
                                </li>
                            </ul>
                            <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                                <p className="text-sm text-red-300">
                                    <strong>⚠️ Warning:</strong> Uploading illegal content will result in immediate account ban.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Privacy Policy */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <Eye className="w-7 h-7 text-accent" />
                        Privacy & Logging Policy
                    </h2>

                    <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <Trash2 className="w-5 h-5 text-green-400 mt-1" />
                            <div>
                                <strong className="text-gray-900 dark:text-white">No-Log Policy</strong>
                                <p className="text-gray-600 dark:text-gray-400">
                                    All access logs are automatically deleted after <strong>24 hours</strong>.
                                    We don't track or store your browsing activity.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-1" />
                            <div>
                                <strong className="text-gray-900 dark:text-white">Exception for Illegal Activity</strong>
                                <p className="text-gray-600 dark:text-gray-400">
                                    In case of verified illegal content (CSAM, terrorism, etc.), logs may be preserved
                                    and shared with law enforcement as required by law.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <Mail className="w-7 h-7 text-accent" />
                        Apply for Free Premium
                    </h2>

                    <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-6">
                        <p className="text-gray-300 mb-6">
                            If you meet the eligibility requirements, contact us with the information listed above:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Discord */}
                            <div className="bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    <span className="font-semibold text-white">Discord</span>
                                </div>
                                <p className="text-lg font-mono text-[#5865F2]">@6_venomx_9</p>
                            </div>

                            {/* Email */}
                            <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail className="w-5 h-5 text-accent" />
                                    <span className="font-semibold text-white">Email</span>
                                </div>
                                <a href="mailto:support@toxicgame.net" className="text-lg text-accent hover:underline">
                                    support@toxicgame.net
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Back Link */}
                <div className="text-center pt-8 border-t border-gray-200 dark:border-dark-700">
                    <Link
                        to="/"
                        className="text-accent hover:underline"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
