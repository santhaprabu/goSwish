import { useState, useEffect } from 'react';
import {
    Home, MapPin, Calendar, User, Sparkles, Plus,
    ChevronRight, Bell, Clock, CheckCircle2, Star,
    TrendingUp, Wallet, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BottomNavigation({ activeTab, onTabChange, role }) {
    const isCustomer = role === 'customer';

    const customerTabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'houses', label: 'Houses', icon: MapPin },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const cleanerTabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'jobs', label: 'Jobs', icon: Sparkles },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'earnings', label: 'Earnings', icon: Wallet },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const tabs = isCustomer ? customerTabs : cleanerTabs;

    return (
        <nav className="bottom-nav">
            <div className="flex items-center justify-around">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <IconComponent
                                className={`w-6 h-6 transition-colors ${isActive
                                    ? isCustomer ? 'text-primary-600' : 'text-secondary-600'
                                    : ''
                                    }`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`text-xs mt-1 font-medium ${isActive
                                ? isCustomer ? 'text-primary-600' : 'text-secondary-600'
                                : ''
                                }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export function CustomerHome({ onNewBooking, onViewHouses, onViewBookings }) {
    const { user, getUserHouses, getUserBookings, serviceTypes } = useApp();

    const [houses, setHouses] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            if (!user) return;

            try {
                if (isMounted) {
                    setLoading(true);
                }
                const [housesData, bookingsData] = await Promise.all([
                    getUserHouses(),
                    getUserBookings()
                ]);
                if (isMounted) {
                    setHouses(housesData || []);
                    setBookings(bookingsData || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [user, getUserHouses, getUserBookings]);

    const recentBookings = bookings.slice(0, 3);
    const defaultHouse = houses.find(h => h.isDefault);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
                <div className="px-6 pt-12 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome Back {user?.name?.split(' ')[0] || 'Friend'}</h1>
                        </div>
                        <button className="relative p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                    </div>

                    {/* Quick book card */}
                    <button
                        onClick={onNewBooking}
                        className="w-full bg-white rounded-2xl p-5 shadow-elevated text-left 
                       hover:shadow-xl transition-shadow group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 
                              rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30
                              group-hover:scale-105 transition-transform">
                                <Plus className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">Book a Cleaning</h3>
                                <p className="text-gray-500 text-sm">
                                    {defaultHouse ? defaultHouse.name : 'Add a property to get started'}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 mt-6 space-y-6">
                {/* My Properties */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">My Properties</h2>
                        <button
                            onClick={onViewHouses}
                            className="text-primary-600 text-sm font-medium flex items-center gap-1"
                        >
                            View all <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {houses.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto pr-2 max-h-[220px] scrollbar-thin">
                            {houses.map((house) => (
                                <div
                                    key={house.id}
                                    className="w-full card group cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
                                    onClick={onViewHouses}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                                            <Home className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900 truncate">{house.nickname}</h3>
                                                {house.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{house.address.street}</p>
                                            <p className="text-xs text-gray-400 mt-1">{house.size.toLocaleString()} sqft</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add new property button */}
                            <button
                                onClick={onViewHouses}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl
                           flex items-center justify-center gap-2 text-gray-400
                           hover:border-primary-300 hover:text-primary-500 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-sm font-medium">Add New Property</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onViewHouses}
                            className="w-full card flex items-center gap-4 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                                <Plus className="w-7 h-7 text-primary-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold text-gray-900">Add Your First Property</h3>
                                <p className="text-sm text-gray-500">Get started with booking a cleaning</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Services */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Our Services</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {serviceTypes.map((service) => (
                            <button
                                key={service.id}
                                onClick={onNewBooking}
                                className="card text-left hover:shadow-lg transition-all hover:-translate-y-0.5"
                            >

                                <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                                <p className="text-primary-600 font-bold text-sm mt-2">${service.rate}/sqft</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Bookings */}
                {recentBookings.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
                            <button
                                onClick={onViewBookings}
                                className="text-primary-600 text-sm font-medium flex items-center gap-1"
                            >
                                View all <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {recentBookings.map((booking) => {
                                const service = serviceTypes.find(s => s.id === booking.serviceType);
                                return (
                                    <div
                                        key={booking.id}
                                        className="card flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-success-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{service?.name}</h3>
                                                <span className="badge badge-success text-xs">{booking.status}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono">{booking.id}</p>
                                        </div>
                                        <span className="font-bold text-gray-900">${booking.pricing?.total?.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Promo banner */}
                <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">Save 20% on first clean!</h3>
                            <p className="text-secondary-100 text-sm">Use code WELCOME20 at checkout</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BookingsList() {
    const { getUserBookings, serviceTypes, getUserHouses } = useApp();
    const [bookings, setBookings] = useState([]);
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [bookingsData, housesData] = await Promise.all([
                    getUserBookings(),
                    getUserHouses()
                ]);
                if (isMounted) {
                    setBookings(bookingsData || []);
                    setHouses(housesData || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [getUserBookings, getUserHouses]);

    if (bookings.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <div className="px-4 py-3">
                        <h1 className="text-lg font-semibold text-center">My Bookings</h1>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h2>
                    <p className="text-gray-500 mb-8 max-w-xs">
                        Book your first cleaning and it will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">My Bookings</h1>
                </div>
            </div>

            <div className="px-6 py-4 space-y-4">
                {bookings.map((booking) => {
                    const service = serviceTypes.find(s => s.id === booking.serviceType);
                    const house = houses.find(h => h.id === booking.houseId);

                    return (
                        <div key={booking.id} className="card">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="font-mono text-sm text-gray-400">{booking.id}</span>
                                    <h3 className="font-bold text-gray-900">{service?.name}</h3>
                                </div>
                                <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' :
                                    booking.status === 'matched' ? 'badge-primary' :
                                        booking.status === 'completed' ? 'badge-secondary' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {house?.name} - {house?.address.street}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {booking.dateOptions?.map(d =>
                                        new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric'
                                        })
                                    ).join(', ')}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-gray-500">Total Paid</span>
                                <span className="text-lg font-bold text-primary-600">
                                    ${booking.pricing?.total?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function CleanerHome({ onNotifications, onMessaging, onRatings, onViewJobs }) {
    const { user } = useApp();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        pendingJobs: 0,
        completedThisWeek: 0,
        earnings: 0,
        rating: 0,
        unreadMessages: 0,
        hoursThisWeek: 0,
        todaySchedule: [],
        notificationCount: 0
    });

    // Load dashboard data from database
    useEffect(() => {
        let isMounted = true;

        async function loadDashboardData() {
            if (!user?.uid) return;

            try {
                setLoading(true);

                // Dynamically import storage functions
                const storage = await import('../storage');

                // Get cleaner profile
                const cleanerProfile = await storage.getCleanerByUserId(user.uid);

                if (!cleanerProfile) {
                    if (isMounted) setLoading(false);
                    return;
                }

                // Fetch all data in parallel
                const [
                    weekEarnings,
                    allJobs,
                    reviewsData,
                    notifications,
                    conversations
                ] = await Promise.all([
                    storage.getCleanerEarnings(cleanerProfile.id, 'week'),
                    storage.getCleanerJobs(cleanerProfile.id),
                    storage.getCleanerReviewsWithStats(cleanerProfile.id),
                    storage.getUserNotifications(user.uid),
                    storage.getUserConversations(user.uid)
                ]);

                // Calculate stats
                const today = new Date().toISOString().split('T')[0];
                const todayJobs = allJobs.filter(job => {
                    const jobDate = new Date(job.scheduledDate || job.createdAt);
                    return jobDate.toISOString().split('T')[0] === today;
                });

                const pendingJobs = allJobs.filter(job =>
                    job.status === 'pending' || job.status === 'available' || job.status === 'scheduled'
                ).length;

                const completedThisWeek = allJobs.filter(job => {
                    if (job.status !== 'completed') return false;
                    const jobDate = new Date(job.completedAt || job.scheduledDate);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return jobDate >= weekAgo;
                }).length;

                const unreadNotifications = notifications.filter(n => !n.read).length;
                const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

                // Format today's schedule
                const todaySchedule = todayJobs.map(job => {
                    const startTime = new Date(job.scheduledDate || job.startTime);
                    const hours = startTime.getHours();
                    const duration = job.duration || 2;
                    const endHours = hours + duration;

                    const formatTime = (h) => {
                        const period = h >= 12 ? 'PM' : 'AM';
                        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                        return `${hour12}:00 ${period}`;
                    };

                    return {
                        id: job.id,
                        timeRange: `${formatTime(hours)} - ${formatTime(endHours)}`,
                        serviceType: job.serviceType || 'Cleaning',
                        address: job.address || 'Address pending',
                        earnings: job.amount || job.earnings || 0,
                        status: job.status
                    };
                });

                if (isMounted) {
                    setDashboardData({
                        pendingJobs,
                        completedThisWeek,
                        earnings: weekEarnings.earnings,
                        rating: reviewsData.stats?.averageRating || cleanerProfile.rating || 4.8,
                        unreadMessages,
                        hoursThisWeek: weekEarnings.hours,
                        todaySchedule,
                        notificationCount: unreadNotifications
                    });
                }
            } catch (error) {
                console.error('Error loading cleaner dashboard data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, [user?.uid]);

    const {
        pendingJobs,
        completedThisWeek,
        earnings,
        rating,
        unreadMessages,
        hoursThisWeek,
        todaySchedule,
        notificationCount
    } = dashboardData;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white">
                <div className="px-6 pt-12 pb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-secondary-100 text-sm">Good morning</p>
                            <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0] || 'Cleaner'}</h1>
                        </div>
                        <button
                            onClick={onNotifications}
                            className="relative p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
                        >
                            <Bell className="w-6 h-6" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                                 flex items-center justify-center text-xs font-bold">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-secondary-100 text-xs mb-1">This Week</p>
                            <p className="text-2xl font-bold">${earnings}</p>
                        </div>
                        <button
                            onClick={onRatings}
                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/30 transition-colors"
                        >
                            <p className="text-secondary-100 text-xs mb-1">Rating</p>
                            <div className="flex items-center gap-1">
                                <Star className="w-5 h-5 fill-current text-yellow-400" />
                                <span className="text-2xl font-bold">{rating.toFixed ? rating.toFixed(1) : rating}</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 -mt-2 space-y-6">
                {/* Available jobs card */}
                <button
                    onClick={onViewJobs}
                    className="card w-full text-left bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200 hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-secondary-500 to-secondary-600 
                            rounded-xl flex items-center justify-center shadow-lg shadow-secondary-500/30">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{pendingJobs} New Jobs</h3>
                            <p className="text-gray-500 text-sm">Waiting for you nearby</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </button>

                {/* Quick Access Grid */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Access</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={onNotifications}
                            className="card p-4 text-center hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Bell className="w-5 h-5 text-primary-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Alerts</p>
                            {notificationCount > 0 && (
                                <span className="text-xs text-primary-600">{notificationCount} new</span>
                            )}
                        </button>

                        <button
                            onClick={onMessaging}
                            className="card p-4 text-center hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-2 relative">
                                <Search className="w-5 h-5 text-secondary-600" />
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                                        {unreadMessages}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">Messages</p>
                            <span className="text-xs text-gray-500">{unreadMessages} unread</span>
                        </button>

                        <button
                            onClick={onRatings}
                            className="card p-4 text-center hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Star className="w-5 h-5 text-yellow-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Reviews</p>
                            <span className="text-xs text-gray-500">{rating.toFixed ? rating.toFixed(1) : rating} avg</span>
                        </button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="card">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-success-500" />
                            <span className="text-sm text-gray-500">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{completedThisWeek}</p>
                        <p className="text-xs text-gray-400">This week</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-secondary-500" />
                            <span className="text-sm text-gray-500">Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{hoursThisWeek}</p>
                        <p className="text-xs text-gray-400">This week</p>
                    </div>
                </div>

                {/* Today's schedule */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Schedule</h2>

                    {todaySchedule.length > 0 ? (
                        <div className="space-y-3">
                            {todaySchedule.map((job, index) => (
                                <div
                                    key={job.id || index}
                                    className={`card ${job.status === 'in_progress' ? 'border-l-4 border-secondary-500' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-medium ${job.status === 'in_progress' ? 'text-secondary-600' : 'text-gray-400'}`}>
                                                    {job.timeRange}
                                                </span>
                                                {job.status === 'in_progress' && (
                                                    <span className="badge badge-secondary text-xs">In Progress</span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900">{job.serviceType}</h3>
                                            <p className="text-sm text-gray-500">{job.address}</p>
                                        </div>
                                        <span className={`font-bold ${job.status === 'in_progress' ? 'text-secondary-600' : 'text-gray-600'}`}>
                                            ${job.earnings}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8">
                            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-900 mb-1">No jobs scheduled today</p>
                            <p className="text-sm text-gray-500">Check available jobs to fill your day</p>
                        </div>
                    )}
                </div>

                {/* Verification status */}
                {user?.cleanerStatus === 'pending' && (
                    <div className="card bg-warning-50 border border-warning-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-warning-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">Verification Pending</h3>
                                <p className="text-sm text-gray-500">Background check in progress (24-48 hrs)</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ProfileScreen({ onLogout, onBecomeCleanerClick, onEditProfile, onPaymentMethods, onHelpCenter, onTermsPrivacy }) {
    const { user, selectedRole, setRole } = useApp();

    const isCustomer = selectedRole === 'customer';

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">Profile</h1>
                </div>
            </div>

            <div className="px-6 py-4 space-y-4">
                {/* Profile header */}
                <div className="card flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center
                          ${isCustomer ? 'bg-primary-50' : 'bg-secondary-50'}`}>
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className={`w-8 h-8 ${isCustomer ? 'text-primary-400' : 'text-secondary-400'}`} />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-gray-900 text-lg">{user?.name || 'User'}</h2>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                        <span className={`badge mt-2 ${isCustomer ? 'badge-primary' : 'badge-secondary'}`}>
                            {isCustomer ? 'Customer' : 'Cleaner'}
                        </span>
                    </div>
                </div>

                {/* Settings */}
                <div className="card p-0 divide-y divide-gray-100">
                    <button onClick={onEditProfile} className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="flex-1">Edit Profile</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50">
                        <Bell className="w-5 h-5 text-gray-400" />
                        <span className="flex-1">Notifications</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button onClick={onPaymentMethods} className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50">
                        <Wallet className="w-5 h-5 text-gray-400" />
                        <span className="flex-1">Payment Methods</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Role switcher */}
                    {user?.role === 'both' && (
                        <button
                            onClick={() => setRole(isCustomer ? 'cleaner' : 'customer')}
                            className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50"
                        >
                            <Sparkles className="w-5 h-5 text-gray-400" />
                            <span className="flex-1">Switch to {isCustomer ? 'Cleaner' : 'Customer'}</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    )}

                    {/* Become a cleaner */}
                    {isCustomer && user?.role !== 'both' && !user?.cleanerStatus && (
                        <button
                            onClick={onBecomeCleanerClick}
                            className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50"
                        >
                            <Sparkles className="w-5 h-5 text-secondary-500" />
                            <div className="flex-1">
                                <span className="text-secondary-600 font-medium">Become a Cleaner</span>
                                <p className="text-xs text-gray-400">Earn money on your schedule</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Support */}
                <div className="card p-0 divide-y divide-gray-100">
                    <button onClick={onHelpCenter} className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50">
                        <Search className="w-5 h-5 text-gray-400" />
                        <span className="flex-1">Help Center</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button onClick={onTermsPrivacy} className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-gray-50">
                        <span className="text-gray-400">📋</span>
                        <span className="flex-1">Terms & Privacy</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full btn bg-error-50 text-error-600 hover:bg-error-100"
                >
                    Sign Out
                </button>

                <p className="text-center text-xs text-gray-400 pt-4">
                    GoSwish v1.0.0
                </p>
            </div>
        </div>
    );
}

export function BecomeCleanerScreen({ onBack, onSubmit }) {
    const { user, updateUser } = useApp();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        updateUser({
            uid: user.uid,
            role: 'both',
            cleanerStatus: 'pending',
        });

        setLoading(false);
        setStep(3);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {step < 3 && (
                <div className="app-bar">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button onClick={onBack} className="btn-ghost p-2 -ml-2 rounded-xl">
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <h1 className="text-lg font-semibold">Become a Cleaner</h1>
                        <div className="w-10" />
                    </div>
                </div>
            )}

            <div className="flex-1 px-6 py-6">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 
                              rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Our Team</h2>
                            <p className="text-gray-500">Earn money with flexible cleaning jobs</p>
                        </div>

                        <div className="space-y-4">
                            <div className="card flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Flexible Schedule</h3>
                                    <p className="text-sm text-gray-500">Work when you want, as much as you want</p>
                                </div>
                            </div>

                            <div className="card flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Weekly Payments</h3>
                                    <p className="text-sm text-gray-500">Get paid every week, direct to your bank</p>
                                </div>
                            </div>

                            <div className="card flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Support & Training</h3>
                                    <p className="text-sm text-gray-500">We're here to help you succeed</p>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-warning-50 border border-warning-100">
                            <h3 className="font-semibold text-gray-900 mb-2">What you'll need:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Valid ID for background check</li>
                                <li>• Bank account for payments</li>
                                <li>• About 10 minutes to complete application</li>
                                <li>• 24-48 hours for verification</li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900">Application Details</h2>

                        <div className="card">
                            <p className="text-sm text-gray-500 mb-4">
                                For this demo, we'll skip the full application process. In production,
                                this would include:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    Personal information verification
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    Background check consent
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    Bank account connection (Stripe)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    Service area selection
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 
                            rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                        <p className="text-gray-500 mb-8 max-w-xs">
                            We're reviewing your application. You'll hear from us within 24-48 hours.
                        </p>
                        <button
                            onClick={onSubmit}
                            className="btn btn-secondary"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>

            {step < 3 && (
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe">
                    <button
                        onClick={step === 1 ? () => setStep(2) : handleSubmit}
                        disabled={loading}
                        className="btn btn-secondary w-full py-4"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : step === 1 ? (
                            'Continue'
                        ) : (
                            'Submit Application'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
