import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * JOB EXECUTION WORKFLOW
 * ============================================================================
 * 
 * Purpose:
 * Handles the "Active Job" experience for Cleaners.
 * 
 * State Machine Phases:
 * 1. Overview: cleaner reviews details before starting.
 * 2. Trip: GPS tracking simulation during travel.
 * 3. Verification: 2-way Code Exchange at the door (Security).
 * 4. Execution: Checklist management during cleaning.
 * 5. Completion: Check-out and Review submission.
 * 
 * Key Logic:
 * - GPS Polling interval in 'Trip' phase.
 * - OTP Verification logic in 'Verification' phase.
 */
/**
 * ============================================================================
 * JOB EXECUTION WORKFLOW
 * ============================================================================
 * 
 * Purpose:
 * Handles the "Active Job" experience for Cleaners.
 * 
 * State Machine Phases:
 * 1. Overview: cleaner reviews details before starting.
 * 2. Trip: GPS tracking simulation during travel.
 * 3. Verification: 2-way Code Exchange at the door (Security).
 * 4. Execution: Checklist management during cleaning.
 * 5. Completion: Check-out and Review submission.
 * 
 * Key Logic:
 * - GPS Polling interval in 'Trip' phase.
 * - OTP Verification logic in 'Verification' phase.
 */
import {
    MapPin, Camera, CheckSquare, Clock, Navigation,
    Upload, ChevronRight, Check, X, AlertCircle, Play,
    Square, Image as ImageIcon, Loader2, ShieldCheck, Lock, Star
} from 'lucide-react';
import {
    updateBookingTracking,
    generateVerificationCodes,
    verifyJobCode,
    checkVerificationAndStart,
    submitJobForApproval,
    getBookingWithTracking,
    rateCustomer
} from '../storage';

import OTPInput from './OTPInput';
import { toLocalDateString } from '../utils/formatters';

// Job Execution - Complete workflow for cleaners
export default function JobExecution({ job, onComplete, onBack }) {
    const [currentStep, setCurrentStep] = useState('overview'); // overview, trip, verification, execution, complete, waiting_approval
    const [tripStatus, setTripStatus] = useState('not_started'); // not_started, in_progress, arrived
    const [verificationStatus, setVerificationStatus] = useState({ cleanerVerified: false, waitingForCustomer: false });
    const [myCode, setMyCode] = useState(null);
    const [inputCode, setInputCode] = useState('');

    // Rating State
    const [customerRating, setCustomerRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    // ... Existing State ...
    const [jobStatus, setJobStatus] = useState('not_started');
    const [startTime, setStartTime] = useState(null);
    const [arrivalTime, setArrivalTime] = useState(null);
    const [completionTime, setCompletionTime] = useState(null);

    // Mock location tracking
    const [currentLocation, setCurrentLocation] = useState({ lat: 32.7767, lng: -96.7970 });
    const [distance, setDistance] = useState(3.2);
    const [eta, setEta] = useState(12);

    // Photos state
    const [photos, setPhotos] = useState({});
    const [uploadingPhotos, setUploadingPhotos] = useState([]);

    // Checklist state
    const [checklist, setChecklist] = useState([]);
    const [completedTasks, setCompletedTasks] = useState(0);

    // Polling for status updates during verification
    useEffect(() => {
        let interval;
        if (currentStep === 'verification' && verificationStatus.waitingForCustomer) {
            interval = setInterval(async () => {
                const booking = await getBookingWithTracking(job.id);
                if (booking?.status === 'in_progress') {
                    // Both verified!
                    setCurrentStep('execution');
                    setJobStatus('in_progress');
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [currentStep, verificationStatus.waitingForCustomer, job.id]);

    const generateChecklist = () => {
        const tasks = [];
        const rooms = ['Kitchen', 'Living Room', 'Bathroom 1', 'Bathroom 2', 'Bedroom 1', 'Bedroom 2'];
        const serviceTasks = {
            'regular': ['Dust surfaces', 'Vacuum floors', 'Mop hard floors', 'Clean mirrors'],
            'deep': ['Dust surfaces', 'Vacuum floors', 'Mop hard floors', 'Clean mirrors', 'Wipe baseboards', 'Clean inside cabinets'],
            'move': ['Deep clean all surfaces', 'Clean inside all cabinets', 'Clean inside appliances', 'Wipe all baseboards', 'Clean windows'],
            'windows': ['Clean all windows inside', 'Clean window sills', 'Clean window tracks']
        };
        const taskList = serviceTasks[job.serviceType] || serviceTasks['regular'];
        rooms.forEach((room, roomIndex) => {
            taskList.forEach((task, taskIndex) => {
                tasks.push({
                    id: `task-${roomIndex}-${taskIndex}`,
                    room,
                    title: task,
                    required: taskIndex < 3,
                    status: 'not_started',
                    notes: ''
                });
            });
        });
        if (job.addOns?.includes('inside-fridge')) tasks.push({ id: 'addon-fridge', room: 'Kitchen', title: 'Clean inside refrigerator', required: true, status: 'not_started', notes: '' });
        if (job.addOns?.includes('inside-oven')) tasks.push({ id: 'addon-oven', room: 'Kitchen', title: 'Clean inside oven', required: true, status: 'not_started', notes: '' });
        setChecklist(tasks);
    };

    useEffect(() => {
        generateChecklist();
    }, []);

    const handleStartTrip = async () => {
        // Validate that today's date matches the scheduled date (using LOCAL timezone)
        const today = toLocalDateString(new Date());
        const scheduledDate = job.selectedDate?.date || job.scheduledDate;

        if (!scheduledDate) {
            alert("Unable to verify scheduled date. Please contact support.");
            return;
        }

        // Parse and compare dates using LOCAL timezone
        const scheduledDateStr = toLocalDateString(new Date(scheduledDate));

        if (today !== scheduledDateStr) {
            const formattedScheduledDate = new Date(scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            alert(`You can only start this cleaning on the scheduled date.\n\nScheduled Date: ${formattedScheduledDate}\n\nPlease return on the scheduled date to begin.`);
            return;
        }

        // Generate Verification Codes immediately 
        try {
            const { cleanerCode } = await generateVerificationCodes(job.id);
            setMyCode(cleanerCode);
        } catch (e) {
            console.error("Error generating codes", e);
        }

        setTripStatus('in_progress');
        setStartTime(new Date());
        setCurrentStep('trip');

        updateBookingTracking(job.id, {
            status: 'on_the_way',
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            distance: distance,
            eta: eta
        });

        const interval = setInterval(() => {
            setDistance(prev => {
                const newDist = Math.max(0, prev - 0.3);
                const newEta = Math.ceil((newDist / 3.2) * 12);

                const trackingUpdate = {
                    status: newDist === 0 ? 'arrived' : 'on_the_way',
                    lat: currentLocation.lat + (Math.random() * 0.005 - 0.0025),
                    lng: currentLocation.lng + (Math.random() * 0.005 - 0.0025),
                    distance: newDist,
                    eta: newEta
                };

                updateBookingTracking(job.id, trackingUpdate);

                if (newDist === 0) {
                    clearInterval(interval);
                    setTripStatus('arrived');
                    setArrivalTime(new Date());
                    // We stay on the same screen, but the UI will adapt to show the OTP input
                }
                return newDist;
            });
            setEta(prev => Math.max(0, prev - 1));
        }, 1000); // Speed up for demo
    };

    const handleArrived = async () => {
        setTripStatus('arrived');
        setArrivalTime(new Date());

        // Generate Verification Codes
        try {
            const { cleanerCode } = await generateVerificationCodes(job.id);
            setMyCode(cleanerCode);
            setCurrentStep('verification');
        } catch (e) {
            console.error("Error generating codes", e);
            alert("Error connecting. Please try again.");
        }
    };

    const handleVerifyCode = async () => {
        if (inputCode.length !== 6) return;
        try {
            const success = await verifyJobCode(job.id, 'cleaner', inputCode);
            if (success) {
                setVerificationStatus(prev => ({ ...prev, cleanerVerified: true, waitingForCustomer: true }));

                // Check if customer already verified too
                const started = await checkVerificationAndStart(job.id);
                if (started) {
                    setCurrentStep('execution');
                    setJobStatus('in_progress');
                }
            } else {
                alert("Incorrect code. Please ask the customer for their 6-digit code.");
            }
        } catch (e) {
            console.error(e);
            alert("Verification failed");
        }
    };

    const handleStartJob = () => {
        // Fallback manual start if needed (e.g. bypass verification in dev)
        setJobStatus('in_progress');
        setCurrentStep('execution');
    };

    const handlePhotoUpload = (room, stage, files) => {
        const roomKey = `${room}-${stage}`;
        const newPhotos = Array.from(files).map(file => ({
            id: `${roomKey}-${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file), // Mock URL
            room,
            stage,
            uploading: true
        }));
        setUploadingPhotos(prev => [...prev, ...newPhotos.map(p => p.id)]);
        newPhotos.forEach(photo => {
            setTimeout(() => {
                setPhotos(prev => ({
                    ...prev,
                    [roomKey]: [...(prev[roomKey] || []), { ...photo, uploading: false }]
                }));
                setUploadingPhotos(prev => prev.filter(id => id !== photo.id));
            }, 2000);
        });
    };

    const handleToggleTask = (taskId) => {
        setChecklist(prev => prev.map(task => {
            if (task.id === taskId) {
                const newStatus = task.status === 'done' ? 'not_started' : 'done';
                if (newStatus === 'done' && task.status !== 'done') {
                    setCompletedTasks(c => c + 1);
                } else if (newStatus === 'not_started' && task.status === 'done') {
                    setCompletedTasks(c => c - 1);
                }
                return { ...task, status: newStatus };
            }
            return task;
        }));
    };

    const handleCompleteJob = async () => {
        const requiredTasks = checklist.filter(t => t.required);
        const completedRequired = requiredTasks.filter(t => t.status === 'done');

        if (completedRequired.length < requiredTasks.length) {
            alert(`Please complete all ${requiredTasks.length - completedRequired.length} required tasks before finishing.`);
            return;
        }

        if (window.confirm("Are you sure you want to complete the job and submit for approval?")) {
            setJobStatus('completed');
            setCompletionTime(new Date());

            // Collect photos for final submission
            const allPhotos = Object.values(photos).flat().map(p => p.url);

            try {
                await submitJobForApproval(job.id, "Job finished successfully.", allPhotos);
                setCurrentStep('waiting_approval');
            } catch (e) {
                console.error(e);
                alert("Error submitting job.");
            }
        }
    };

    const calculateDuration = () => {
        if (!startTime || !completionTime) return '0h 0m';
        const diff = completionTime - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // --- Render Steps ---

    if (currentStep === 'overview') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={onBack} className="p-2">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-lg font-semibold">Job Details</h1>
                    <div className="w-10" />
                </div>
                <div className="px-6 py-6 space-y-6">
                    {/* Job Info */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-secondary-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 capitalize">{job.serviceType} Clean</h2>
                                <p className="text-sm text-gray-500">{job.house?.address?.street}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium text-gray-900">{job.selectedDate?.date}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Earnings</span><span className="font-bold text-secondary-600">${job.earnings}</span></div>
                        </div>
                    </div>
                    {/* Add-ons etc.. (Simplifying for brevity) */}
                    <button onClick={handleStartTrip} className="btn btn-secondary w-full py-4 text-lg">
                        <Navigation className="w-5 h-5 mr-2" /> Start Trip
                    </button>
                </div>
            </div>
        );
    }

    if (currentStep === 'trip') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar bg-secondary-600 text-white">
                    <div className="px-4 py-3">
                        <h1 className="text-lg font-semibold text-center">
                            {tripStatus === 'arrived' ? 'Arrived at Destination' : 'En Route to Client'}
                        </h1>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Trip Info Header */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-secondary-50 rounded-full flex items-center justify-center">
                            <Navigation className={`w-6 h-6 text-secondary-600 ${tripStatus === 'in_progress' ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{job.house?.address?.street || job.address?.street}</p>
                            <p className="text-xs text-gray-500">{job.house?.address?.city || job.address?.city}, TX</p>
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-4 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                            <p className="text-2xl font-black text-gray-900">{distance.toFixed(1)} <span className="text-sm font-bold text-gray-400">mi</span></p>
                        </div>
                        <div className="card p-4 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Arrival</p>
                            <p className="text-2xl font-black text-secondary-600">{eta} <span className="text-sm font-bold text-secondary-400">min</span></p>
                        </div>
                    </div>

                    {/* Verification Code Section (Visible once trip starts) */}
                    <div className="card p-6 bg-secondary-900 text-white border-none shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-secondary-400">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Safety Verification</span>
                            </div>

                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Give this to homeowner</p>
                            <div className="text-4xl font-black text-center tracking-[0.2em] bg-white/10 py-4 rounded-2xl border border-white/10 mb-6">
                                {myCode || '......'}
                            </div>

                            {tripStatus === 'arrived' && (
                                <div className="animate-in slide-in-from-bottom duration-500">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Ask customer for their code</p>
                                    <div className="flex justify-center mb-6">
                                        <OTPInput
                                            length={6}
                                            value={inputCode}
                                            onChange={setInputCode}
                                        />
                                    </div>

                                    {!verificationStatus.cleanerVerified ? (
                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={inputCode.length !== 6}
                                            className="w-full py-4 bg-secondary-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {inputCode.length === 6 ? 'Verify & Start Cleaning' : 'Enter 6-digit Code'}
                                        </button>
                                    ) : (
                                        <div className="bg-success-500/20 text-success-400 p-4 rounded-xl flex items-center justify-center gap-3 border border-success-500/30">
                                            <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-bold text-sm">Code Verified. Waiting for Client...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tripStatus === 'in_progress' && (
                                <div className="text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Verification will unlock upon arrival</p>
                                </div>
                            )}
                        </div>
                        <Lock className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
                    </div>

                    {/* Placeholder Map */}
                    <div className="h-48 bg-gray-200 rounded-3xl overflow-hidden relative border border-gray-100 italic flex items-center justify-center text-gray-400 text-sm">
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-96.797,32.776,12/400x200?access_token=pk.mock')] bg-cover opacity-50" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <Navigation className="w-8 h-8 animate-bounce text-secondary-500" />
                            <span>Live GPS Tracking</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentStep === 'verification') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
                <div className="app-bar bg-secondary-600 text-white">
                    <div className="px-4 py-3"><h1 className="text-lg font-semibold text-center">Verify Identity</h1></div>
                </div>
                <div className="flex-1 px-6 py-8 flex flex-col items-center">
                    <ShieldCheck className="w-16 h-16 text-secondary-600 mb-6" />
                    <h2 className="text-2xl font-bold text-center mb-2">Safety Verification</h2>
                    <p className="text-gray-600 text-center mb-8">Exchange codes with the customer to confirm identity.</p>

                    <div className="w-full card p-6 mb-6 bg-secondary-50 border-secondary-200">
                        <p className="text-sm font-bold text-secondary-800 uppercase mb-2">Your Code (Tell Customer)</p>
                        <div className="text-4xl font-mono font-bold text-center tracking-widest bg-white py-4 rounded-lg border border-secondary-100">
                            {myCode || '......'}
                        </div>
                    </div>

                    <div className="w-full card p-6 mb-8">
                        <p className="text-sm font-bold text-gray-700 uppercase mb-2">Customer Code (Enter Here)</p>
                        <div className="flex justify-center">
                            <OTPInput
                                length={6}
                                value={inputCode}
                                onChange={setInputCode}
                            />
                        </div>
                    </div>

                    {!verificationStatus.cleanerVerified ? (
                        <button
                            onClick={handleVerifyCode}
                            disabled={inputCode.length !== 6}
                            className="btn btn-secondary w-full py-4 text-lg"
                        >
                            Verify Code
                        </button>
                    ) : (
                        <div className="text-center animate-in fade-in">
                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold mb-2">
                                <Check className="w-6 h-6" /> Code Verified
                            </div>
                            <p className="text-gray-500 animate-pulse">Waiting for customer to verify...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (currentStep === 'execution') {
        // ... Previous Execution Render ...
        // (Simplified for brevity, using existing logic but wrapped in updated component)
        const rooms = [...new Set(checklist.map(t => t.room))];
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar bg-secondary-600 text-white">
                    <div className="px-4 py-3"><h1 className="text-lg font-semibold text-center">Job in Progress</h1></div>
                </div>
                {/* Progress bar and checklist here */}
                <div className="px-6 py-6 space-y-6">
                    {rooms.map(room => (
                        <div key={room} className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">{room}</h3>
                            <div className="space-y-2">
                                {checklist.filter(t => t.room === room).map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleToggleTask(task.id)}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3
                        ${task.status === 'done' ? 'border-success-300 bg-success-50' : 'border-gray-200 hover:border-secondary-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${task.status === 'done' ? 'border-success-500 bg-success-500' : 'border-gray-300'}`}>
                                            {task.status === 'done' && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${task.status === 'done' ? 'text-success-900 line-through' : 'text-gray-900'}`}>{task.title}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={handleCompleteJob} className="btn btn-secondary w-full py-4 text-lg">Complete Job</button>
                </div>
            </div>
        );
    }

    if (currentStep === 'waiting_approval') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 text-center">
                {!ratingSubmitted ? (
                    <>
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-12 h-12 text-blue-600 animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Approval</h1>
                        <p className="text-gray-600 mb-8">Awesome work! The customer has been notified and will review your cleaning shortly.</p>

                        {/* Rate Customer Card */}
                        <div className="card p-6 mb-6 text-left">
                            <h3 className="font-semibold text-gray-900 mb-4 text-center">How was the customer?</h3>
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setCustomerRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${star <= customerRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder="Any comments about the customer or property? (Optional)"
                                className="input w-full h-24 mb-4"
                            />
                            <button
                                onClick={async () => {
                                    if (customerRating === 0) {
                                        alert("Please select a star rating");
                                        return;
                                    }
                                    try {
                                        await rateCustomer(job.id, {
                                            rating: customerRating,
                                            comment: ratingComment,
                                            tags: []
                                        });
                                        setRatingSubmitted(true);
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to submit rating");
                                    }
                                }}
                                className="btn btn-primary w-full"
                            >
                                Submit Rating
                            </button>
                        </div>

                        <button onClick={onComplete} className="btn bg-gray-200 text-gray-700 w-full py-4">Back to Dashboard</button>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h1>
                        <p className="text-gray-600 mb-8">Thank you for your feedback. We'll let you know when the customer approves the job.</p>
                        <button onClick={onComplete} className="btn btn-secondary w-full py-4">Back to Dashboard</button>
                    </>
                )}
            </div>
        );
    }

    return null;
}
