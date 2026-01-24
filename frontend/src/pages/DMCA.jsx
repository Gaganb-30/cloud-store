/**
 * DMCA Takedown Policy Page
 */
import { motion } from 'framer-motion';
import { Shield, Mail, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DMCA() {
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
                        <Shield className="w-4 h-4" />
                        DMCA
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
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        DMCA Takedown Policy
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Information for copyright holders and DMCA agents regarding takedown requests.
                    </p>
                </div>

                {/* Overview */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-accent" />
                        Overview
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            CloudVault respects the intellectual property rights of others and expects our users to do the same. We are
                            committed to responding to valid DMCA takedown notices in accordance with the Digital Millennium Copyright
                            Act (DMCA) and other applicable copyright laws.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                            While we cannot prevent all users from uploading copyrighted content, we take copyright infringement
                            seriously and will promptly remove files when we receive a valid takedown request.
                        </p>
                    </div>
                </section>

                {/* Filing a DMCA Request */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        Filing a DMCA Takedown Request
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        If you believe that content hosted on CloudVault infringes your copyright, you may submit a DMCA takedown
                        notice. To be effective, your notice must include the following information:
                    </p>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <span className="text-accent font-bold">1.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Identification of the copyrighted work:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    A description or link to the copyrighted work that you claim has been infringed.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-accent font-bold">2.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Identification of the infringing material:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    The specific URL(s) or file link(s) where the allegedly infringing content is located on CloudVault.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-accent font-bold">3.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Your contact information:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    Your full name, mailing address, telephone number, and email address.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-accent font-bold">4.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Good faith statement:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-accent font-bold">5.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Accuracy statement:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    A statement that the information in your notice is accurate and, under penalty of perjury, that you are the copyright owner or authorized to act on behalf of the copyright owner.
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="text-accent font-bold">6.</span>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Physical or electronic signature:</strong>
                                <span className="text-gray-600 dark:text-gray-300 ml-1">
                                    Your physical or electronic signature (or that of the person authorized to act on behalf of the copyright owner).
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Submit */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail className="w-6 h-6 text-accent" />
                        How to Submit a Takedown Request
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Please send your DMCA takedown notice to our designated agent:
                    </p>

                    <div className="bg-gray-100 dark:bg-dark-700 rounded-xl p-6 border border-gray-200 dark:border-dark-600">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Designated DMCA Agent</h3>
                        <div className="space-y-2 text-gray-600 dark:text-gray-300">
                            <p><strong>Email:</strong> <a href="mailto:support@toxicgame.net" className="text-accent hover:underline">support@toxicgame.net</a></p>
                            <p><strong>Discord:</strong> @6_venomx_9</p>
                            <p><strong>Subject Line:</strong> DMCA Takedown Request</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Please include all required information listed above in your message. Incomplete notices may delay our response.
                    </p>
                </section>

                {/* Response Process */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-accent" />
                        Our Response Process
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <p className="text-gray-600 dark:text-gray-300">
                                Upon receiving a valid DMCA takedown notice, we will promptly remove or disable access to the allegedly infringing content.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <p className="text-gray-600 dark:text-gray-300">
                                We will notify the uploader of the removal and provide them with information about filing a counter-notification.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <p className="text-gray-600 dark:text-gray-300">
                                Repeat infringers may have their accounts terminated in accordance with our Terms of Service.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Counter-Notification */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        Counter-Notification
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        If you believe that content you uploaded was removed in error, you may submit a counter-notification.
                        Counter-notifications must comply with the requirements set forth in the DMCA. Please contact us for more information.
                    </p>
                </section>

                {/* Footer Note */}
                <div className="pt-8 border-t border-gray-200 dark:border-dark-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        This policy is subject to change. Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
