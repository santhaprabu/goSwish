import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    getCleanerEarnings,
    getCleanerDailyEarnings,
    getCleanerByUserId,
    getCleanerJobs
} from '../storage';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Download,
    ChevronRight, ChevronLeft, Clock, MapPin, Filter, ArrowUp,
    ArrowDown, Briefcase, Star, Award, Target, Zap, Loader
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

export default function EarningsDashboard({ onBack, onViewPayouts }) {
    const { user } = useApp();
    const [period, setPeriod] = useState('week');
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [loading, setLoading] = useState(true);
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

                // Get earnings for different periods
                const [todayData, weekData, monthData] = await Promise.all([
                    getCleanerEarnings(cleanerProfile.id, 'today'),
                    getCleanerEarnings(cleanerProfile.id, 'week'),
                    getCleanerEarnings(cleanerProfile.id, 'month')
                ]);

                // Get daily earnings for chart
                const dailyEarnings = await getCleanerDailyEarnings(cleanerProfile.id, 7);

                // Get recent jobs as transactions
                const recentJobs = allJobs
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10)
                    .map(job => {
                        const isPayout = job.id.startsWith('txn_') || job.type === 'payout' || job.type === 'withdrawal';
                        return {
                            id: job.id,
                            type: isPayout ? 'payout' : 'earning',
                            description: isPayout
                                ? (job.description || 'Payout')
                                : `${job.serviceType || 'Clean'} - ${job.customerName || 'Customer'}`,
                            amount: job.amount || job.earnings || 0,
                            date: new Date(job.completedAt || job.scheduledDate || job.createdAt).toLocaleDateString(),
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
                        trend: 12.5 // Would calculate from previous week comparison
                    },
                    month: {
                        earnings: monthData.earnings,
                        jobs: monthData.jobs,
                        hours: monthData.hours,
                        tips: monthData.tips,
                        trend: 8.3
                    },
                    year: { earnings: monthData.earnings * 12, jobs: monthData.jobs * 12, hours: monthData.hours * 12, tips: monthData.tips * 12 },
                    dailyEarnings,
                    transactions: recentJobs,
                    goals: {
                        weekly: { target: 2000, current: weekData.earnings },
                        monthly: { target: 8000, current: monthData.earnings }
                    }
                });
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
    const maxDailyEarning = Math.max(...(data.dailyEarnings?.map(d => d.earnings) || [1]), 1);

    const goalProgress = data.goals.weekly.target > 0
        ? (data.goals.weekly.current / data.goals.weekly.target) * 100
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Earnings</h1>
                <button onClick={onViewPayouts} className="p-2">
                    <Download className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Main Earnings Card */}
            <div className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white px-6 py-8">
                <div className="text-center mb-6">
                    <p className="text-secondary-100 text-sm mb-1">
                        {period === 'today' ? "Today's" : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'} Earnings
                    </p>
                    <p className="text-5xl font-bold">${periodData.earnings.toLocaleString()}</p>
                    {periodData.trend && (
                        <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm
                            ${periodData.trend >= 0 ? 'bg-success-500/20 text-success-200' : 'bg-error-500/20 text-error-200'}`}>
                            {periodData.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {periodData.trend >= 0 ? '+' : ''}{periodData.trend}%
                        </div>
                    )}
                </div>

                {/* Period Tabs */}
                <div className="flex gap-2 justify-center">
                    {['today', 'week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize
                                ${period === p ? 'bg-white text-secondary-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        >
                            {p === 'today' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="px-6 -mt-4">
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
                        <span className="text-sm text-gray-500">
                            ${data.goals.weekly.current} / ${data.goals.weekly.target}
                        </span>
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
                    <div className="flex items-end justify-between h-32 gap-2">
                        {data.dailyEarnings.map((day, i) => {
                            const height = maxDailyEarning > 0 ? (day.earnings / maxDailyEarning) * 100 : 0;
                            const isToday = i === new Date().getDay() - 1 || (i === 6 && new Date().getDay() === 0);

                            return (
                                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                        {day.earnings > 0 ? `$${day.earnings}` : '-'}
                                    </span>
                                    <div
                                        className={`w-full rounded-t-lg transition-all ${isToday ? 'bg-secondary-500' : day.earnings > 0 ? 'bg-secondary-200' : 'bg-gray-100'
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <span className={`text-xs ${isToday ? 'text-secondary-600 font-semibold' : 'text-gray-500'}`}>
                                        {day.day}
                                    </span>
                                </div>
                            );
                        })}
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
                            ${Math.round(periodData.earnings / (periodData.hours || 1))}/hr
                        </p>
                        <p className="text-xs text-gray-600">Avg. hourly rate</p>
                    </div>
                    <div className="card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <Award className="w-5 h-5 text-yellow-600 mb-2" />
                        <p className="text-lg font-bold text-gray-900">
                            {Math.round((periodData.tips / periodData.earnings) * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">Tip rate</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-6 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <button className="text-sm text-secondary-600 font-medium flex items-center gap-1">
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
                                    {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount)}
                                </p>
                                {txn.tip > 0 && (
                                    <p className="text-xs text-yellow-600">+${txn.tip} tip</p>
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
