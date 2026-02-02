import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * CLEANER SCHEDULE VIEW
 * ============================================================================
 * 
 * Purpose:
 * Visualizes the cleaner's upcoming jobs and allows availability management.
 * 
 * Capabilities:
 * 1. Week View: Detailed daily breakdown.
 * 2. Month View: High-level overview of busy days.
 * 3. Blocking: Shows time-offs (Morning/Afternoon/Evening blocks).
 * 
 * Integration:
 * Fetches jobs via `getCleanerJobs()` providing a real-time schedule.
 */
import { useApp } from '../context/AppContext';
import { getCleanerJobs, getCleanerByUserId } from '../storage';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, MapPin,
    DollarSign, User, Home, Check, AlertCircle, Play,
    Plus, Filter, Loader, MessageSquare
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CleanerSchedule({ onViewJob, onStartJob, onManageAvailability, onMessaging }) {
    const { user, startChat } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState('week'); // week, month
    const [jobs, setJobs] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState({}); // { '2025-01-26': { morning: 'unavailable' } }
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);

    // Load jobs from database
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

                // 1. Fetch Availability
                setBlockedSlots(cleanerProfile.availability || {});

                // 2. Fetch Jobs
                const allJobs = await getCleanerJobs(cleanerProfile.id);

                // Format jobs for display
                const formattedJobs = allJobs.map(job => {
                    const scheduledDate = new Date(job.scheduledDate || job.startTime || job.createdAt);
                    const startHour = scheduledDate.getHours();
                    const duration = job.duration || 2;

                    const formatTime = (h) => {
                        const period = h >= 12 ? 'PM' : 'AM';
                        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                        return `${hour12}:00 ${period}`;
                    };

                    return {
                        id: job.id,
                        customerId: job.customerId,
                        date: scheduledDate.toISOString().split('T')[0],
                        startTime: formatTime(startHour),
                        endTime: formatTime(startHour + duration),
                        duration: duration,
                        serviceType: (job.serviceType || 'Cleaning').replace('-', ' '),
                        earnings: Number(job.amount || job.earnings || 0),
                        status: job.status || 'scheduled',
                        customer: {
                            name: job.customerName || 'Home Owner',
                            rating: '4.8'
                        },
                        address: {
                            street: job.address || 'Address not specified',
                            city: 'Dallas',
                            state: 'TX',
                            zip: '75201'
                        },
                        house: {
                            sqft: 1800,
                            bedrooms: 3,
                            bathrooms: 2,
                            hasPets: false
                        }
                    };
                });

                // Sort by date and time
                formattedJobs.sort((a, b) => {
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;

                    // Helper to parse "8:00 AM"
                    const getMinutes = (timeStr) => {
                        if (!timeStr) return 0;
                        const parts = timeStr.split(' ');
                        if (parts.length < 2) return 0;

                        const [time, period] = parts;
                        let [h, m] = time.split(':').map(Number);
                        if (period === 'PM' && h !== 12) h += 12;
                        if (period === 'AM' && h === 12) h = 0;
                        return h * 60 + (m || 0);
                    };

                    return getMinutes(a.startTime) - getMinutes(b.startTime);
                });

                setJobs(formattedJobs);
            } catch (error) {
                console.error('Error loading jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
    }, [user?.uid]);

    // Get week dates
    const getWeekDates = (date) => {
        const result = [];
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            result.push(d);
        }
        return result;
    };

    // Get month dates (calendar grid)
    const getMonthDates = (date) => {
        const result = [];
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Start from Sunday of the week containing the first day
        const start = new Date(firstDay);
        start.setDate(start.getDate() - start.getDay());

        // Generate 6 weeks
        for (let i = 0; i < 42; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            result.push(d);
        }
        return result;
    };

    const weekDates = getWeekDates(currentDate);
    const monthDates = getMonthDates(currentDate);

    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const formatDateKey = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getJobsForDate = (date) => {
        const dateKey = formatDateKey(date);
        return jobs.filter(job => job.date === dateKey);
    };

    const getBlockedStatus = (date) => {
        const dateKey = formatDateKey(date);
        const slots = blockedSlots[dateKey] || {};
        // If all slots (morning, afternoon, evening) or the whole day is marked unavailable
        // Our structure is { '2025-01-26': { morning: 'unavailable' } }
        const isMorningBlocked = slots.morning === 'unavailable';
        const isAfternoonBlocked = slots.afternoon === 'unavailable';
        const isEveningBlocked = slots.evening === 'unavailable';

        if (isMorningBlocked && isAfternoonBlocked && isEveningBlocked) return 'fully_blocked';
        if (isMorningBlocked || isAfternoonBlocked || isEveningBlocked) return 'partially_blocked';
        return 'available';
    };

    const selectedDateJobs = getJobsForDate(selectedDate);
    const isToday = (date) => formatDateKey(date) === formatDateKey(new Date());
    const isSelected = (date) => formatDateKey(date) === formatDateKey(selectedDate);
    const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth();

    // Combined Timeline Items (Jobs + Blocks)
    const getTimelineItems = (date) => {
        if (view === 'month') {
            // In month view, show all jobs for the currently VIEWED month (currentDate), not just the selected date
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const monthJobs = jobs.filter(job => {
                const jobDate = new Date(job.date);
                return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
            }).map(j => ({ ...j, type: 'job' }));

            // Sort by date then startTime
            return monthJobs.sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;

                // Helper to parse "8:00 AM"
                const getMinutes = (timeStr) => {
                    if (!timeStr) return 0;
                    const parts = timeStr.split(' ');
                    if (parts.length < 2) return 0; // Guard against existing data issues

                    const [time, period] = parts;
                    let [h, m] = time.split(':').map(Number);
                    if (period === 'PM' && h !== 12) h += 12;
                    if (period === 'AM' && h === 12) h = 0;
                    return h * 60 + (m || 0);
                };

                return getMinutes(a.startTime) - getMinutes(b.startTime);
            });
        }

        const dateKey = formatDateKey(date);
        const dayJobs = getJobsForDate(date).map(j => ({ ...j, type: 'job' }));
        const dayBlocks = blockedSlots[dateKey] || {};
        const items = [...dayJobs];

        // Add blocks
        // Time approximations: Morning=8:00, Afternoon=12:00, Evening=16:00
        if (dayBlocks.morning === 'unavailable') {
            items.push({ id: 'blk-m-' + dateKey, type: 'block', shift: 'Morning', startTime: '8:00 AM', endTime: '12:00 PM', label: 'Time Off' });
        }
        if (dayBlocks.afternoon === 'unavailable') {
            items.push({ id: 'blk-a-' + dateKey, type: 'block', shift: 'Afternoon', startTime: '12:00 PM', endTime: '4:00 PM', label: 'Time Off' });
        }
        if (dayBlocks.evening === 'unavailable') {
            items.push({ id: 'blk-e-' + dateKey, type: 'block', shift: 'Evening', startTime: '4:00 PM', endTime: '8:00 PM', label: 'Time Off' });
        }

        // Sort by startTime
        return items.sort((a, b) => {
            // Helper to parse "8:00 AM" safely
            const getMinutes = (timeStr) => {
                if (!timeStr) return 0;
                const parts = timeStr.split(' ');
                if (parts.length < 2) return 0;

                const [time, period] = parts;
                if (!time) return 0;
                const timeParts = time.split(':');
                let h = parseInt(timeParts[0]) || 0;
                let m = parseInt(timeParts[1]) || 0;

                if (period === 'PM' && h !== 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return getMinutes(a.startTime) - getMinutes(b.startTime);
        });
    };

    const timelineItems = getTimelineItems(selectedDate);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-success-100 text-success-700 border-success-200';
            case 'in_progress': return 'bg-secondary-100 text-secondary-700 border-secondary-200';
            case 'scheduled': return 'bg-primary-100 text-primary-700 border-primary-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Calculate stats
    const todayEarnings = jobs
        .filter(j => j.date === formatDateKey(new Date()))
        .reduce((sum, j) => sum + j.earnings, 0);

    const weekEarnings = jobs
        .filter(j => weekDates.some(d => formatDateKey(d) === j.date))
        .reduce((sum, j) => sum + j.earnings, 0);

    const upcomingCount = jobs.filter(j => j.status === 'scheduled').length;

    const handleMessageCustomer = async () => {
        if (!selectedJob?.customerId) return;
        try {
            await startChat(selectedJob.customerId);
            onMessaging?.();
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    // Job Detail Modal
    if (selectedJob) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setSelectedJob(null)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Job Details</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Status Badge */}
                    <div className={`card p-4 ${getStatusColor(selectedJob.status)}`}>
                        <div className="flex items-center justify-center gap-2">
                            {selectedJob.status === 'completed' && <Check className="w-5 h-5" />}
                            {selectedJob.status === 'in_progress' && <Play className="w-5 h-5" />}
                            {selectedJob.status === 'scheduled' && <Clock className="w-5 h-5" />}
                            <span className="font-semibold capitalize">
                                {selectedJob.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Time & Earnings */}
                    <div className="card p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(selectedJob.date + 'T12:00:00').toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'short', day: 'numeric'
                                    })}
                                </p>
                                <p className="text-gray-600">
                                    {selectedJob.startTime} - {selectedJob.endTime}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Earnings</p>
                                <p className="text-2xl font-bold text-secondary-600">${selectedJob.earnings.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Service Type */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">{selectedJob.serviceType}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Estimated {selectedJob.duration} hours</span>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{selectedJob.customer.name}</p>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <span className="text-yellow-500">★</span>
                                        <span>{selectedJob.customer.rating}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleMessageCustomer}
                                className="p-2 bg-secondary-50 text-secondary-600 rounded-full hover:bg-secondary-100 transition-colors"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Property */}
                    <div className="card p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Property Details</h3>

                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{selectedJob.address.street}</p>
                                <p className="text-sm text-gray-500">
                                    {selectedJob.address.city}, {selectedJob.address.state} {selectedJob.address.zip}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">{selectedJob.house.sqft}</p>
                                <p className="text-xs text-gray-500">sqft</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">{selectedJob.house.bedrooms}</p>
                                <p className="text-xs text-gray-500">bed</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">{selectedJob.house.bathrooms}</p>
                                <p className="text-xs text-gray-500">bath</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">{selectedJob.house.hasPets ? '🐾' : '—'}</p>
                                <p className="text-xs text-gray-500">pets</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    {selectedJob.status === 'scheduled' && (
                        <button
                            onClick={() => {
                                onStartJob?.(selectedJob);
                                setSelectedJob(null);
                            }}
                            className="btn btn-secondary w-full py-4"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Start This Job
                        </button>
                    )}

                    {selectedJob.status === 'in_progress' && (
                        <button
                            onClick={() => onViewJob?.(selectedJob)}
                            className="btn btn-secondary w-full py-4"
                        >
                            Continue Job
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Schedule</h1>
                    <button
                        onClick={onManageAvailability}
                        className="text-xs font-bold text-white bg-secondary-600 px-4 py-2 rounded-full shadow-md hover:bg-secondary-700 transition-colors uppercase tracking-wide"
                    >
                        Manage my Availability
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-black text-white px-6 py-6 pb-8 rounded-b-[1.5rem] shadow-xl relative z-10">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold">${todayEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mt-1">Today</p>
                    </div>
                    <div className="text-center border-x border-gray-800">
                        <p className="text-2xl font-bold">${weekEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mt-1">This Week</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{upcomingCount}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mt-1">Upcoming</p>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${view === 'week' ? 'bg-secondary-100 text-secondary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${view === 'month' ? 'bg-secondary-100 text-secondary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Month
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentDate(new Date());
                            setSelectedDate(new Date());
                        }}
                        className="text-sm font-medium text-secondary-600"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => view === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-semibold text-gray-900">
                        {view === 'week'
                            ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </h2>
                    <button
                        onClick={() => view === 'week' ? navigateWeek(1) : navigateMonth(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Week View */}
            {view === 'week' && (
                <div className="bg-white border-b border-gray-100 px-4 py-3">
                    <div className="flex justify-between">
                        {weekDates.map((date, i) => {
                            const dayJobs = getJobsForDate(date);
                            const hasJobs = dayJobs.length > 0;
                            const blockedStatus = getBlockedStatus(date);
                            const isFullyBlocked = blockedStatus === 'fully_blocked';
                            const isPartiallyBlocked = blockedStatus === 'partially_blocked';

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex-1 py-2 px-1 rounded-xl text-center transition-all relative
                                        ${isSelected(date) ? 'bg-secondary-500 text-white' :
                                            isToday(date) ? 'bg-secondary-100 text-secondary-700' :
                                                'hover:bg-gray-100'}
                                        ${isFullyBlocked && !isSelected(date) ? 'bg-gray-100 text-gray-400' : ''}`}
                                >
                                    <p className={`text-xs font-medium mb-1
                                        ${isSelected(date) ? 'text-white/80' : 'text-gray-500'}`}>
                                        {DAYS[i]}
                                    </p>
                                    <p className={`text-lg font-bold
                                        ${isSelected(date) ? '' : 'text-gray-900'}
                                        ${isFullyBlocked && !isSelected(date) ? 'line-through opacity-50' : ''}`}>
                                        {date.getDate()}
                                    </p>

                                    {/* Indicators */}
                                    <div className="flex justify-center gap-0.5 mt-1 h-1.5">
                                        {hasJobs && (
                                            <div className={`w-1.5 h-1.5 rounded-full
                                                ${isSelected(date) ? 'bg-white' : 'bg-secondary-500'}`} />
                                        )}
                                        {isPartiallyBlocked && !hasJobs && (
                                            <div className={`w-1.5 h-1.5 rounded-full
                                                ${isSelected(date) ? 'bg-white/50' : 'bg-gray-300'}`} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Month View */}
            {view === 'month' && (
                <div className="bg-white border-b border-gray-100 px-4 py-3">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                {day}
                            </div>
                        ))}
                    </div>
                    {/* Date grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {monthDates.map((date, i) => {
                            const dayJobs = getJobsForDate(date);
                            const hasJobs = dayJobs.length > 0;
                            const blockedStatus = getBlockedStatus(date);
                            const isFullyBlocked = blockedStatus === 'fully_blocked';

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`aspect-square p-1 rounded-lg text-center transition-all relative
                                        ${isSelected(date) ? 'bg-secondary-500 text-white' :
                                            isToday(date) ? 'bg-secondary-100 text-secondary-700' :
                                                isCurrentMonth(date) ? 'hover:bg-gray-100' : 'text-gray-300'}
                                        ${!isCurrentMonth(date) ? 'opacity-50' : ''}
                                        ${isFullyBlocked && isCurrentMonth(date) && !isSelected(date) ? 'bg-gray-50 text-gray-400' : ''}`}
                                >
                                    <span className={`text-sm font-medium ${isFullyBlocked && !isSelected(date) ? 'line-through' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {hasJobs && isCurrentMonth(date) && (
                                        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                                            ${isSelected(date) ? 'bg-white' : 'bg-secondary-500'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Date Timeline */}
            <div className="px-6 py-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                    {view === 'month'
                        ? `All Jobs in ${MONTHS[currentDate.getMonth()]}`
                        : (isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
                    }
                </h3>

                {timelineItems.length === 0 ? (
                    <div className="card p-6 text-center">
                        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-900 mb-1">No schedule items</p>
                        <p className="text-sm text-gray-500">
                            {view === 'month' ? 'No jobs scheduled for this month' : 'Day is completely open'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {timelineItems.map(item => {
                            if (item.type === 'block') {
                                return (
                                    <div key={item.id} className="card bg-gray-50 border-gray-200 border-l-4 border-l-gray-400 p-4 opacity-75">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">
                                                    {item.startTime} - {item.endTime}
                                                </p>
                                                <p className="font-semibold text-gray-700">{item.shift} - {item.label}</p>
                                            </div>
                                            <div className="bg-gray-200 p-2 rounded-full">
                                                <Clock className="w-5 h-5 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Job Item
                            const job = item;
                            return (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className={`card w-full text-left hover:shadow-md transition-all
                                        ${job.status === 'in_progress' ? 'border-l-4 border-l-secondary-500' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {view === 'month' && (
                                                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                        {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                                <span className="text-sm font-medium text-gray-600">
                                                    {job.startTime} - {job.endTime}
                                                </span>
                                                <span className={`badge text-xs ${job.status === 'completed' ? 'badge-success' :
                                                    job.status === 'in_progress' ? 'badge-secondary' :
                                                        'badge-primary'
                                                    }`}>
                                                    {job.status === 'in_progress' ? 'In Progress' : job.status}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-gray-900 capitalize">{job.serviceType}</h4>
                                        </div>
                                        <span className="font-bold text-secondary-600">${job.earnings.toFixed(2)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{job.address.street}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
