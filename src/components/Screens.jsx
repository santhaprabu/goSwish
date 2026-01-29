import { useState, useEffect } from 'react';
import {
    Home, MapPin, Calendar, User, Sparkles, Plus,
    ChevronRight, Bell, Clock, CheckCircle2, Star,
    TrendingUp, Wallet, Search, MessageSquare, Settings,
    ShieldCheck, Share2, LogOut, Heart, HelpCircle, Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BottomNavigation({ activeTab, onTabChange, role }) {
    const isCustomer = role === 'homeowner';

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

export function CustomerHome({ onNewBooking, onViewHouses, onViewBookings, onNotifications }) {
    const { user, getUserHouses, getUserBookings, serviceTypes } = useApp();

    const [houses, setHouses] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    // Load data on mount
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            if (!user) return;

            try {
                if (isMounted) {
                    setLoading(true);
                }

                // Import storage dynamically
                const { getUserNotifications } = await import('../storage');

                const [housesData, bookingsData, notifications] = await Promise.all([
                    getUserHouses(),
                    getUserBookings(),
                    getUserNotifications(user.uid)
                ]);

                if (isMounted) {
                    setHouses(housesData || []);
                    setBookings(bookingsData || []);
                    if (notifications) {
                        setNotificationCount(notifications.filter(n => !n.read).length);
                    }
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
    const defaultHouse = houses.find(h => h.isDefault) || houses[0];
    const activeBookingsCount = bookings.filter(b => ['confirmed', 'matched', 'scheduled'].includes(b.status)).length;

    return (
        <div className="min-h-screen bg-gray-100 pb-24 font-sans">
            {/* Uber-style Black Header */}
            <div className="bg-black text-white px-5 pt-3 pb-5 rounded-b-[1.5rem] shadow-2xl relative z-20">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        {/* Profile Icon */}
                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden p-0.5 flex-shrink-0">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-full">
                                    <User className="w-8 h-8 text-white/70" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Welcome Back</p>
                            <h2 className="text-xl font-bold text-white leading-tight">{user?.name?.split(' ')[0] || 'Friend'}</h2>
                            < div className="flex items-center gap-2 mt-2">
                                <span className="bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Home Owner
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={onNotifications}
                        className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors active:scale-95 mt-1"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-white" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800" />
                        )}
                    </button>
                </div>

                {/* Primary "Book" Action Button */}
                <button
                    onClick={onNewBooking}
                    className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-lg py-3 rounded-2xl shadow-xl shadow-secondary-900/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <Sparkles className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">
                        Book a Cleaning
                    </span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="px-4 mt-3 relative z-30">
                <div className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-3 gap-4 divide-x divide-gray-100">
                    <button onClick={onViewHouses} className="text-center group flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-xl font-bold text-gray-900">{houses.length}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest group-hover:text-gray-800">Properties</p>
                    </button>
                    <button onClick={onViewBookings} className="text-center group flex flex-col items-center">
                        <p className="text-xl font-bold text-gray-900 mb-1">{activeBookingsCount}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest group-hover:text-gray-800">Active</p>
                    </button>
                    <div className="text-center flex flex-col items-center">
                        <p className="text-xl font-bold text-gray-900 mb-1">0</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Rewards</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-5 mt-4 space-y-5">

                {/* My Properties */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider opacity-70">Properties</h3>
                        <button onClick={onViewHouses} className="text-xs font-bold text-primary-600">View All</button>
                    </div>

                    {houses.length > 0 ? (
                        <div className="space-y-3">
                            {houses.map((house) => (
                                <div
                                    key={house.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between cursor-pointer hover:border-primary-100 transition-colors"
                                    onClick={onViewHouses}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Home className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{house.nickname}</h3>
                                            <p className="text-gray-500 text-[10px] truncate max-w-[200px]">{house.address?.street || 'No Address'}</p>
                                        </div>
                                    </div>
                                    {house.isDefault && <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                                </div>
                            ))}
                            <button
                                onClick={onViewHouses}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl
                           flex items-center justify-center gap-2 text-gray-400
                           hover:border-primary-300 hover:text-primary-500 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-sm font-medium">Add Property</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onViewHouses}
                            className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                                <Plus className="w-6 h-6 text-primary-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">Add First Property</h3>
                                <p className="text-sm text-gray-500">To enable bookings</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* Recent Bookings */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider opacity-70">Recent Bookings</h3>
                        {recentBookings.length > 0 && (
                            <button onClick={onViewBookings} className="text-xs font-bold text-primary-600">View All</button>
                        )}
                    </div>

                    {recentBookings.length > 0 ? (
                        <div className="space-y-3">
                            {recentBookings.map((booking) => {
                                const service = serviceTypes.find(s => s.id === booking.serviceType);
                                return (
                                    <div
                                        key={booking.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{service?.name || 'Cleaning'}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono">{booking.id}</p>
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${booking.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                                    booking.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">${(booking.pricing?.total || booking.totalAmount || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400">No bookings yet</p>
                        </div>
                    )}
                </div>

                {/* Promo Banner */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">First Clean 20% Off</h3>
                            <p className="text-primary-100 text-xs">Use code <span className="font-mono font-bold text-white">WELCOME20</span></p>
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
                <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="w-10" />
                        <h1 className="text-lg font-bold">My Bookings</h1>
                        <div className="w-10" />
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
            <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                <div className="flex items-center justify-between">
                    <div className="w-10" />
                    <h1 className="text-lg font-bold">My Bookings</h1>
                    <div className="w-10" />
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
                                    {house?.name} - {house?.address?.street || 'No Address'}
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
                                    ${(booking.pricing?.total || booking.totalAmount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function CleanerHome({ onNotifications, onMessaging, onRatings, onViewJobs, onViewHistory, onViewEarnings, onViewUpcoming }) {
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
        upcomingSchedule: [],
        notificationCount: 0,
        availableJobsCount: 0
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
                    conversations,
                    availableBookings
                ] = await Promise.all([
                    storage.getCleanerEarnings(cleanerProfile.id, 'week'),
                    storage.getCleanerJobs(cleanerProfile.id),
                    storage.getCleanerReviewsWithStats(cleanerProfile.id),
                    storage.getUserNotifications(user.uid),
                    storage.getUserConversations(user.uid),
                    storage.getAvailableBookings()
                ]);

                // Calculate stats
                const today = new Date().toISOString().split('T')[0];
                const todayJobs = allJobs.filter(job => {
                    const dateVal = job.scheduledDate || job.createdAt;
                    if (!dateVal) return false;
                    const jobDate = new Date(dateVal);
                    if (isNaN(jobDate.getTime())) return false;
                    return jobDate.toISOString().split('T')[0] === today;
                });

                const pendingJobs = allJobs.filter(job =>
                    job.status === 'pending' || job.status === 'available' || job.status === 'scheduled'
                ).length;

                const completedThisWeek = allJobs.filter(job => {
                    if (job.status !== 'completed') return false;
                    const dateVal = job.completedAt || job.scheduledDate;
                    if (!dateVal) return false;
                    const jobDate = new Date(dateVal);
                    if (isNaN(jobDate.getTime())) return false;
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return jobDate >= weekAgo;
                }).length;

                const unreadNotifications = notifications.filter(n => !n.read).length;
                const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

                // Filter out dismissed jobs locally
                let validAvailableBookings = availableBookings || [];
                try {
                    const dismissed = JSON.parse(localStorage.getItem(`dismissed_jobs_${user.uid}`) || '[]');
                    if (dismissed.length > 0) {
                        validAvailableBookings = validAvailableBookings.filter(b => !dismissed.includes(b.id));
                    }
                } catch (e) {
                    console.error('Error parsing dismissed jobs in Home', e);
                }

                const availableJobsCount = validAvailableBookings.length;

                const upcomingJobs = allJobs.filter(job => {
                    const dateVal = job.scheduledDate || job.startTime;
                    if (!dateVal) return false;
                    const jobDate = new Date(dateVal);
                    if (isNaN(jobDate.getTime())) return false;
                    const jobDateStr = jobDate.toISOString().split('T')[0];
                    return jobDateStr > today && (job.status === 'scheduled' || job.status === 'confirmed');
                }).sort((a, b) => {
                    const dateA = new Date(a.scheduledDate || a.startTime || 0);
                    const dateB = new Date(b.scheduledDate || b.startTime || 0);
                    return dateA - dateB;
                });

                // Format job for display
                const formatJobForSchedule = (job) => {
                    const dateVal = job.scheduledDate || job.startTime || new Date();
                    const startTime = new Date(dateVal);
                    const validDate = !isNaN(startTime.getTime()) ? startTime : new Date();
                    const hours = startTime.getHours();
                    const duration = job.duration || 2;
                    const endHours = hours + duration;

                    // Format date for upcoming jobs
                    const dateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const formatTime = (h) => {
                        const period = h >= 12 ? 'PM' : 'AM';
                        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                        return `${hour12}:00 ${period}`;
                    };

                    return {
                        id: job.id,
                        date: dateStr,
                        timeRange: `${formatTime(hours)} - ${formatTime(endHours)}`,
                        serviceType: job.serviceType || 'Cleaning',
                        address: job.address || 'Address pending',
                        earnings: (job.amount || job.earnings || 50).toFixed(2), // Format to 2 decimal places
                        status: job.status
                    };
                };

                const todaySchedule = todayJobs.map(formatJobForSchedule);
                const upcomingSchedule = upcomingJobs.slice(0, 5).map(formatJobForSchedule); // Show next 5 upcoming jobs

                // Calculate rating from reviews if stats are missing
                const calculatedRating = reviewsData.reviews && reviewsData.reviews.length > 0
                    ? Math.round((reviewsData.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsData.reviews.length) * 10) / 10
                    : 0;

                if (isMounted) {
                    setDashboardData({
                        pendingJobs,
                        completedThisWeek,
                        earnings: weekEarnings.earnings,
                        rating: reviewsData.stats?.averageRating || calculatedRating || cleanerProfile.stats?.rating || cleanerProfile.rating || 0,
                        unreadMessages,
                        hoursThisWeek: weekEarnings.hours,
                        todaySchedule,
                        upcomingSchedule,
                        notificationCount: unreadNotifications,
                        availableJobsCount
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
        upcomingSchedule,
        notificationCount,
        availableJobsCount
    } = dashboardData;

    return (
        <div className="min-h-screen bg-gray-100 pb-24 font-sans">
            {/* Uber-style Black Header */}
            <div className="bg-black text-white px-5 pt-3 pb-5 rounded-b-[1.5rem] shadow-2xl relative z-20">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        {/* Profile Icon */}
                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden p-0.5 flex-shrink-0">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-full">
                                    <User className="w-8 h-8 text-white/70" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{user?.name || 'Cleaner'}</h2>
                            <p className="text-gray-400 text-xs mb-2">{user?.email}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Professional Clean
                                </span>
                                <span className="bg-green-900/30 border border-green-900/50 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    Verified <CheckCircle2 className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={onNotifications}
                        className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors active:scale-95 mt-1"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-white" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
                        )}
                    </button>
                </div>

                {/* Big Earnings Display */}
                <div className="text-center mb-3">
                    <button onClick={onViewEarnings} className="group">
                        <h1 className="text-3xl font-bold tracking-tight mb-1 group-hover:text-gray-200 transition-colors">${earnings}</h1>
                        <div className="flex items-center justify-center gap-2 text-gray-400 font-medium bg-white/10 w-fit mx-auto px-3 py-0.5 rounded-full text-xs">
                            <span>Earned this week</span>
                            <ChevronRight className="w-3 h-3" />
                        </div>
                    </button>
                </div>

                {/* Primary "GO" Action Button */}
                <button
                    onClick={onViewJobs}
                    className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-lg py-3 rounded-2xl shadow-xl shadow-secondary-900/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10">
                        Available Jobs {availableJobsCount > 0 ? `(${availableJobsCount})` : ''}
                    </span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="px-4 mt-3 relative z-30">
                <div className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-3 gap-4 divide-x divide-gray-100">
                    <button onClick={onRatings} className="text-center group flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-xl font-bold text-gray-900">{rating.toFixed(1)}</span>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest group-hover:text-gray-800">Rating</p>
                    </button>
                    <button onClick={onViewHistory} className="text-center group flex flex-col items-center">
                        <p className="text-xl font-bold text-gray-900 mb-1">{completedThisWeek}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest group-hover:text-gray-800">Jobs</p>
                    </button>
                    <button onClick={onViewHistory} className="text-center group flex flex-col items-center">
                        <p className="text-xl font-bold text-gray-900 mb-1">{hoursThisWeek}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest group-hover:text-gray-800">Hours</p>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-5 mt-4 space-y-5">

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 opacity-70">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onMessaging}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Messages</p>
                                {unreadMessages > 0 ? (
                                    <p className="text-xs font-bold text-secondary-600">{unreadMessages} unread</p>
                                ) : (
                                    <p className="text-xs text-gray-500">No new messages</p>
                                )}
                            </div>
                        </button>

                        <button
                            onClick={onViewEarnings}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Wallet className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Wallet</p>
                                <p className="text-xs text-gray-500">Manage payouts</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Today's Schedule */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 opacity-70">Today's Plan</h3>
                    {todaySchedule.length > 0 ? (
                        <div className="space-y-4">
                            {todaySchedule.map((job, index) => (
                                <div
                                    key={job.id || index}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center justify-center w-14 pt-1">
                                            <p className="text-[10px] font-bold text-gray-500 mb-0.5 whitespace-nowrap">{job.timeRange.split(' - ')[0]}</p>
                                            <div className="h-6 w-0.5 bg-gray-200 my-0.5"></div>
                                            <p className="text-[10px] font-bold text-gray-500 mt-0.5 whitespace-nowrap">{job.timeRange.split(' - ')[1]}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg capitalize">{job.serviceType.replace('-', ' ')}</h4>
                                            <p className="text-gray-500 text-sm mb-2">{job.address}</p>
                                            {job.status === 'in_progress' && (
                                                <span className="inline-block px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs font-bold rounded-full">
                                                    In Progress
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">${job.earnings}</p>
                                        <ChevronRight className="w-5 h-5 text-gray-300 ml-auto mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-900">You're all caught up</p>
                            <p className="text-sm text-gray-400 mt-1">Check "Available Jobs" for upcoming requests</p>
                        </div>
                    )}
                </div>

                {/* Upcoming Schedule */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider opacity-70">Upcoming Jobs</h3>
                        {upcomingSchedule.length > 0 && (
                            <button onClick={onViewUpcoming} className="text-xs font-bold text-secondary-600">View All</button>
                        )}
                    </div>

                    {upcomingSchedule.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingSchedule.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-50 px-3 py-2 rounded-lg text-center min-w-[60px]">
                                            <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{job.date.split(' ')[0]}</p>
                                            <p className="text-lg font-bold text-gray-900 leading-none">{job.date.split(' ')[1]}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{job.serviceType}</h4>
                                            <p className="text-gray-500 text-xs">{job.timeRange}</p>
                                            <p className="text-gray-400 text-[10px] mt-0.5 truncate max-w-[150px]">{job.address}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">${job.earnings}</p>
                                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Confirmed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400">No upcoming jobs scheduled</p>
                        </div>
                    )}
                </div>

                {/* Verification Widget */}
                {user?.cleanerStatus === 'pending' && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Account Pending</h4>
                            <p className="text-xs text-gray-500">We are verifying your profile details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ProfileScreen({ onLogout, onBecomeCleanerClick, onEditProfile, onPaymentMethods, onBankInfo, onHelpCenter, onTermsPrivacy, onNotifications, onMessaging, onViewRatings, onViewEarnings, onViewBookings, onViewHouses }) {
    const { user, selectedRole, setRole } = useApp();
    const [stats, setStats] = useState({
        bookings: 0,
        houses: 0,
        earnings: 0,
        rating: 0,
        reviews: 0
    });

    const isCustomer = selectedRole === 'homeowner';

    useEffect(() => {
        async function loadStats() {
            if (!user?.uid) return;
            const storage = await import('../storage');

            if (isCustomer) {
                const [bookings, houses] = await Promise.all([
                    storage.getUserBookings(user.uid),
                    storage.getUserHouses(user.uid)
                ]);
                setStats({
                    bookings: bookings?.length || 0,
                    houses: houses?.length || 0
                });
            } else {
                const cleaner = await storage.getCleanerByUserId(user.uid);
                if (cleaner) {
                    const [earnings, reviewsData] = await Promise.all([
                        storage.getCleanerEarnings(cleaner.id, 'all'),
                        storage.getCleanerReviewsWithStats(cleaner.id)
                    ]);

                    const calculatedRating = reviewsData.reviews && reviewsData.reviews.length > 0
                        ? Math.round((reviewsData.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsData.reviews.length) * 10) / 10
                        : 0;

                    setStats({
                        earnings: earnings?.earnings || 0,
                        rating: reviewsData.stats?.averageRating || calculatedRating || cleaner.rating || 0,
                        reviews: reviewsData.stats?.totalReviews || reviewsData.reviews?.length || 0
                    });
                }
            }
        }
        loadStats();
    }, [user, selectedRole, isCustomer]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Black Profile Header */}
            <div className="bg-black text-white px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-xl relative z-10 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold">Account</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={onLogout}
                            className="bg-secondary-600 hover:bg-secondary-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors flex items-center"
                        >
                            Sign Out
                        </button>
                        <button onClick={onEditProfile} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                            <Settings className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-800 overflow-hidden bg-gray-800 flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-500" />
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shadow-lg
                                ${isCustomer ? 'bg-primary-500' : 'bg-secondary-500'}`}>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-white text-2xl leading-tight">{user?.name || 'User'}</h2>
                        <p className="text-gray-400 text-sm mb-3">{user?.email}</p>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm
                                    ${isCustomer
                                    ? 'bg-gray-800 text-gray-300 border border-gray-700'
                                    : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                {isCustomer ? 'Home Owner' : 'Professional Clean'}
                            </span>
                            {(!isCustomer || user?.role === 'both') && (
                                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-6">

                {/* Role-specific Statistics */}
                <div className="grid grid-cols-3 gap-3">
                    {isCustomer ? (
                        <>
                            <button onClick={onViewBookings} className="card p-4 text-center bg-black text-white border border-gray-800 shadow-lg shadow-black/10 hover:bg-gray-900 transition-colors">
                                <p className="text-xl font-black">{stats.bookings}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Bookings</p>
                            </button>
                            <button onClick={onViewHouses} className="card p-4 text-center bg-black text-white border border-gray-800 shadow-lg shadow-black/10 hover:bg-gray-900 transition-colors">
                                <p className="text-xl font-black">{stats.houses}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Houses</p>
                            </button>
                            <div className="card p-4 text-center bg-black text-white border border-gray-800 shadow-lg shadow-black/10">
                                <p className="text-xl font-black">{new Date(user?.createdAt || user?.metadata?.creationTime || Date.now()).getFullYear()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Member Since</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={onViewRatings} className="card p-4 text-center bg-black text-white border border-gray-800 hover:bg-gray-900 transition-colors shadow-lg shadow-black/10">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Star className="w-4 h-4 text-white fill-white" />
                                    <p className="text-2xl font-black">{stats.rating.toFixed(1)}</p>
                                </div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Rating</p>
                            </button>
                            <button onClick={onViewEarnings} className="card p-4 text-center bg-black text-white border border-gray-800 hover:bg-gray-900 transition-colors shadow-lg shadow-black/10">
                                <p className="text-2xl font-black mb-1">${stats.earnings.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Earned in {new Date().getFullYear()}</p>
                            </button>
                            <button onClick={onViewRatings} className="card p-4 text-center bg-black text-white border border-gray-800 hover:bg-gray-900 transition-colors shadow-lg shadow-black/10">
                                <p className="text-2xl font-black mb-1">{stats.reviews}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Reviews</p>
                            </button>
                        </>
                    )}
                </div>

                {/* Settings Sections */}
                <div className="space-y-4">
                    <h3 className="px-1 text-xs font-bold text-gray-400 uppercase tracking-widest">General Settings</h3>
                    <div className="card p-0 overflow-hidden divide-y divide-gray-50 shadow-sm border-gray-100">
                        <button onClick={onEditProfile} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">Personal Information</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        <button onClick={onNotifications} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Bell className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">Notification Preferences</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        <button onClick={onMessaging} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">Internal Messaging</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        {!isCustomer && (
                            <button onClick={onBankInfo} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Building className="w-5 h-5 text-gray-900" />
                                </div>
                                <span className="flex-1 font-medium text-gray-700">Bank Information</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>
                        )}

                        <button onClick={onPaymentMethods} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">{isCustomer ? 'Payment Methods' : 'Payout Settings'}</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>

                    <h3 className="px-1 text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Account & Safety</h3>
                    <div className="card p-0 overflow-hidden divide-y divide-gray-50 shadow-sm border-gray-100">
                        <button onClick={onTermsPrivacy} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">Privacy & Security</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        <button onClick={onHelpCenter} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="flex-1 font-medium text-gray-700">Support Center</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        {/* Role switcher */}
                        {user?.role === 'both' && (
                            <button
                                onClick={() => setRole(isCustomer ? 'cleaner' : 'homeowner')}
                                className={`w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors`}
                            >
                                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="flex-1 font-medium text-gray-700">Switch to {isCustomer ? 'Cleaner View' : 'Home Owner View'}</span>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Promo / Referral card */}
                <div className={`card p-6 border-0 shadow-lg relative overflow-hidden group
                    ${isCustomer ? 'bg-gradient-to-br from-primary-600 to-primary-700' : 'bg-gradient-to-br from-secondary-600 to-secondary-700'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                        <Share2 className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 w-2/3">
                        <h4 className="text-white font-bold text-lg mb-1">Spread the Word</h4>
                        <p className="text-white/80 text-sm mb-4">Refer a friend and both get $20 Swish credit.</p>
                        <button className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 scale-100 hover:scale-105 transition-transform active:scale-95">
                            Invite Friends
                        </button>
                    </div>
                </div>

                {/* Become a cleaner if just customer */}
                {isCustomer && user?.role !== 'both' && !user?.cleanerStatus && (
                    <button
                        onClick={onBecomeCleanerClick}
                        className="w-full card p-6 border-dashed border-2 border-secondary-200 bg-secondary-50/50 flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary-500 shadow-sm group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <span className="text-secondary-700 font-bold block leading-tight">Become a Cleaner</span>
                            <span className="text-xs text-secondary-500">Earn up to $1,200/week on your own schedule</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-secondary-300" />
                    </button>
                )}

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full py-4 px-6 rounded-2xl bg-white border border-red-100 text-red-500 font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out and Switch Accounts
                </button>

                <div className="flex flex-col items-center pt-2 pb-8">
                    <p className="text-xs text-gray-300 font-medium">GoSwish Premium v1.2.0 • Build 2026.01</p>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1 opacity-50">Powered by Trivine</p>
                    <div className="flex gap-4 mt-2">
                        <button className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors line-through decoration-primary-500/50">Privacy</button>
                        <button className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Terms</button>
                        <button className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Trust</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BecomeCleanerScreen({ onBack, onSubmit }) {
    const { user, updateUser } = useApp();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipcode: ''
    });

    const handleSubmit = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        updateUser({
            uid: user.uid,
            role: 'both',
            cleanerStatus: 'pending',
            location: address
        });

        setLoading(false);
        setStep(3);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {step < 3 && (
                <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                    <div className="flex items-center justify-between">
                        <button onClick={onBack} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors">
                            <ChevronRight className="w-6 h-6 rotate-180 text-white" />
                        </button>
                        <h1 className="text-lg font-bold">Become a Cleaner</h1>
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
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                            <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Step 2 of 2</span>
                        </div>

                        <div className="card space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                <input
                                    type="text"
                                    value={address.street}
                                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                    className="input-field"
                                    placeholder="123 Main St"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="input-field"
                                        placeholder="Dallas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="input-field"
                                        placeholder="TX"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                <input
                                    type="text"
                                    value={address.zipcode}
                                    onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                                    className="input-field"
                                    placeholder="75201"
                                />
                            </div>
                        </div>

                        <div className="card bg-gray-50 border border-gray-100">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Note</p>
                            <p className="text-xs text-gray-600 italic">
                                For this demo, we'll skip the bank verification and background check steps.
                            </p>
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
                        disabled={loading || (step === 2 && (!address.street || !address.city || !address.state || !address.zipcode))}
                        className="btn btn-secondary w-full py-4 shadow-lg shadow-secondary-500/20"
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
