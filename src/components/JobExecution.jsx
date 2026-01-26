import { useState, useEffect } from 'react';
import {
    MapPin, Camera, CheckSquare, Clock, Navigation,
    Upload, ChevronRight, Check, X, AlertCircle, Play,
    Square, Image as ImageIcon, Loader2
} from 'lucide-react';

// Job Execution - Complete workflow for cleaners
export default function JobExecution({ job, onComplete, onBack }) {
    const [currentStep, setCurrentStep] = useState('overview'); // overview, trip, execution, complete
    const [tripStatus, setTripStatus] = useState('not_started'); // not_started, in_progress, arrived
    const [jobStatus, setJobStatus] = useState('not_started'); // not_started, in_progress, completed
    const [startTime, setStartTime] = useState(null);
    const [arrivalTime, setArrivalTime] = useState(null);
    const [completionTime, setCompletionTime] = useState(null);

    // Mock location tracking
    const [currentLocation, setCurrentLocation] = useState({ lat: 32.7767, lng: -96.7970 }); // Dallas
    const [distance, setDistance] = useState(3.2); // miles
    const [eta, setEta] = useState(12); // minutes

    // Photos state
    const [photos, setPhotos] = useState({});
    const [uploadingPhotos, setUploadingPhotos] = useState([]);

    // Checklist state
    const [checklist, setChecklist] = useState([]);
    const [completedTasks, setCompletedTasks] = useState(0);

    // Generate checklist on mount
    useEffect(() => {
        generateChecklist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateChecklist = () => {
        const tasks = [];
        const rooms = ['Kitchen', 'Living Room', 'Bathroom 1', 'Bathroom 2', 'Bedroom 1', 'Bedroom 2'];

        // Service-specific tasks
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
                    required: taskIndex < 3, // First 3 tasks are required
                    status: 'not_started',
                    notes: ''
                });
            });
        });

        // Add-on specific tasks
        if (job.addOns?.includes('inside-fridge')) {
            tasks.push({
                id: 'addon-fridge',
                room: 'Kitchen',
                title: 'Clean inside refrigerator',
                required: true,
                status: 'not_started',
                notes: ''
            });
        }

        if (job.addOns?.includes('inside-oven')) {
            tasks.push({
                id: 'addon-oven',
                room: 'Kitchen',
                title: 'Clean inside oven',
                required: true,
                status: 'not_started',
                notes: ''
            });
        }

        setChecklist(tasks);
    };

    const handleStartTrip = () => {
        setTripStatus('in_progress');
        setStartTime(new Date());
        setCurrentStep('trip');

        // Simulate location updates
        const interval = setInterval(() => {
            setDistance(prev => {
                const newDist = Math.max(0, prev - 0.3);
                if (newDist === 0) {
                    clearInterval(interval);
                    setTripStatus('arrived');
                }
                return newDist;
            });
            setEta(prev => Math.max(0, prev - 1));
        }, 3000);
    };

    const handleArrived = () => {
        setTripStatus('arrived');
        setArrivalTime(new Date());
    };

    const handleStartJob = () => {
        setJobStatus('in_progress');
        setCurrentStep('execution');
    };

    const handlePhotoUpload = (room, stage, files) => {
        const roomKey = `${room}-${stage}`;
        const newPhotos = Array.from(files).map(file => ({
            id: `${roomKey}-${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file),
            room,
            stage,
            uploading: true
        }));

        setUploadingPhotos(prev => [...prev, ...newPhotos.map(p => p.id)]);

        // Simulate upload
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

    const handleCompleteJob = () => {
        const requiredTasks = checklist.filter(t => t.required);
        const completedRequired = requiredTasks.filter(t => t.status === 'done');

        if (completedRequired.length < requiredTasks.length) {
            alert(`Please complete all ${requiredTasks.length - completedRequired.length} required tasks before finishing.`);
            return;
        }

        setJobStatus('completed');
        setCompletionTime(new Date());
        setCurrentStep('complete');
    };

    const calculateDuration = () => {
        if (!startTime || !completionTime) return '0h 0m';
        const diff = completionTime - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Overview Screen
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
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium text-gray-900">{job.selectedDate?.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Time</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {job.selectedDate?.timeSlot} ({job.selectedDate?.startTime} - {job.selectedDate?.endTime})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Earnings</span>
                                <span className="font-bold text-secondary-600">${job.earnings}</span>
                            </div>
                        </div>
                    </div>

                    {/* House Details */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Size</p>
                                <p className="font-medium text-gray-900">{job.house?.sqft} sqft</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Bedrooms</p>
                                <p className="font-medium text-gray-900">{job.house?.bedrooms}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Bathrooms</p>
                                <p className="font-medium text-gray-900">{job.house?.bathrooms}</p>
                            </div>
                        </div>

                        {job.house?.pets?.hasPets && (
                            <div className="mt-4 p-3 bg-warning-50 rounded-lg">
                                <p className="text-sm font-medium text-warning-900">🐾 Pets in home</p>
                                {job.house.pets.notes && (
                                    <p className="text-xs text-warning-700 mt-1">{job.house.pets.notes}</p>
                                )}
                            </div>
                        )}

                        {job.house?.accessNotes && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-1">Access Instructions</p>
                                <p className="text-sm text-gray-700">{job.house.accessNotes}</p>
                            </div>
                        )}
                    </div>

                    {/* Special Notes */}
                    {job.specialNotes && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                            <p className="text-sm text-gray-700">{job.specialNotes}</p>
                        </div>
                    )}

                    {/* Add-ons */}
                    {job.addOns && job.addOns.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Add-on Services</h3>
                            <div className="space-y-2">
                                {job.addOns.map((addon, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-secondary-600" />
                                        <span className="text-sm text-gray-700 capitalize">
                                            {addon.replace('-', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Start Trip Button */}
                    <button
                        onClick={handleStartTrip}
                        className="btn btn-secondary w-full py-4 text-lg"
                    >
                        <Navigation className="w-5 h-5 mr-2" />
                        Start Trip
                    </button>
                </div>
            </div>
        );
    }

    // Trip Tracking Screen
    if (currentStep === 'trip') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar bg-secondary-600 text-white">
                    <div className="px-4 py-3">
                        <h1 className="text-lg font-semibold text-center">
                            {tripStatus === 'arrived' ? 'Arrived' : 'On the Way'}
                        </h1>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Map Placeholder */}
                    <div className="card p-0 overflow-hidden h-64 bg-gray-100 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Map View</p>
                                <p className="text-xs text-gray-400 mt-1">GPS tracking simulation</p>
                            </div>
                        </div>
                    </div>

                    {/* Trip Stats */}
                    {tripStatus === 'in_progress' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="card p-4 text-center">
                                <p className="text-sm text-gray-500 mb-1">Distance</p>
                                <p className="text-2xl font-bold text-gray-900">{distance.toFixed(1)} mi</p>
                            </div>
                            <div className="card p-4 text-center">
                                <p className="text-sm text-gray-500 mb-1">ETA</p>
                                <p className="text-2xl font-bold text-secondary-600">{eta} min</p>
                            </div>
                        </div>
                    )}

                    {/* Destination */}
                    <div className="card p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Destination</p>
                                <p className="font-medium text-gray-900">{job.house?.address?.street}</p>
                                <p className="text-sm text-gray-600">
                                    {job.house?.address?.city}, {job.house?.address?.state} {job.house?.address?.zip}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {tripStatus === 'in_progress' && distance <= 0.5 && (
                        <button
                            onClick={handleArrived}
                            className="btn btn-secondary w-full py-4 text-lg"
                        >
                            <Check className="w-5 h-5 mr-2" />
                            I've Arrived
                        </button>
                    )}

                    {tripStatus === 'arrived' && (
                        <div className="space-y-4">
                            <div className="card p-6 bg-success-50 border-success-200 text-center">
                                <Check className="w-12 h-12 text-success-600 mx-auto mb-2" />
                                <p className="font-semibold text-success-900">You've Arrived!</p>
                                <p className="text-sm text-success-700 mt-1">Ready to start the job?</p>
                            </div>

                            <button
                                onClick={handleStartJob}
                                className="btn btn-secondary w-full py-4 text-lg"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Job
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Job Execution Screen
    if (currentStep === 'execution') {
        const rooms = [...new Set(checklist.map(t => t.room))];
        const totalTasks = checklist.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar bg-secondary-600 text-white">
                    <div className="px-4 py-3">
                        <h1 className="text-lg font-semibold text-center">Job in Progress</h1>
                        <p className="text-xs text-secondary-100 text-center mt-1">
                            {completedTasks} of {totalTasks} tasks complete ({Math.round(progress)}%)
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white border-b border-gray-100 px-6 py-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-secondary-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Timer */}
                    <div className="card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Time Elapsed</span>
                        </div>
                        <span className="font-mono font-bold text-gray-900">
                            {startTime ? Math.floor((Date.now() - startTime) / 60000) : 0} min
                        </span>
                    </div>

                    {/* Rooms */}
                    {rooms.map(room => {
                        const roomTasks = checklist.filter(t => t.room === room);
                        const roomCompleted = roomTasks.filter(t => t.status === 'done').length;
                        const roomPhotos = photos[`${room}-before`] || [];
                        const roomAfterPhotos = photos[`${room}-after`] || [];

                        return (
                            <div key={room} className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">{room}</h3>
                                    <span className="text-sm text-gray-500">
                                        {roomCompleted}/{roomTasks.length}
                                    </span>
                                </div>

                                {/* Photos */}
                                <div className="mb-4 space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                                            Before Photos ({roomPhotos.length})
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {roomPhotos.map(photo => (
                                                <div key={photo.id} className="relative w-20 h-20">
                                                    <img
                                                        src={photo.url}
                                                        alt="Before"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    {photo.uploading && (
                                                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-secondary-400 hover:bg-secondary-50 transition-colors">
                                                <Camera className="w-6 h-6 text-gray-400" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => handlePhotoUpload(room, 'before', e.target.files)}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                                            After Photos ({roomAfterPhotos.length})
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {roomAfterPhotos.map(photo => (
                                                <div key={photo.id} className="relative w-20 h-20">
                                                    <img
                                                        src={photo.url}
                                                        alt="After"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    {photo.uploading && (
                                                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-secondary-400 hover:bg-secondary-50 transition-colors">
                                                <Camera className="w-6 h-6 text-gray-400" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => handlePhotoUpload(room, 'after', e.target.files)}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div className="space-y-2">
                                    {roomTasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3
                        ${task.status === 'done'
                                                    ? 'border-success-300 bg-success-50'
                                                    : 'border-gray-200 hover:border-secondary-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${task.status === 'done'
                                                    ? 'border-success-500 bg-success-500'
                                                    : 'border-gray-300'
                                                }`}
                                            >
                                                {task.status === 'done' && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${task.status === 'done' ? 'text-success-900 line-through' : 'text-gray-900'}`}>
                                                    {task.title}
                                                </p>
                                                {task.required && (
                                                    <span className="text-xs text-error-600">Required</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Complete Job Button */}
                    <button
                        onClick={handleCompleteJob}
                        disabled={uploadingPhotos.length > 0}
                        className="btn btn-secondary w-full py-4 text-lg"
                    >
                        {uploadingPhotos.length > 0 ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Uploading Photos...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Complete Job
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Completion Screen
    if (currentStep === 'complete') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-12 h-12 text-success-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Complete!</h1>
                    <p className="text-gray-600 mb-8">
                        Great work! The customer will review your work shortly.
                    </p>

                    <div className="w-full max-w-sm space-y-4">
                        <div className="card p-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                                    <p className="text-lg font-bold text-gray-900">{calculateDuration()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Earnings</p>
                                    <p className="text-lg font-bold text-secondary-600">${job.earnings}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tasks Completed</span>
                                    <span className="font-medium text-gray-900">{completedTasks}/{checklist.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Photos Uploaded</span>
                                    <span className="font-medium text-gray-900">
                                        {Object.values(photos).flat().length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Distance Traveled</span>
                                    <span className="font-medium text-gray-900">3.2 mi</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onComplete}
                            className="btn btn-secondary w-full py-4"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
