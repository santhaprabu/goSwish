import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * EARNINGS DASHBOARD
 * ============================================================================
 * 
 * Purpose:
 * Visual analytics for Cleaner earnings.
 * 
 * Features:
 * - Stats Cards (Total, Weekly, Daily, Tips).
 * - Performance Graphs (Weekly Trends).
 * - Breakdown by Service Type.
 * - Tips analysis.
 * 
 * Logic:
 * - Aggregates data from `getCleanerEarning` and job history.
 * - Calculates percentage trends vs previous period.
 */
import { useApp } from '../context/AppContext';
import {
    getCleanerEarnings,
    getCleanerDailyEarnings,
    getCleanerByUserId,
    getCleanerJobs,
    updateCleanerProfile
} from '../storage';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Download,
    ChevronRight, ChevronLeft, Clock, MapPin, Filter, ArrowUp,
    ArrowDown, Briefcase, Star, Award, Target, Zap, Loader, Edit2, Check, X
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subValue, trend, bgColor = 'bg-gray-100', iconColor = 'text-gray-600' }) => (
    <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <span className="text-sm text-gray-500">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-sm text-gray-500 mt-0.5">{subValue}</p>}
        {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>{Math.abs(trend)}% vs last week</span>
            </div>
        )}
    </div>
);

/**
 * ============================================================================
 * EARNINGS DASHBOARD
 * ============================================================================
 * 
 * Purpose:
 * Visualizes the Cleaner's financial performance.
 * 
 * Features:
 * 1. Period Aggregation: Breaks down earnings by Today, Week, Month, Year.
 * 2. Visual Graphs: Daily earning trends.
 * 3. Recent Transactions: Line-item history of jobs.
 * 
 * Data Note:
 * This component relies on `getCleanerEarnings` (helpers.js) for the heavy lifting.
 * It's purely a "View" component that handles display logic.
 */
export default function EarningsDashboard({ onBack, onViewPayouts }) {
    const { user } = useApp();
    const [period, setPeriod] = useState('week');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('2000');
    const [cleanerId, setCleanerId] = useState(null);

    const [earningsData, setEarningsData] = useState({
        today: { earnings: 0, jobs: 0, hours: 0, tips: 0 },
        week: { earnings: 0, jobs: 0, hours: 0, tips: 0, trend: 0 },
        month: { earnings: 0, jobs: 0, hours: 0, tips: 0, trend: 0 },
        year: { earnings: 0, jobs: 0, hours: 0, tips: 0 },
        dailyEarnings: [],
        transactions: [],
        goals: { weekly: { target: 2000, current: 0 }, monthly: { target: 8000, current: 0 } }
    });

    // Load earnings from database
    useEffect(() => {
        const loadEarnings = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const cleanerProfile = await getCleanerByUserId(user.uid);

                if (!cleanerProfile) {
                    setLoading(false);
                    return;
                }
                setCleanerId(cleanerProfile.id);

                // Get earnings for different periods
                const [todayData, weekData, monthData] = await Promise.all([
                    getCleanerEarnings(cleanerProfile.id, 'today'),
                    getCleanerEarnings(cleanerProfile.id, 'week'),
                    getCleanerEarnings(cleanerProfile.id, 'month')
                ]);

                // Get daily earnings for chart
                const dailyEarnings = await getCleanerDailyEarnings(cleanerProfile.id, 7);

                // Get recent jobs as transactions
                const allJobs = await getCleanerJobs(cleanerProfile.id);

                // Calculate Year Earnings (Current Year)
                const currentYear = new Date().getFullYear();

                // Helper to extract valid date (same as in helpers.js)
                const extractDate = (j) => {
                    const candidates = [j.completedAt, j.updatedAt, j.createdAt, j.endTime];
                    for (const c of candidates) {
                        if (c && typeof c === 'string') {
                            if (c.includes('T')) return c.split('T')[0];
                            if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
                        }
                    }
                    return null;
                };

                const yearJobs = allJobs.filter(j => {
                    if (!['completed', 'approved', 'completed_pending_approval'].includes(j.status)) return false;
                    const dateStr = extractDate(j);
                    if (!dateStr) return false;
                    const d = new Date(dateStr);
                    return d.getFullYear() === currentYear;
                });

                // Correctly use earnings (net)
                const yearEarnings = yearJobs.reduce((sum, j) => sum + Number(j.earnings || j.amount || 0), 0);
                const yearTips = yearJobs.reduce((sum, j) => sum + Number(j.tip || 0), 0);
                const yearHours = yearJobs.reduce((sum, j) => sum + Number(j.duration || 2), 0);

                // Helper to calculate trend
                const calculateTrend = (currentEarnings, jobs, daysLookback) => {
                    // This is a simplified trend. ideally we'd fetch the exact previous period.
                    // For now, we'll set it to null to avoid fake data, or implementation can be added later.
                    return null;
                };

                const recentJobs = allJobs
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10)
                    .map(job => {
                        const isPayout = job.id.startsWith('txn_') || job.type === 'payout' || job.type === 'withdrawal';
                        // Extract valid date
                        const dateStr = extractDate(job) || job.scheduledDate || job.createdAt;

                        return {
                            id: job.id,
                            type: isPayout ? 'payout' : 'earning',
                            description: isPayout
                                ? (job.description || 'Payout')
                                : `${job.serviceType || 'Clean'} - ${job.customerName || 'Customer'}`,
                            // Use net earnings for jobs
                            amount: isPayout ? (job.amount || 0) : Number(job.earnings || job.amount || 0),
                            date: new Date(dateStr).toLocaleDateString(),
                            tip: job.tip || 0
                        };
                    });

                setEarningsData({
                    today: {
                        earnings: todayData.earnings,
                        jobs: todayData.jobs,
                        hours: todayData.hours,
                        tips: todayData.tips
                    },
                    week: {
                        earnings: weekData.earnings,
                        jobs: weekData.jobs,
                        hours: weekData.hours,
                        tips: weekData.tips,
                        trend: null // Removed hardcoded 12.5
                    },
                    month: {
                        earnings: monthData.earnings,
                        jobs: monthData.jobs,
                        hours: monthData.hours,
                        tips: monthData.tips,
                        trend: null // Removed hardcoded 8.3
                    },
                    year: {
                        earnings: yearEarnings,
                        jobs: yearJobs.length,
                        hours: yearHours,
                        tips: yearTips
                    },
                    dailyEarnings,
                    transactions: recentJobs,
                    goals: {
                        // Use settings if available, else defaults
                        weekly: { target: cleanerProfile.settings?.weeklyGoal || 2000, current: weekData.earnings },
                        monthly: { target: cleanerProfile.settings?.monthlyGoal || 8000, current: monthData.earnings }
                    }
                });

                setGoalInput((cleanerProfile.settings?.weeklyGoal || 2000).toString());
            } catch (error) {
                console.error('Error loading earnings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEarnings();
    }, [user?.uid]);

    const data = earningsData;
    const periodData = data[period] || data.week;

    // Calculate max earning for scaling
    const actualMaxEarning = Math.max(...(data.dailyEarnings?.map(d => Number(d.earnings) || 0) || [0]), 0);
    // User requested Y-axis top to be 2x the highest earning of the day, rounded to nearest 50
    let yAxisMax = actualMaxEarning > 0 ? actualMaxEarning * 2 : 100;
    yAxisMax = Math.ceil(yAxisMax / 50) * 50;

    const goalProgress = data.goals.weekly.target > 0
        ? (data.goals.weekly.current / data.goals.weekly.target) * 100
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar flex items-center justify-between px-4 py-3">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Earnings</h1>
                <button onClick={onViewPayouts} className="p-2">
                    <Download className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Main Earnings Card */}
            <div className="bg-black text-white px-6 py-8 pb-10 rounded-b-[1.5rem] shadow-xl relative z-10">
                <div className="text-center mb-6">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
                        {period === 'today' ? "Today's" : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'} Earnings
                    </p>
                    <p className="text-5xl font-bold tracking-tight mb-2">${periodData.earnings.toLocaleString()}</p>
                    {periodData.trend && (
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
                            ${periodData.trend >= 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {periodData.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {periodData.trend >= 0 ? '+' : ''}{periodData.trend}%
                        </div>
                    )}
                </div>

                {/* Period Tabs */}
                <div className="flex gap-1 justify-center bg-gray-900/50 p-1 rounded-full w-fit mx-auto border border-gray-800">
                    {['today', 'week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize
                                ${period === p ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {p === 'today' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="px-6 mt-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="card p-4 text-center">
                        <Briefcase className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{periodData.jobs}</p>
                        <p className="text-xs text-gray-500">Jobs</p>
                    </div>
                    <div className="card p-4 text-center">
                        <Clock className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{periodData.hours}h</p>
                        <p className="text-xs text-gray-500">Hours</p>
                    </div>
                    <div className="card p-4 text-center">
                        <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">${periodData.tips}</p>
                        <p className="text-xs text-gray-500">Tips</p>
                    </div>
                </div>
            </div>

            {/* Weekly Goal Progress */}
            <div className="px-6 mt-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-secondary-500" />
                            <h3 className="font-semibold text-gray-900">Weekly Goal</h3>
                        </div>
                        {isEditingGoal ? (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    <input
                                        type="number"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        className="w-20 pl-4 py-1 text-sm border rounded"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!cleanerId) return;
                                        const newGoal = parseInt(goalInput);
                                        if (isNaN(newGoal) || newGoal <= 0) return;

                                        // Update local state
                                        const newData = { ...earningsData };
                                        newData.goals.weekly.target = newGoal;
                                        setEarningsData(newData);
                                        setIsEditingGoal(false);

                                        // Persist
                                        try {
                                            const cleanerProfile = await getCleanerByUserId(user.uid); // refetch to get current settings
                                            // Ideally we merge with existing settings
                                            const currentSettings = cleanerProfile.settings || {};
                                            await updateCleanerProfile(cleanerId, {
                                                settings: { ...currentSettings, weeklyGoal: newGoal }
                                            });
                                        } catch (e) {
                                            console.error("Failed to save goal", e);
                                        }
                                    }}
                                    className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setGoalInput(earningsData.goals.weekly.target.toString());
                                        setIsEditingGoal(false);
                                    }}
                                    className="p-1 text-red-600 bg-red-100 rounded hover:bg-red-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                    ${data.goals.weekly.current} / ${data.goals.weekly.target}
                                </span>
                                <button
                                    onClick={() => setIsEditingGoal(true)}
                                    className="text-gray-400 hover:text-secondary-600 p-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${goalProgress >= 100 ? 'bg-success-500' : 'bg-secondary-500'
                                }`}
                            style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {goalProgress >= 100
                            ? '🎉 Goal achieved! Great work!'
                            : `$${data.goals.weekly.target - data.goals.weekly.current} more to reach your goal`
                        }
                    </p>
                </div>
            </div>

            {/* Daily Earnings Chart */}
            <div className="px-6 mt-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">This Week</h3>
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-sm text-secondary-600 font-medium"
                        >
                            {showBreakdown ? 'Hide' : 'Show'} Details
                        </button>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative h-32 mt-6 mb-4">
                        {/* Grid lines */}
                        {/* Grid lines */}
                        <div className="absolute inset-0 z-0">
                            {/* Top Line (100%) */}
                            <div className="absolute top-0 w-full border-b border-gray-100">
                                <span className="absolute -top-2.5 left-0 text-[10px] text-gray-400 font-medium">
                                    ${Math.round(yAxisMax)}
                                </span>
                            </div>

                            {/* Middle Line (50%) */}
                            <div className="absolute top-1/2 w-full border-b border-gray-100 -translate-y-1/2">
                                <span className="absolute -top-2.5 left-0 text-[10px] text-gray-400 font-medium">
                                    ${Math.round(yAxisMax / 2)}
                                </span>
                            </div>

                            {/* Bottom Line (0%) */}
                            <div className="absolute bottom-0 w-full border-b border-gray-100">
                                <span className="absolute -bottom-2.5 left-0 text-[10px] text-gray-400 font-medium">
                                    $0
                                </span>
                            </div>
                        </div>

                        {/* Bars */}
                        <div className="relative h-full flex items-end justify-between gap-3 z-10 px-6 sm:px-8">
                            {data.dailyEarnings.map((day, i) => {
                                const val = Number(day.earnings) || 0;
                                const height = yAxisMax > 0 ? (val / yAxisMax) * 100 : 0;

                                // Since array is ordered [Today-6, ..., Today], the last item is today.
                                const isToday = i === data.dailyEarnings.length - 1;

                                return (
                                    <div key={day.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">

                                        {/* Tooltip-style Value Label */}
                                        <div className={`absolute -top-8 transition-all duration-200 transform z-20
                                            ${val > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
                                        `}
                                            style={{ bottom: `${height}%`, top: 'auto', marginBottom: '4px' }}
                                        >
                                            <span className="text-[10px] font-bold text-gray-600 bg-white shadow-md border border-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                ${val}
                                            </span>
                                        </div>

                                        {/* The Bar */}
                                        <div
                                            className={`w-full max-w-[16px] rounded-t-full transition-all duration-700 ease-out relative
                                                ${val > 0
                                                    ? (isToday ? 'bg-secondary-600 shadow-lg shadow-secondary-200' : 'bg-secondary-300 hover:bg-secondary-400')
                                                    : (isToday ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200')
                                                }
                                            `}
                                            style={{ height: `${Math.max(height, 2)}%` }} // Min height 2%
                                        >
                                        </div>

                                        {/* Day Label */}
                                        <span className={`absolute -bottom-6 text-[10px] font-medium uppercase tracking-wider
                                            ${isToday ? 'text-secondary-700 font-bold' : 'text-gray-400'}
                                        `}>
                                            {day.day[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Breakdown Details */}
                    {showBreakdown && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            {data.dailyEarnings.filter(d => d.jobs > 0).map((day, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{day.day}</span>
                                    <div className="text-right">
                                        <span className="font-medium text-gray-900">${day.earnings}</span>
                                        <span className="text-gray-500 ml-2">({day.jobs} jobs)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Insights */}
            <div className="px-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Insights</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                        <Zap className="w-5 h-5 text-primary-600 mb-2" />
                        <p className="text-lg font-bold text-gray-900">
                            ${periodData.earnings > 0 && periodData.hours > 0
                                ? Math.round(periodData.earnings / periodData.hours)
                                : 0}/hr
                        </p>
                        <p className="text-xs text-gray-600">Avg. hourly rate</p>
                    </div>
                    <div className="card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <Award className="w-5 h-5 text-yellow-600 mb-2" />
                        <p className="text-lg font-bold text-gray-900">
                            {periodData.earnings > 0
                                ? Math.round((periodData.tips / periodData.earnings) * 100)
                                : 0}%
                        </p>
                        <p className="text-xs text-gray-600">Tip rate</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-6 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <button
                        onClick={onViewPayouts}
                        className="text-sm text-secondary-600 font-medium flex items-center gap-1"
                    >
                        View All <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="card p-0 divide-y divide-gray-100">
                    {data.transactions.slice(0, 5).map(txn => (
                        <div key={txn.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'earning' ? 'bg-success-100' :
                                    txn.type === 'payout' ? 'bg-primary-100' :
                                        'bg-yellow-100'
                                    }`}>
                                    {txn.type === 'earning' ? (
                                        <DollarSign className="w-5 h-5 text-success-600" />
                                    ) : txn.type === 'payout' ? (
                                        <Download className="w-5 h-5 text-primary-600" />
                                    ) : (
                                        <Award className="w-5 h-5 text-yellow-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{txn.description}</p>
                                    <p className="text-xs text-gray-500">{txn.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-semibold ${txn.amount >= 0 ? 'text-success-600' : 'text-gray-900'}`}>
                                    {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                                </p>
                                {txn.tip > 0 && (
                                    <p className="text-xs text-yellow-600">+${Number(txn.tip).toFixed(2)} tip</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 mt-6 space-y-3">
                <button
                    onClick={onViewPayouts}
                    className="btn btn-secondary w-full"
                >
                    <Download className="w-5 h-5 mr-2" />
                    View Payout History
                </button>
            </div>
        </div>
    );
}
