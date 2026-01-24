/**
 * Documentation / FAQ Page
 */
import { motion } from 'framer-motion';
import { Book, ChevronDown, ChevronUp, Code, HelpCircle, Upload, Download, Shield, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// FAQ Item Component
function FAQItem({ question, answer, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-accent" />}
                    <span className="font-medium text-gray-900 dark:text-white text-left">{question}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>
            {isOpen && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600">
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {answer}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Docs() {
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
                        <Book className="w-4 h-4" />
                        Documentation
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
                        Documentation & FAQ
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Everything you need to know about using CloudVault
                    </p>
                </div>

                {/* Quick Info Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-5 border border-gray-200 dark:border-dark-600 text-center">
                        <Upload className="w-8 h-8 text-accent mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Max File Size</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">10 GB (Free) / Unlimited (Premium)</p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-5 border border-gray-200 dark:border-dark-600 text-center">
                        <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">File Retention</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">5 days (Free) / Permanent (Premium)</p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-5 border border-gray-200 dark:border-dark-600 text-center">
                        <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Storage</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">25 GB (Free) / Unlimited (Premium)</p>
                    </div>
                </div>

                {/* API Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <Code className="w-7 h-7 text-accent" />
                        API Access
                    </h2>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <Code className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">API Upload - Coming Soon</h3>
                                <p className="text-gray-300 mb-4">
                                    Our public API for programmatic file uploads is currently under development and not available at this time.
                                </p>
                                <p className="text-gray-400 text-sm">
                                    We're working on providing a robust API for developers. Stay tuned for updates or contact us
                                    if you have specific integration needs.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <HelpCircle className="w-7 h-7 text-accent" />
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-3">
                        <FAQItem
                            icon={Upload}
                            question="What is the maximum file size I can upload?"
                            answer={
                                <div>
                                    <p className="mb-1"><strong>Free users:</strong> Up to 10 GB per file</p>
                                    <p className="text-sm text-green-400 mb-2">💡 Tip: If the Free user files that reach 5+ downloads get their expiry extended by 1 day! and continue.</p>
                                    <p className="mb-3"><strong>Premium users:</strong> No file size limit - upload files of any size</p>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={Clock}
                            question="How long are my files stored?"
                            answer={
                                <div>
                                    <p className="mb-2"><strong>Free users:</strong> Files expire after 5 days of inactivity</p>
                                    <p><strong>Premium users:</strong> Files are stored permanently (no expiry)</p>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={Shield}
                            question="Is my data secure?"
                            answer={
                                <div>
                                    <p className="mb-2">Yes! We take security seriously:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>All files are stored on Cloudflare R2 with enterprise-grade security</li>
                                        <li>HTTPS encryption for all data transfers</li>
                                        <li>No-log policy - access logs are deleted after 24 hours</li>
                                        <li>Private links are not indexed or publicly accessible</li>
                                    </ul>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={Download}
                            question="Are there download limits?"
                            answer={
                                <div>
                                    <p className="mb-2"><strong>Free users:</strong> Standard download speeds with basic rate limiting</p>
                                    <p><strong>Premium users:</strong> Priority download speeds with higher limits</p>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={HelpCircle}
                            question="What file types can I upload?"
                            answer={
                                <div>
                                    <p className="mb-2">Most file types are allowed, including:</p>
                                    <ul className="list-disc list-inside space-y-1 mb-3">
                                        <li>Documents (PDF, DOC, TXT, etc.)</li>
                                        <li>Images (JPG, PNG, GIF, etc.)</li>
                                        <li>Videos (MP4, MKV, AVI, etc.)</li>
                                        <li>Archives (ZIP, RAR, 7Z, etc.)</li>
                                        <li>Software and applications</li>
                                    </ul>
                                    <p className="text-sm text-red-400">Prohibited: Adult content, malware, illegal content, CSAM</p>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={Zap}
                            question="How do I get Premium access?"
                            answer={
                                <div>
                                    <p className="mb-2">Premium access is available for site owners with significant traffic (250K+ monthly visitors).</p>
                                    <p className="mb-3">
                                        <Link to="/premium" className="text-accent hover:underline">
                                            Learn more about Premium eligibility →
                                        </Link>
                                    </p>
                                    <p className="text-sm text-gray-500">Contact us via Discord (@6_venomx_9) or email (support@toxicgame.net) to apply.</p>
                                </div>
                            }
                        />

                        <FAQItem
                            icon={Shield}
                            question="What happens if I upload copyrighted content?"
                            answer={
                                <div>
                                    <p className="mb-2">We comply with DMCA takedown requests. If content you upload is reported:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>We didn’t hear anything… ahem ahem 👀</li>
                                    </ul>
                                    <p className="mt-3">
                                        <Link to="/dmca" className="text-accent hover:underline">
                                            Read our full DMCA policy →
                                        </Link>
                                    </p>
                                </div>
                            }
                        />
                    </div>
                </section>

                {/* Contact Section */}
                <section className="mb-12">
                    <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/30 rounded-xl p-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
                        <p className="text-gray-300 mb-4">Our team is here to help!</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                to="/contact"
                                className="px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors"
                            >
                                Contact Us
                            </Link>
                            <a
                                href="mailto:support@toxicgame.net"
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                            >
                                Email Support
                            </a>
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
