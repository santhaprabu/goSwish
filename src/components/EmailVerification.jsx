import { useState, useEffect } from 'react';
import { Mail, Clock, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EmailVerification({ onVerified, onSkip }) {
    const { user, verifyEmail } = useApp();
    const [canResend, setCanResend] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleResend = async () => {
        if (!canResend) return;

        setSending(true);
        setCanResend(false);

        // Simulate sending email
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSending(false);
        setCountdown(60);
    };

    const handleVerifyNow = async () => {
        // Simulate email verification (in real app, this would come from a link)
        if (user) {
            verifyEmail(user.uid);
            onVerified();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm text-center">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 mb-8">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Mail className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Verify Your Email
                </h1>

                {/* Description */}
                <p className="text-gray-500 mb-2">
                    We sent a verification link to
                </p>
                <p className="font-semibold text-gray-900 mb-6">
                    {user?.email || 'your@email.com'}
                </p>

                {/* Instructions */}
                <div className="bg-white rounded-2xl p-5 shadow-soft mb-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-3">What to do:</h3>
                    <ol className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full 
                              flex items-center justify-center text-xs font-bold">1</span>
                            Open the email from GoSwish
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full 
                              flex items-center justify-center text-xs font-bold">2</span>
                            Click the verification link
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full 
                              flex items-center justify-center text-xs font-bold">3</span>
                            Return here to continue
                        </li>
                    </ol>
                </div>

                {/* Demo: Verify Now button (simulates clicking email link) */}
                <button
                    onClick={handleVerifyNow}
                    className="btn btn-primary w-full mb-4 gap-2"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Verify Now (Demo)
                </button>

                {/* Resend button */}
                <button
                    onClick={handleResend}
                    disabled={!canResend || sending}
                    className="btn btn-ghost w-full gap-2 text-gray-600"
                >
                    {sending ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Sending...
                        </>
                    ) : canResend ? (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Resend Verification Email
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4" />
                            Resend in {countdown}s
                        </>
                    )}
                </button>

                {/* Skip for now (if allowed) */}
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="mt-6 text-sm text-gray-400 hover:text-gray-600"
                    >
                        Skip for now
                    </button>
                )}

                {/* Help text */}
                <p className="mt-8 text-xs text-gray-400">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button className="text-primary-500 hover:underline">contact support</button>
                </p>
            </div>
        </div>
    );
}
