/**
 * Home Page
 */
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Upload, Download, Shield, Zap, Cloud, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const features = [
    {
        icon: Upload,
        title: 'Chunked Uploads',
        description: 'Resume uploads anytime. Never lose progress on large files.',
    },
    {
        icon: Zap,
        title: 'Blazing Fast',
        description: 'SSD storage for frequently accessed files. Lightning quick downloads.',
    },
    {
        icon: Shield,
        title: 'Secure',
        description: 'End-to-end encryption and hash verification for all files.',
    },
    {
        icon: Download,
        title: 'Direct Downloads',
        description: 'No waiting. No ads. Just fast, direct file downloads.',
    },
];

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Helmet>
                <title>CloudVault - Fast & Secure File Hosting</title>
                <meta name="description" content="Upload, store, and share files with lightning-fast speeds. Chunked uploads, tiered storage, and enterprise-grade security." />
            </Helmet>

            <div className="min-h-[calc(100vh-4rem)]">
                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent dark:from-accent/10" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-3xl mx-auto"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                                <Cloud className="w-4 h-4" />
                                <span>File hosting reimagined</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                                Store & share files{' '}
                                <span className="text-gradient">at lightning speed</span>
                            </h1>

                            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                                Upload files up to 10GB with resumable chunked uploads.
                                Tiered storage ensures your files are always fast to access.
                            </p>

                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                {isAuthenticated ? (
                                    <Link to="/upload">
                                        <Button size="lg" icon={Upload}>
                                            Upload Files
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/register">
                                            <Button size="lg">
                                                Get Started Free
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link to="/login">
                                            <Button size="lg" variant="secondary">
                                                Log in
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-24 bg-gray-50 dark:bg-dark-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">Why CloudVault?</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">
                                Built for speed, security, and reliability
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card p-6 text-center hover:shadow-xl transition-shadow"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-accent" />
                                    </div>
                                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Ready to start uploading?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Create a free account and get 50GB of storage instantly.
                        </p>
                        <Link to="/register">
                            <Button size="lg">
                                Create Free Account
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
