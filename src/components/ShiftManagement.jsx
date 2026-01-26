// ShiftManagement.jsx - Cleaner Shift/Availability Management

import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Check, X, Calendar,
    Clock, AlertCircle, CalendarDays, SkipForward, Ban
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
    getCleanerByUserId,
    getCleanerAvailability,
    updateCleanerAvailability,
    getCleanerJobs
} from '../storage';

// Date utility functions
function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date, formatStr) {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (formatStr === 'EEE') return days[d.getDay()];
    if (formatStr === 'd') return d.getDate().toString();
    if (formatStr === 'MMM d') return `${months[d.getMonth()]} ${d.getDate()}`;
    if (formatStr === 'yyyy-MM-dd') {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (formatStr === 'MMMM yyyy') return `${months[d.getMonth()]} ${d.getFullYear()}`;
    return d.toLocaleDateString();
}

const SHIFTS = ['morning', 'afternoon', 'evening'];
const SHIFT_CONFIG = {
    morning: { label: 'Morning', time: '9am - 12pm', icon: '🌅' },
    afternoon: { label: 'Afternoon', time: '12pm - 3pm', icon: '☀️' },
    evening: { label: 'Evening', time: '3pm - 6pm', icon: '🌆' }
};

export default function ShiftManagement({ onBack }) {
    const { user } = useApp();
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
    const [shifts, setShifts] = useState({});
    const [bookedShifts, setBookedShifts] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cleanerProfile, setCleanerProfile] = useState(null);
    const [toast, setToast] = useState(null);
    const [showJumpModal, setShowJumpModal] = useState(false);
    const [jumpDate, setJumpDate] = useState('');

    // Load week data
    const loadWeekData = useCallback(async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);

            // Get cleaner profile
            let profile = cleanerProfile;
            if (!profile) {
                profile = await getCleanerByUserId(user.uid);
                setCleanerProfile(profile);
            }

            if (!profile) {
                console.warn('No cleaner profile found');
                setLoading(false);
                return;
            }

            // Load availability and jobs for the week
            const weekEnd = addDays(currentWeekStart, 6);
            const [availability, jobs] = await Promise.all([
                getCleanerAvailability(profile.id, formatDate(currentWeekStart, 'yyyy-MM-dd'), formatDate(weekEnd, 'yyyy-MM-dd')),
                getCleanerJobs(profile.id)
            ]);

            // Convert availability to shifts map
            const shiftsMap = {};
            if (availability) {
                Object.entries(availability).forEach(([date, dayData]) => {
                    SHIFTS.forEach(shift => {
                        const key = `${date}_${shift}`;
                        shiftsMap[key] = {
                            status: dayData[shift] || 'available'
                        };
                    });
                });
            }

            // Mark booked shifts from jobs
            const bookedMap = {};
            jobs.forEach(job => {
                if (job.status === 'scheduled' || job.status === 'in_progress' || job.status === 'confirmed') {
                    const jobDate = new Date(job.scheduledDate || job.startTime);
                    const dateStr = formatDate(jobDate, 'yyyy-MM-dd');
                    const hour = jobDate.getHours();

                    let shift = 'morning';
                    if (hour >= 12 && hour < 15) shift = 'afternoon';
                    else if (hour >= 15) shift = 'evening';

                    const key = `${dateStr}_${shift}`;
                    bookedMap[key] = job;
                }
            });

            setShifts(shiftsMap);
            setBookedShifts(bookedMap);
        } catch (error) {
            console.error('Error loading shift data:', error);
            showToast('Failed to load availability', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, currentWeekStart, cleanerProfile]);

    useEffect(() => {
        loadWeekData();
    }, [loadWeekData]);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Toggle shift availability
    const toggleShift = async (date, shift) => {
        const key = `${date}_${shift}`;

        // Check if shift is booked
        if (bookedShifts[key]) {
            showToast('Cannot modify - job scheduled for this time', 'error');
            return;
        }

        const currentStatus = shifts[key]?.status || 'available';
        const newStatus = currentStatus === 'available' ? 'blocked' : 'available';

        // Optimistic update
        setShifts(prev => ({
            ...prev,
            [key]: { status: newStatus }
        }));

        setSaving(true);
        try {
            await updateCleanerAvailability(cleanerProfile.id, date, shift, newStatus);

            const dayName = formatDate(new Date(date), 'EEE');
            showToast(`${dayName} ${SHIFT_CONFIG[shift].label} set to ${newStatus}`);
        } catch (error) {
            // Revert on error
            setShifts(prev => ({
                ...prev,
                [key]: { status: currentStatus }
            }));
            showToast('Failed to update availability', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Navigate weeks
    const navigateWeek = (direction) => {
        const daysToAdd = direction === 'next' ? 7 : -7;
        const newWeekStart = addDays(currentWeekStart, daysToAdd);

        // Don't allow navigating to past weeks
        const thisWeekStart = startOfWeek(new Date());
        if (newWeekStart < thisWeekStart) {
            showToast('Cannot view past weeks', 'error');
            return;
        }

        // Don't allow beyond 25 weeks
        const maxWeekStart = addDays(new Date(), 25 * 7);
        if (newWeekStart > maxWeekStart) {
            showToast('Cannot plan more than 25 weeks ahead', 'error');
            return;
        }

        setCurrentWeekStart(newWeekStart);
    };

    // Jump to specific date
    const handleJumpToDate = () => {
        if (!jumpDate) return;

        const targetDate = new Date(jumpDate);
        const targetWeekStart = startOfWeek(targetDate);
        const thisWeekStart = startOfWeek(new Date());

        if (targetWeekStart < thisWeekStart) {
            showToast('Cannot view past weeks', 'error');
            return;
        }

        const maxWeekStart = addDays(new Date(), 25 * 7);
        if (targetWeekStart > maxWeekStart) {
            showToast('Cannot plan more than 25 weeks ahead', 'error');
            return;
        }

        setCurrentWeekStart(targetWeekStart);
        setShowJumpModal(false);
        setJumpDate('');
    };

    // Block next 7 days
    const blockNextDays = async (days = 7) => {
        if (!cleanerProfile) return;

        setSaving(true);
        try {
            const updates = [];
            for (let i = 0; i < days; i++) {
                const date = formatDate(addDays(new Date(), i), 'yyyy-MM-dd');
                for (const shift of SHIFTS) {
                    const key = `${date}_${shift}`;
                    if (!bookedShifts[key]) {
                        updates.push({ date, shift, status: 'blocked' });
                    }
                }
            }

            // Update all shifts
            for (const update of updates) {
                await updateCleanerAvailability(cleanerProfile.id, update.date, update.shift, update.status);
            }

            // Refresh data
            await loadWeekData();
            showToast(`Blocked next ${days} days`);
        } catch (error) {
            console.error('Error blocking days:', error);
            showToast('Failed to block days', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Get shift status for display
    const getShiftStatus = (date, shift) => {
        const key = `${date}_${shift}`;
        if (bookedShifts[key]) return 'booked';
        return shifts[key]?.status || 'available';
    };

    // Check if date is today
    const isToday = (date) => {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    };

    // Check if date is in the past
    const isPast = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(date) < today;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold">Manage Availability</h1>
                        <div className="w-10" />
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between px-6 py-4">
                    <button
                        onClick={() => navigateWeek('prev')}
                        disabled={saving}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <p className="text-sm opacity-80">Week of</p>
                        <p className="text-xl font-bold">{formatDate(currentWeekStart, 'MMM d')}</p>
                    </div>

                    <button
                        onClick={() => navigateWeek('next')}
                        disabled={saving}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-secondary-200 border-t-secondary-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading availability...</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pb-safe">
                    {/* Calendar Grid */}
                    <div className="p-4">
                        {/* Day Headers */}
                        <div className="grid grid-cols-8 gap-1 mb-2">
                            <div className="text-center" /> {/* Empty for shift labels */}
                            {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                                const date = addDays(currentWeekStart, dayOffset);
                                const dateStr = formatDate(date, 'yyyy-MM-dd');
                                const today = isToday(date);

                                return (
                                    <div
                                        key={dayOffset}
                                        className={`text-center py-2 rounded-lg ${today ? 'bg-secondary-100' : ''}`}
                                    >
                                        <p className={`text-xs font-semibold ${today ? 'text-secondary-700' : 'text-gray-600'}`}>
                                            {formatDate(date, 'EEE')}
                                        </p>
                                        <p className={`text-lg font-bold ${today ? 'text-secondary-600' : 'text-gray-900'}`}>
                                            {formatDate(date, 'd')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Shift Rows */}
                        {SHIFTS.map(shift => (
                            <div key={shift} className="grid grid-cols-8 gap-1 mb-2">
                                {/* Shift Label */}
                                <div className="flex flex-col justify-center pr-2">
                                    <p className="text-xs font-medium text-gray-700">{SHIFT_CONFIG[shift].label}</p>
                                    <p className="text-[10px] text-gray-400">{SHIFT_CONFIG[shift].time}</p>
                                </div>

                                {/* Shift Cells */}
                                {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                                    const date = addDays(currentWeekStart, dayOffset);
                                    const dateStr = formatDate(date, 'yyyy-MM-dd');
                                    const status = getShiftStatus(dateStr, shift);
                                    const past = isPast(date);

                                    return (
                                        <button
                                            key={`${dateStr}_${shift}`}
                                            onClick={() => !past && toggleShift(dateStr, shift)}
                                            disabled={past || saving}
                                            className={`
                                                aspect-square rounded-lg flex items-center justify-center
                                                transition-all transform active:scale-95
                                                border-2
                                                ${past ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                                                ${status === 'available'
                                                    ? 'bg-success-50 border-success-300 hover:bg-success-100'
                                                    : status === 'blocked'
                                                        ? 'bg-error-50 border-error-300 hover:bg-error-100'
                                                        : 'bg-primary-50 border-primary-300'
                                                }
                                            `}
                                        >
                                            {status === 'available' ? (
                                                <Check className="w-5 h-5 text-success-600" />
                                            ) : status === 'blocked' ? (
                                                <X className="w-5 h-5 text-error-600" />
                                            ) : (
                                                <Calendar className="w-5 h-5 text-primary-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="px-4 py-3 bg-white border-t border-b border-gray-100">
                        <div className="flex justify-around">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-success-50 border-2 border-success-300 rounded flex items-center justify-center">
                                    <Check className="w-4 h-4 text-success-600" />
                                </div>
                                <span className="text-xs text-gray-600">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-error-50 border-2 border-error-300 rounded flex items-center justify-center">
                                    <X className="w-4 h-4 text-error-600" />
                                </div>
                                <span className="text-xs text-gray-600">Blocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary-50 border-2 border-primary-300 rounded flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-primary-600" />
                                </div>
                                <span className="text-xs text-gray-600">Booked</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>

                        <button
                            onClick={() => setShowJumpModal(true)}
                            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">Jump to Date</p>
                                <p className="text-sm text-gray-500">Navigate to a specific week</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>

                        <button
                            onClick={() => blockNextDays(7)}
                            disabled={saving}
                            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                                <Ban className="w-5 h-5 text-error-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">Block Next 7 Days</p>
                                <p className="text-sm text-gray-500">Mark yourself as unavailable</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>

                        <button
                            onClick={() => navigateWeek('next')}
                            disabled={saving}
                            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                                <SkipForward className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">Next Week</p>
                                <p className="text-sm text-gray-500">Plan your upcoming availability</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="mx-4 mb-6 p-4 bg-secondary-50 rounded-xl border border-secondary-100">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-secondary-800 mb-1">Pro Tips</p>
                                <ul className="text-sm text-secondary-700 space-y-1">
                                    <li>• Tap any cell to toggle between available and blocked</li>
                                    <li>• Booked slots (with jobs) cannot be modified</li>
                                    <li>• Keep your calendar updated to get more job offers</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Jump to Date Modal */}
            {showJumpModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Jump to Date</h3>
                        <input
                            type="date"
                            value={jumpDate}
                            onChange={(e) => setJumpDate(e.target.value)}
                            min={formatDate(new Date(), 'yyyy-MM-dd')}
                            max={formatDate(addDays(new Date(), 25 * 7), 'yyyy-MM-dd')}
                            className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowJumpModal(false);
                                    setJumpDate('');
                                }}
                                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleJumpToDate}
                                disabled={!jumpDate}
                                className="flex-1 py-3 bg-secondary-500 rounded-xl font-medium text-white hover:bg-secondary-600 transition-colors disabled:opacity-50"
                            >
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-24 left-4 right-4 p-4 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-3
                    ${toast.type === 'error' ? 'bg-error-500 text-white' : 'bg-secondary-500 text-white'}`}
                >
                    {toast.type === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                    ) : (
                        <Check className="w-5 h-5" />
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Saving Indicator */}
            {saving && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50">
                    Saving...
                </div>
            )}
        </div>
    );
}
