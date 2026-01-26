import { useState } from 'react';
import {
    DollarSign, Calendar, Download, TrendingUp, Clock,
    CheckCircle, AlertCircle, ChevronRight, MapPin, FileText
} from 'lucide-react';

// Payout Management - History, schedule, and mileage export
export default function PayoutManagement({ cleaner }) {
    const [activeTab, setActiveTab] = useState('history'); // history, schedule, mileage
    const [dateRange, setDateRange] = useState('this-month');

    // Mock payout data
    const payouts = [
        {
            id: 'payout-001',
            amount: 245.00,
            status: 'paid',
            date: '2026-01-15',
            jobCount: 3,
            jobs: [
                { id: 'GS-2026-001', service: 'Deep Clean', earnings: 85, tips: 10 },
                { id: 'GS-2026-002', service: 'Regular Clean', earnings: 65, tips: 5 },
                { id: 'GS-2026-003', service: 'Move-Out Clean', earnings: 75, tips: 5 }
            ]
        },
        {
            id: 'payout-002',
            amount: 180.00,
            status: 'pending',
            date: '2026-01-22',
            jobCount: 2,
            jobs: [
                { id: 'GS-2026-004', service: 'Regular Clean', earnings: 90, tips: 0 },
                { id: 'GS-2026-005', service: 'Deep Clean', earnings: 90, tips: 0 }
            ]
        }
    ];

    // Mock mileage data
    const mileageData = [
        { date: '2026-01-15', trips: 3, miles: 24.5 },
        { date: '2026-01-16', trips: 2, miles: 18.2 },
        { date: '2026-01-17', trips: 4, miles: 31.8 },
        { date: '2026-01-18', trips: 1, miles: 8.5 }
    ];

    const totalMiles = mileageData.reduce((sum, day) => sum + day.miles, 0);
    const totalTrips = mileageData.reduce((sum, day) => sum + day.trips, 0);

    const handleExportMileage = () => {
        // Generate CSV
        const headers = ['Date', 'Trips', 'Miles'];
        const rows = mileageData.map(d => [d.date, d.trips, d.miles.toFixed(1)]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goswish-mileage-${dateRange}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPayouts = () => {
        // Generate CSV
        const headers = ['Payout ID', 'Date', 'Amount', 'Status', 'Jobs'];
        const rows = payouts.map(p => [
            p.id,
            p.date,
            p.amount.toFixed(2),
            p.status,
            p.jobCount
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goswish-payouts-${dateRange}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">Earnings</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'history'
                                ? 'bg-secondary-100 text-secondary-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Payouts
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'schedule'
                                ? 'bg-secondary-100 text-secondary-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('mileage')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'mileage'
                                ? 'bg-secondary-100 text-secondary-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Mileage
                    </button>
                </div>
            </div>

            {/* Payout History */}
            {activeTab === 'history' && (
                <div className="px-6 py-6 space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-4">
                            <p className="text-sm text-gray-500 mb-1">Total Earned</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${payouts.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="card p-4">
                            <p className="text-sm text-gray-500 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-secondary-600">
                                ${payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportPayouts}
                        className="btn btn-ghost w-full"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Export CSV
                    </button>

                    {/* Payouts List */}
                    <div className="space-y-4">
                        {payouts.map(payout => (
                            <div key={payout.id} className="card p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm text-gray-400">{payout.id}</span>
                                            <span className={`badge ${payout.status === 'paid' ? 'badge-success' :
                                                    payout.status === 'pending' ? 'badge-warning' :
                                                        'badge-error'
                                                } text-xs`}>
                                                {payout.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{payout.date}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${payout.amount.toFixed(2)}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-500 mb-2">{payout.jobCount} jobs included:</p>
                                    <div className="space-y-2">
                                        {payout.jobs.map(job => (
                                            <div key={job.id} className="flex items-center justify-between text-sm">
                                                <div>
                                                    <span className="font-mono text-gray-400 text-xs">{job.id}</span>
                                                    <span className="text-gray-600 ml-2">{job.service}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">${job.earnings}</p>
                                                    {job.tips > 0 && (
                                                        <p className="text-xs text-secondary-600">+${job.tips} tip</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payout Schedule */}
            {activeTab === 'schedule' && (
                <div className="px-6 py-6 space-y-6">
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Payout Schedule</h3>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-secondary-300 transition-colors">
                                <input type="radio" name="schedule" defaultChecked className="w-5 h-5" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Weekly</p>
                                    <p className="text-sm text-gray-500">Every Friday</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-secondary-300 transition-colors">
                                <input type="radio" name="schedule" className="w-5 h-5" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Daily</p>
                                    <p className="text-sm text-gray-500">Every day (minimum $25)</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-secondary-300 transition-colors">
                                <input type="radio" name="schedule" className="w-5 h-5" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Manual</p>
                                    <p className="text-sm text-gray-500">Request when ready</p>
                                </div>
                            </label>
                        </div>

                        <button className="btn btn-secondary w-full mt-6">
                            Save Schedule
                        </button>
                    </div>

                    <div className="card p-6 bg-primary-50 border-primary-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-primary-900 mb-1">Bank Account Required</p>
                                <p className="text-sm text-primary-700">
                                    Connect your bank account to receive payouts via direct deposit.
                                </p>
                                <button className="btn btn-primary mt-3">
                                    Connect Bank Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mileage Tracking */}
            {activeTab === 'mileage' && (
                <div className="px-6 py-6 space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-4">
                            <p className="text-sm text-gray-500 mb-1">Total Miles</p>
                            <p className="text-2xl font-bold text-gray-900">{totalMiles.toFixed(1)}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-sm text-gray-500 mb-1">Total Trips</p>
                            <p className="text-2xl font-bold text-secondary-600">{totalTrips}</p>
                        </div>
                    </div>

                    {/* Date Range Selector */}
                    <div className="card p-4">
                        <label className="label">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="input"
                        >
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="this-year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportMileage}
                        className="btn btn-secondary w-full"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Export Mileage CSV
                    </button>

                    {/* Mileage List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
                        {mileageData.map(day => (
                            <div key={day.date} className="card p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{day.date}</p>
                                        <p className="text-sm text-gray-500">{day.trips} trips</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">{day.miles.toFixed(1)} mi</p>
                                        <p className="text-xs text-gray-500">
                                            ${(day.miles * 0.67).toFixed(2)} deduction
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tax Info */}
                    <div className="card p-6 bg-warning-50 border-warning-200">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-warning-900 mb-1">Tax Deduction Info</p>
                                <p className="text-sm text-warning-700">
                                    The IRS standard mileage rate for 2026 is $0.67 per mile.
                                    Export your mileage log for tax filing purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
