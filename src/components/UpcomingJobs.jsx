import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * UPCOMING JOBS (Cleaner Schedule)
 * ============================================================================
 * 
 * Purpose:
 * Lists confirmed assignments for the cleaner.
 * 
 * Logic:
 * - Fetches jobs where status is 'scheduled' or 'confirmed'.
 * - Sorts chronologically.
 * - Parsing logic handles various date string formats from the DB.
 */
import { ChevronLeft, MapPin, Calendar, Clock, DollarSign, ChevronRight, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCleanerByUserId, getCleanerJobs } from '../storage';

export default function UpcomingJobs({ onBack, onViewJob, embedded = false }) {
    const { user } = useApp();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadJobs = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const cleanerProfile = await getCleanerByUserId(user.uid);
                if (!cleanerProfile) {
                    setLoading(false);
                    return;
                }

                const allJobs = await getCleanerJobs(cleanerProfile.id);

                // Fetch house details for each job
                const jobsWithDetails = await Promise.all(allJobs.map(async (job) => {
                    let house = null;
                    if (job.houseId) {
                        try {
                            const { getHouseById } = await import('../storage');
                            house = await getHouseById(job.houseId);
                        } catch (e) {
                            console.warn('Could not fetch house for job', job.id);
                        }
                    }
                    return { ...job, house };
                }));

                const today = new Date().toISOString().split('T')[0];

                // Filter for upcoming jobs (scheduled/confirmed and date >= today)
                const upcoming = jobsWithDetails.filter(job => {
                    if (job.status !== 'scheduled' && job.status !== 'confirmed') return false;

                    const dateVal = job.scheduledDate || job.startTime;
                    if (!dateVal) return false;

                    // Extract date string (handle both YYYY-MM-DD and full ISO strings)
                    const jobDate = dateVal.split('T')[0];
                    return jobDate >= today;
                });

                // Sort by date then time
                upcoming.sort((a, b) => {
                    const dateA = (a.scheduledDate || a.startTime || '').split('T')[0];
                    const dateB = (b.scheduledDate || b.startTime || '').split('T')[0];
                    return dateA.localeCompare(dateB);
                });

                setJobs(upcoming);
            } catch (error) {
                console.error('Error loading upcoming jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
    }, [user]);

    // Helper to parse date string without timezone issues
    const parseDateString = (dateStr) => {
        if (!dateStr) return new Date();

        // If it's a date-only string (YYYY-MM-DD), parse it as local time
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        // Otherwise parse normally
        return new Date(dateStr);
    };

    // Helper to parse time string (HH:MM) and combine with date
    const parseTime = (dateStr, timeStr) => {
        const date = parseDateString(dateStr);
        if (!timeStr || !timeStr.includes(':')) {
            return date.getHours();
        }
        const [hours] = timeStr.split(':').map(Number);
        return hours;
    };

    // Format helper
    const formatJob = (job) => {
        const dateVal = job.scheduledDate || job.startTime || new Date().toISOString();
        const validDate = parseDateString(dateVal);

        // Get hours from startTime if available, otherwise from parsed date
        let hours = 9; // Default morning time
        if (job.startTime && job.startTime.includes(':')) {
            // If startTime is "09:00" format
            hours = parseTime(dateVal, job.startTime);
        } else if (validDate) {
            hours = validDate.getHours();
        }

        const duration = job.duration || 3;
        const endHours = hours + duration;

        const formatTime = (h) => {
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${hour12}:00 ${period}`;
        };

        const dateStr = validDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        return {
            ...job,
            formattedDate: dateStr,
            timeRange: `${formatTime(hours)} - ${formatTime(endHours)}`,
            displayEarnings: Number(job.amount || job.earnings || 50).toFixed(2)
        };
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${embedded ? '' : 'pb-20'}`}>
            {/* Header */}
            {!embedded && (
                <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                    <div className="max-w-md mx-auto px-4 py-3 flex items-center">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 ml-2">Upcoming Jobs</h1>
                    </div>
                </div>
            )}

            <div className="p-4 max-w-md mx-auto space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming jobs</h3>
                        <p className="text-gray-500">You don't have any jobs scheduled yet.</p>
                    </div>
                ) : (
                    jobs.map((rawJob) => {
                        const job = formatJob(rawJob);
                        return (
                            <div
                                key={job.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => onViewJob && onViewJob(job)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                                {job.status}
                                            </span>
                                            <span className="text-xs font-mono font-semibold text-gray-500">
                                                {job.bookingId || `#${job.id.slice(-6)}`}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                                            {(job.serviceType || 'Cleaning').replace('-', ' ')}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-secondary-600">
                                            ${job.displayEarnings}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{job.formattedDate}</p>
                                            <p className="text-xs text-gray-500">{job.timeRange}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 flex-1 truncate">
                                            {job.address || 'Address pending'}
                                        </p>
                                    </div>

                                    {job.customerName && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {job.customerName}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <span className="text-gray-400">View details</span>
                                    <div className="p-1 bg-gray-50 rounded-full">
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
