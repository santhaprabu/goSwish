import { useState, useEffect } from 'react';
import {
    Clock, Check, ShieldCheck, Star, AlertTriangle
} from 'lucide-react';
import {
    getBookingWithTracking,
    verifyJobCode,
    checkVerificationAndStart,
    approveJob,
    getDoc,
    COLLECTIONS
} from '../storage';
import LiveTracking from './LiveTracking';

export default function CustomerActiveJob({ booking, onBack, onComplete }) {
    const [job, setJob] = useState(booking);
    const [cleaner, setCleaner] = useState(null);

    // Determine initial step
    const getInitialStep = (status) => {
        if (status === 'on_the_way') return 'tracking';
        if (status === 'arrived') return 'verification';
        if (status === 'in_progress') return 'progress';
        if (status === 'completed_pending_approval') return 'review';
        if (status === 'approved') return 'rated';
        // Fallback for scheduled jobs that are about to start?
        return 'loading';
    };

    const [step, setStep] = useState(getInitialStep(booking.status));
    const [inputCode, setInputCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    // Load cleaner info
    useEffect(() => {
        const loadCleaner = async () => {
            if (job.cleanerId) {
                // Try fetching cleaner profile
                // Assuming we might have to search by cleanerId or userId
                // Actually cleanerId usually refers to the ID in CLEANERS collection
                const c = await getDoc(COLLECTIONS.CLEANERS, job.cleanerId);
                setCleaner(c);
            }
        };
        loadCleaner();
    }, [job.cleanerId]);

    // Polling for updates
    useEffect(() => {
        const interval = setInterval(async () => {
            const updated = await getBookingWithTracking(booking.id);
            setJob(updated);

            // State Machine transitions
            const nextStep = getInitialStep(updated.status);
            if (nextStep !== 'loading' && nextStep !== step) {
                setStep(nextStep);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [booking.id, step]);

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const success = await verifyJobCode(job.id, 'homeowner', inputCode);
            if (success) {
                const started = await checkVerificationAndStart(job.id);
                if (started) setStep('progress');
            } else {
                alert("Incorrect code.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVerifying(false);
        }
    };

    const handleApprove = async () => {
        if (window.confirm("Approve the job and release payment?")) {
            await approveJob(job.id, {
                overall: 5,
                review: "Great job!"
            });
            setStep('rated');
            onComplete();
        }
    };

    // --- Render ---

    if (step === 'tracking') {
        return (
            <LiveTracking
                booking={job}
                cleaner={cleaner || { name: 'Your Cleaner' }}
                onBack={onBack}
            />
        );
    }

    if (step === 'verification') {
        const customerCode = job.verificationCodes?.customerCode;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col p-6">
                <div className="text-center mb-8 mt-4">
                    {job.bookingId && (
                        <p className="text-xs text-gray-500 mb-2">Booking: <span className="font-mono font-semibold">{job.bookingId}</span></p>
                    )}
                    <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Verify Your Cleaner</h1>
                    <p className="text-gray-600">Exchange codes at the door for safety.</p>
                </div>

                <div className="card p-6 mb-6 bg-blue-50 border-blue-200">
                    <p className="text-sm font-bold text-blue-800 uppercase mb-2">Give this code to Cleaner</p>
                    <div className="text-4xl font-mono font-bold text-center tracking-widest bg-white py-4 rounded-lg">
                        {customerCode || '....'}
                    </div>
                </div>

                <div className="card p-6 mb-6">
                    <p className="text-sm font-bold text-gray-700 uppercase mb-2">Enter Cleaner's Code</p>
                    <input
                        type="text"
                        maxLength={4}
                        onChange={e => setInputCode(e.target.value)}
                        className="w-full text-center text-3xl font-mono p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        placeholder="0000"
                    />
                </div>

                {!job.verificationCodes?.customerVerified ? (
                    <button
                        onClick={handleVerify}
                        disabled={inputCode.length !== 4 || verifying}
                        className="btn bg-blue-600 text-white w-full py-4 text-lg"
                    >
                        {verifying ? 'Verifying...' : 'Verify Cleaner'}
                    </button>
                ) : (
                    <div className="text-center text-green-600 font-bold animate-pulse">
                        Waiting for cleaner to verify...
                    </div>
                )}
            </div>
        );
    }

    if (step === 'progress') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center mb-8 mt-4">
                    {job.bookingId && (
                        <p className="text-xs text-gray-500 mb-2">Booking: <span className="font-mono font-semibold">{job.bookingId}</span></p>
                    )}
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-blue-600 animate-spin-slow" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Cleaning in Progress</h1>
                    <p className="text-gray-600">Your cleaner is working hard!</p>
                </div>

                <div className="card p-6">
                    <h3 className="font-bold mb-4">Status Updates</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">Verified & Secured</p>
                                <p className="text-xs text-gray-500">Identity confirmed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">Job in Progress</p>
                                <p className="text-xs text-gray-500">Started at {new Date(job.jobStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        {/* We could add polling for current task here if we wanted deeper checklist visibility */}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'review') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
                {job.bookingId && (
                    <p className="text-xs text-gray-500 mb-4">Booking: <span className="font-mono font-semibold">{job.bookingId}</span></p>
                )}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Cleaning Complete!</h1>
                <p className="text-center text-gray-600 mb-8">
                    Your cleaner has marked the job as done. Please review the work.
                </p>

                {job.finalPhotos && job.finalPhotos.length > 0 && (
                    <div className="w-full grid grid-cols-2 gap-2 mb-6">
                        {job.finalPhotos.map((url, i) => (
                            <img key={i} src={url} className="w-full h-32 object-cover rounded-lg" />
                        ))}
                    </div>
                )}

                <div className="w-full space-y-3">
                    <button onClick={handleApprove} className="btn bg-green-600 text-white w-full py-4 text-lg">
                        Approve & Pay
                    </button>
                    <button className="btn btn-ghost w-full py-4 text-red-600">
                        Report Issue / Re-clean
                    </button>
                </div>
            </div>
        );
    }

    return <div className="p-10 text-center"><Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" /> Loading Job...</div>;
}
