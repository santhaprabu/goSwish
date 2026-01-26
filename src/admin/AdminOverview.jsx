import { useState, useEffect } from 'react';
import {
    Users, DollarSign, Calendar, TrendingUp,
    Briefcase, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    getDocs, COLLECTIONS
} from '../storage/db';

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-bl-full -mr-4 -mt-4 transition-transform hover:scale-110`} />

        <div className="relative">
            <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-4 text-${color}-600`}>
                <Icon className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>

            <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium flex items-center gap-1
                    ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {subValue}
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
            </div>
        </div>
    </div>
);

export default function AdminOverview() {
    const [stats, setStats] = useState({
        users: 0,
        cleaners: 0,
        completedJobs: 0,
        totalRevenue: 0,
        revenueTrend: 'up',
        activeBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const users = await getDocs(COLLECTIONS.USERS);
                const customers = users.filter(u => u.role === 'customer').length;
                const cleaners = users.filter(u => u.role === 'cleaner').length; // or from CLEANERS collection

                const bookings = await getDocs(COLLECTIONS.BOOKINGS);
                const completed = bookings.filter(b => b.status === 'completed');
                const revenue = completed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const active = bookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)).length;

                setStats({
                    users: customers,
                    cleaners: cleaners,
                    completedJobs: completed.length,
                    totalRevenue: revenue,
                    activeBookings: active,
                    revenueTrend: 'up'
                });
            } catch (e) {
                console.error("Error loading admin stats", e);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    subValue="+12.5%"
                    icon={DollarSign}
                    color="green"
                    trend="up"
                />
                <StatCard
                    title="Active Bookings"
                    value={stats.activeBookings}
                    subValue="+4 pending"
                    icon={Calendar}
                    color="blue"
                    trend="up"
                />
                <StatCard
                    title="Total Customers"
                    value={stats.users}
                    subValue="+8 new"
                    icon={Users}
                    color="purple"
                    trend="up"
                />
                <StatCard
                    title="Cleaners"
                    value={stats.cleaners}
                    subValue="+2 awaiting approval"
                    icon={Briefcase}
                    color="orange"
                    trend="up"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">New Customer Registration</p>
                                <p className="text-xs text-gray-500">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-2 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Payment Received ($120.00)</p>
                                <p className="text-xs text-gray-500">15 minutes ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">System Health</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Active Cleaners</span>
                                <span className="font-medium">85% online</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{ width: '85%' }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Booking Fill Rate</span>
                                <span className="font-medium">92%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full">
                                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '92%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
