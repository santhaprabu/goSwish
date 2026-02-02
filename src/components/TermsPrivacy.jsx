
import { useState } from 'react';
/*
 * ============================================================================
 * TERMS & PRIVACY VIEW
 * ============================================================================
 * 
 * Purpose:
 * Displays legal agreements (TOS / Privacy Policy).
 * 
 * Tech:
 * - Simple toggle state to switch between text blocks.
 */
import { ChevronLeft, FileText, Shield } from 'lucide-react';

export default function TermsPrivacy({ onBack }) {
    const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg -ml-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Terms & Privacy</h1>
                    <div className="w-10" />
                </div>

                {/* Tabs */}
                <div className="flex border-t">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                            ${activeTab === 'terms'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Terms of Service
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                            ${activeTab === 'privacy'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Privacy Policy
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-white">
                {activeTab === 'terms' ? (
                    <div className="space-y-6 text-gray-600 animate-fade-in">
                        <div className="flex items-center gap-3 text-gray-900 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Terms of Service</h2>
                                <p className="text-xs text-gray-500">Last updated: Jan 25, 2026</p>
                            </div>
                        </div>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">1. Introduction</h3>
                            <p className="text-sm leading-relaxed">
                                Welcome to GoSwish. By accessing or using our platform, you agree to be bound by these Terms.
                                Our platform connects customers with independent cleaning professionals.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">2. Booking Services</h3>
                            <p className="text-sm leading-relaxed">
                                When you book a service, you agree to pay the displayed price.
                                Instant bookings are confirmed immediately.
                                Cancellations made less than 24 hours before the start time may be subject to a cancellation fee of $50.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">3. Payments</h3>
                            <p className="text-sm leading-relaxed">
                                Payments are processed securely via Stripe. We do not store your credit card details on our servers.
                                Payment is captured upon successful completion of the service.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">4. User Conduct</h3>
                            <p className="text-sm leading-relaxed">
                                You agree to provide a safe environment for cleaners.
                                Harassment or misconduct towards any user on the platform will result in immediate termination of your account.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">5. Liability</h3>
                            <p className="text-sm leading-relaxed">
                                GoSwish is a platform. While we background check cleaners, we are not liable for incidental damages unless covered by our Satisfaction Guarantee.
                            </p>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-6 text-gray-600 animate-fade-in">
                        <div className="flex items-center gap-3 text-gray-900 mb-6">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Privacy Policy</h2>
                                <p className="text-xs text-gray-500">Last updated: Jan 25, 2026</p>
                            </div>
                        </div>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">1. Information We Collect</h3>
                            <p className="text-sm leading-relaxed">
                                We collect information you provide directly to us, such as your name, email, phone number, and property details.
                                We also collect payment information via our payment processor.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">2. How We Use Information</h3>
                            <p className="text-sm leading-relaxed">
                                We use your info to facilitate cleaning services, process payments, and communicate with you about your bookings.
                                We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">3. Location Data</h3>
                            <p className="text-sm leading-relaxed">
                                For cleaners, we track location during active jobs to ensure safety and confirm arrival/departure times.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-bold text-gray-900">4. Data Security</h3>
                            <p className="text-sm leading-relaxed">
                                We implement industry-standard security measures to protect your data.
                                However, no method of transmission over the Internet is 100% secure.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
