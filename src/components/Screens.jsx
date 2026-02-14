import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * SCREEN COMPONENTS - MAIN DASHBOARD ROUTING
 * ============================================================================
 * 
 * This file serves as the main "Router" for the inner-app experience.
 * It contains:
 * 1. BottomNavigation: The persistent tab bar.
 * 2. CustomerHome: The dashboard for Homeowners.
 * 3. CleanerHome: The dashboard for Cleaners.
 * 
 * DESIGN PATTERN:
 * Instead of using a heavy routing library for every sub-view, we use conditional 
 * rendering based on 'activeTab' or 'role'. This keeps the app fast and mobile-like.
 * 
 * COMPONENTS:
 * - CustomerHome: Manages properties, active bookings, and notifications.
 * - CleanerHome: Manages active jobs, earnings overview, and schedule.
 */

import {
    Home, MapPin, Calendar, User, Sparkles, Plus,
    ChevronRight, Bell, Clock, CheckCircle2, Star,
    TrendingUp, Wallet, Search, MessageSquare, Settings,
    ShieldCheck, Share2, LogOut, Heart, HelpCircle, Building,
    Navigation, Lock, Check, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import OTPInput from './OTPInput';
import { formatBookingId } from '../utils/formatters';
import {
    parseLocalDate,
    toLocalDateString,
    getTodayString,
    formatHourTo12,
    formatDisplayDate,
    extractHours
} from '../utils/dateUtils';

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

/**
 * ============================================================================
 * CUSTOMER HOME SCREEN (Homeowner Dashboard)
 * ============================================================================
 * 
 * Purpose:
 * This is the landing page for Homeowners. It aggregates the most critical info:
 * 1. "Today's Cleaning": The most immediate active booking.
 * 2. "Recent Bookings": History/Status of other requests.
 * 3. Quick Actions: Add House, New Booking.
 * 
 * Data Flow:
 * - On mount, it fetches: Houses, Bookings, Notifications.
 * - It specifically filters for 'Today's Booking' to show the progress card 
 *   (e.g., "Cleaner is on the way").
 * 
 * @param {Function} onNewBooking - Callback to start booking flow
 * @param {Function} onViewHouses - Nav to House Management
 * @param {Function} onViewBookings - Nav to Booking History
 */
export function CustomerHome({ onNewBooking, onViewHouses, onViewBookings, onViewBooking, onNotifications, navigateTo }) {
    const { user, getUserHouses, getUserBookings, serviceTypes } = useApp();

    const [houses, setHouses] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [todayBookings, setTodayBookings] = useState([]);
    const [inputCodes, setInputCodes] = useState({});
    const [verifyingIds, setVerifyingIds] = useState({});

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

                    // Find all of today's bookings using centralized date utilities
                    const today = getTodayString();

                    const todaysBookingsList = (bookingsData || []).filter(b => {
                        // Use centralized toLocalDateString for consistent timezone-safe handling
                        let cleaningDate = null;

                        if (b.scheduledDate) {
                            cleaningDate = toLocalDateString(b.scheduledDate);
                        } else if (b.selectedDate) {
                            cleaningDate = toLocalDateString(b.selectedDate);
                        } else if (b.dates && b.dates.length > 0) {
                            cleaningDate = b.dates.map(d => toLocalDateString(d)).find(d => d === today);
                        } else if (b.date) {
                            cleaningDate = toLocalDateString(b.date);
                        }

                        const isTodayBooking = cleaningDate === today;

                        // Show all today's active bookings (not cancelled/completed)
                        const activeStatuses = ['booking-placed', 'confirmed', 'matched', 'scheduled', 'assigned', 'accepted', 'on_the_way', 'arrived', 'pending_verification', 'in_progress', 'cleaning_complete'];
                        const statusMatch = activeStatuses.includes(b.status);

                        return isTodayBooking && statusMatch;
                    });

                    // Enrich with cleaner names
                    const { getDoc, COLLECTIONS } = await import('../storage');
                    const enrichedBookings = await Promise.all(
                        todaysBookingsList.map(async (booking) => {
                            if (booking.cleanerId) {
                                try {
                                    const cleaner = await getDoc(COLLECTIONS.CLEANERS, booking.cleanerId);
                                    return { ...booking, cleanerName: cleaner?.name || null };
                                } catch (e) {
                                    return booking;
                                }
                            }
                            return booking;
                        })
                    );
                    setTodayBookings(enrichedBookings);
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

    // Poll for today's bookings updates (every 3 seconds)
    useEffect(() => {
        if (todayBookings.length === 0) return;

        const interval = setInterval(async () => {
            try {
                const { getBookingWithTracking } = await import('../storage');
                const updatedBookings = await Promise.all(
                    todayBookings.map(b => getBookingWithTracking(b.id))
                );
                const validUpdates = updatedBookings.filter(Boolean);
                if (validUpdates.length > 0) {
                    setTodayBookings(prev =>
                        prev.map(booking => {
                            const updated = validUpdates.find(u => u.id === booking.id);
                            // Preserve cleanerName from previous state when merging updates
                            return updated ? { ...updated, cleanerName: booking.cleanerName } : booking;
                        })
                    );
                }
            } catch (error) {
                console.error('Error polling bookings:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [todayBookings.map(b => b.id).join(',')]);

    // Handle verification for a specific booking
    const handleVerifyCode = async (bookingId) => {
        const code = inputCodes[bookingId] || '';
        if (!bookingId || code.length !== 6) return;

        setVerifyingIds(prev => ({ ...prev, [bookingId]: true }));
        try {
            const { verifyJobCode, checkVerificationAndStart } = await import('../storage');
            const success = await verifyJobCode(bookingId, 'homeowner', code);
            if (success) {
                const started = await checkVerificationAndStart(bookingId);
                if (started) {
                    // Refresh booking
                    const { getBookingWithTracking } = await import('../storage');
                    const updated = await getBookingWithTracking(bookingId);
                    if (updated) {
                        setTodayBookings(prev =>
                            prev.map(b => b.id === bookingId ? { ...updated, cleanerName: b.cleanerName } : b)
                        );
                    }
                }
            } else {
                alert("Incorrect code. Please ask your cleaner for their 6-digit code.");
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert("Verification failed. Please try again.");
        } finally {
            setVerifyingIds(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // Handle completing the job (approval)
    const handleCompleteBooking = async (bookingId) => {

        try {
            const { approveJob, getBookingWithTracking } = await import('../storage');
            // For now, simple approval without detailed rating
            await approveJob(bookingId, { rating: 5, comment: 'Completed via homeowner dashboard' });

            // Refresh booking
            const updated = await getBookingWithTracking(bookingId);
            if (updated) {
                setTodayBookings(prev =>
                    prev.map(b => b.id === bookingId ? { ...updated, cleanerName: b.cleanerName } : b)
                );
            }
        } catch (error) {
            console.error('Error completing booking:', error);
            alert("Failed to complete booking. Please try again.");
        }
    };

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

                {/* Today's Cleaning Section */}
                {todayBookings.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 opacity-70">
                            Today's Cleaning{todayBookings.length > 1 ? 's' : ''}
                        </h3>
                        <div className="space-y-3">
                            {todayBookings.map((todayBooking) => (
                                <div key={todayBooking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex gap-4 w-full">
                                            {/* Left: Time Sidebar */}
                                            <div className="flex flex-col items-center justify-start py-1 w-12 flex-shrink-0">
                                                {todayBooking.dates?.[0] && todayBooking.timeSlots?.[todayBooking.dates[0]]?.[0] ? (
                                                    <>
                                                        <p className="text-[13px] font-black text-gray-900 border-b-2 border-teal-500 pb-0.5 mb-1 leading-none">
                                                            {todayBooking.timeSlots[todayBooking.dates[0]][0] === 'morning' ? '9 AM' :
                                                                todayBooking.timeSlots[todayBooking.dates[0]][0] === 'afternoon' ? '12 PM' : '3 PM'}
                                                        </p>
                                                        <div className="h-8 w-0.5 bg-gray-100"></div>
                                                        <p className="text-[13px] font-black text-gray-400 mt-1 leading-none">
                                                            {todayBooking.timeSlots[todayBooking.dates[0]][0] === 'morning' ? '12 PM' :
                                                                todayBooking.timeSlots[todayBooking.dates[0]][0] === 'afternoon' ? '3 PM' : '6 PM'}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <Clock className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>

                                            {/* Right: Main Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header: Service Type + Price */}
                                                <div className="flex items-baseline mb-2">
                                                    <h4 className="font-extrabold text-gray-900 text-lg capitalize truncate">
                                                        {(() => {
                                                            const type = (todayBooking.serviceTypeId || todayBooking.serviceType || 'regular').toLowerCase();
                                                            if (type.includes('regular')) return 'Regular Cleaning';
                                                            if (type.includes('deep')) return 'Deep Cleaning';
                                                            return type.replace('-', ' ');
                                                        })()}
                                                    </h4>
                                                    <div className="flex-1 mx-4 border-b border-gray-50 border-dashed self-center mb-1"></div>
                                                    <span className="text-base font-bold text-teal-600 whitespace-nowrap">
                                                        ${(todayBooking.totalAmount || 0).toFixed(2)}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                                                </div>

                                                {/* Full Address */}
                                                {todayBooking.houseId && (
                                                    <div className="mb-4">
                                                        <p className="text-gray-500 text-xs leading-snug">
                                                            {(() => {
                                                                const house = houses.find(h => h.id === todayBooking.houseId);
                                                                if (!house?.address) return 'Address';
                                                                const { street, city, state, zip, zipcode } = house.address;
                                                                const parts = [street, city].filter(Boolean);
                                                                let addr = parts.join(', ');
                                                                if (state) addr += `, ${state}`;
                                                                if (zip || zipcode) addr += ` ${zip || zipcode}`;
                                                                return addr;
                                                            })()}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Status and Verification Row */}
                                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                                    {/* Status Badge */}
                                                    {todayBooking.status === 'on_the_way' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                                                            <Navigation className="w-3.5 h-3.5 animate-pulse" />
                                                            On The Way
                                                            {todayBooking.tracking?.eta > 0 && ` (${todayBooking.tracking.eta} min)`}
                                                        </div>
                                                    )}
                                                    {todayBooking.status === 'arrived' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-green-100">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            Arrived
                                                        </div>
                                                    )}
                                                    {todayBooking.status === 'in_progress' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-teal-100">
                                                            <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                                                            In Progress
                                                        </div>
                                                    )}
                                                    {(todayBooking.status === 'approved' || todayBooking.status === 'completed') && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-green-100 text-green-800 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-green-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Job Completed
                                                        </div>
                                                    )}
                                                    {['confirmed', 'matched', 'scheduled'].includes(todayBooking.status) && todayBooking.cleanerReconfirmed && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-teal-100">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Cleaner Confirmed
                                                        </div>
                                                    )}
                                                    {['confirmed', 'matched', 'scheduled'].includes(todayBooking.status) && !todayBooking.cleanerReconfirmed && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-gray-100">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Scheduled
                                                        </div>
                                                    )}

                                                    {/* Verification Code Display */}
                                                    {todayBooking.verificationCodes?.customerCode && (
                                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl whitespace-nowrap shadow-lg flex-shrink-0 border border-gray-800 ml-auto">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</span>
                                                            <div className="h-6 w-[1px] bg-gray-700 mx-1"></div>
                                                            <span className="text-xl font-mono font-black tracking-[0.2em] text-teal-400">
                                                                {todayBooking.verificationCodes.customerCode}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Input - Shows when codes are available and not yet verified */}
                                        {todayBooking.verificationCodes?.customerCode && !todayBooking.verificationCodes?.customerVerified && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateTo('customer-messaging', { bookingId: todayBooking.id });
                                                        }}
                                                        className="w-11 h-11 bg-teal-50 hover:bg-teal-100 rounded-xl flex items-center justify-center transition-colors border border-teal-100 flex-shrink-0 self-end"
                                                        title="Message Cleaner"
                                                    >
                                                        <MessageSquare className="w-5 h-5 text-teal-600" />
                                                    </button>
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <p className="text-xs font-bold text-gray-700 uppercase">Enter {todayBooking.cleanerName ? `${todayBooking.cleanerName}'s` : "Cleaner's"} Code</p>
                                                        <OTPInput
                                                            length={6}
                                                            value={inputCodes[todayBooking.id] || ''}
                                                            onChange={(val) => setInputCodes(prev => ({ ...prev, [todayBooking.id]: val }))}
                                                            disabled={verifyingIds[todayBooking.id]}
                                                        />
                                                        <button
                                                            onClick={() => handleVerifyCode(todayBooking.id)}
                                                            disabled={(inputCodes[todayBooking.id] || '').length !== 6 || verifyingIds[todayBooking.id]}
                                                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${(inputCodes[todayBooking.id] || '').length !== 6 || verifyingIds[todayBooking.id]
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95 shadow-md'
                                                                }`}
                                                        >
                                                            {verifyingIds[todayBooking.id] ? 'Verifying...' : 'Verify Cleaner'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verified Status */}
                                        {todayBooking.verificationCodes?.customerVerified && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="bg-green-50 text-green-700 p-3 rounded-xl flex items-center justify-between border border-green-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                        <span className="font-bold text-xs uppercase tracking-wider">
                                                            {['approved', 'completed'].includes(todayBooking.status)
                                                                ? 'Cleaning Successfully Completed'
                                                                : todayBooking.verificationCodes?.cleanerVerified
                                                                    ? 'Verified! Cleaning Started'
                                                                    : 'Verified. Waiting for Cleaner...'}
                                                        </span>
                                                    </div>
                                                    {todayBooking.verificationCodes?.cleanerVerified && todayBooking.status !== 'approved' && todayBooking.status !== 'completed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCompleteBooking(todayBooking.id);
                                                            }}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                                                        >
                                                            Mark Job as Done
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                    onClick={() => navigateTo?.('booking', { houseId: house.id })}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 py-3 px-4 flex items-center justify-between cursor-pointer hover:border-teal-500/30 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Home className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{house.name || house.nickname}</h3>
                                            <p className="text-gray-500 text-[9px] font-medium leading-tight">
                                                {house.address?.street}, {house.address?.city}, {house.address?.state} {house.address?.zip || house.address?.zipcode}
                                            </p>
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
                                // Look up service type - check both serviceTypeId and serviceType fields
                                const service = serviceTypes.find(s => s.id === (booking.serviceTypeId || booking.serviceType));
                                // Look up house for address
                                const house = houses.find(h => h.id === booking.houseId);
                                const address = house?.address?.street || house?.name || 'Address not set';

                                return (
                                    <button
                                        key={booking.id}
                                        onClick={() => onViewBooking?.(booking)}
                                        className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md hover:border-primary-200 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold text-gray-900">{service?.name || 'Cleaning'}</h3>
                                                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    {address}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-gray-400 font-mono">{formatBookingId(booking.bookingId)}</span>
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                                        booking.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {booking.status?.replace(/-/g, ' ') || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2 flex-shrink-0">
                                            <p className="font-bold text-gray-900">${(booking.pricing?.total || booking.totalAmount || 0).toFixed(2)}</p>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </button>
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
                                    <span className="font-mono text-sm text-gray-400">{formatBookingId(booking.bookingId)}</span>
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

/**
 * ============================================================================
 * CLEANER HOME SCREEN (Provider Dashboard)
 * ============================================================================
 * 
 * Purpose:
 * The command center for Cleaners. It focuses on:
 * 1. Revenue: "This Week Earnings" (Motivation).
 * 2. Active Job: The immediate task at hand (Start Trip, Check In).
 * 3. Schedule: Upcoming jobs.
 * 
 * Key Features:
 * - "Slide to Start": Safety mechanism to prevent accidental status changes.
 * - Live Earnings: Real-time calculation of net income.
 * - Job Lifecycle management (Accept -> On Way -> Arrived -> Complete).
 * 
 * @param {Function} onViewEarnings - Nav to detailed earnings
 * @param {Function} onViewJobs - Nav to available job offers
 */
export function CleanerHome({ onNotifications, onMessaging, onRatings, onViewJobs, onViewHistory, onViewEarnings, onViewUpcoming, onViewJob }) {
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

    // Note: Using centralized getTodayString and toLocalDateString from dateUtils

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

                // Calculate stats using centralized date utilities
                const today = getTodayString(); // YYYY-MM-DD local

                const todayJobs = allJobs.filter(job => {
                    const dateVal = job.scheduledDate || job.createdAt;
                    if (!dateVal) return false;

                    // Use centralized toLocalDateString for consistent timezone handling
                    const jobDateStr = toLocalDateString(dateVal);

                    // Show if it's today
                    if (jobDateStr === today) return true;

                    // Show if it's IN THE PAST but still active (Overdue)
                    // This handles cases where a cleaner forgot to start/complete a job yesterday
                    if (jobDateStr < today && (job.status === 'scheduled' || job.status === 'confirmed' || job.status === 'in_progress' || job.status === 'arrived')) {
                        return true;
                    }

                    return false;
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

                // Apply eligibility filter (same as JobOffers) - Optimized with Promise.all
                const matchScores = await Promise.all(
                    validAvailableBookings.map(booking =>
                        storage.calculateMatchScore(booking, cleanerProfile).catch(() => ({ isEligible: false }))
                    )
                );
                const availableJobsCount = matchScores.filter(m => m.isEligible).length;

                const upcomingJobs = allJobs.filter(job => {
                    const dateVal = job.scheduledDate || job.startTime;
                    if (!dateVal) return false;

                    // Use centralized toLocalDateString for consistent timezone handling
                    const jobDateStr = toLocalDateString(dateVal);
                    return jobDateStr > today && (job.status === 'scheduled' || job.status === 'confirmed');
                }).sort((a, b) => {
                    const dateA = toLocalDateString(a.scheduledDate || a.startTime) || '';
                    const dateB = toLocalDateString(b.scheduledDate || b.startTime) || '';
                    return dateA.localeCompare(dateB);
                });

                // Format job for display using centralized date utilities
                const formatJobForSchedule = (job) => {
                    const dateVal = job.scheduledDate || job.startTime || job.createdAt || new Date().toISOString();
                    const validDate = parseLocalDate(dateVal);

                    // Get hours from startTime or the date object using centralized utility
                    let hours = extractHours(job.startTime) || validDate.getHours() || 9;

                    // If we still have NaN, fallback to 9
                    if (isNaN(hours)) hours = 9;

                    const duration = Number(job.duration) || 3;
                    const endHours = hours + duration;

                    // Format date for upcoming jobs using centralized utility
                    const dateStr = formatDisplayDate(dateVal);

                    return {
                        id: job.id,
                        bookingId: job.bookingId,
                        customerId: job.customerId,
                        date: dateStr,
                        timeRange: `${formatHourTo12(hours)} - ${formatHourTo12(endHours)}`,
                        serviceType: job.serviceType || 'Cleaning',
                        address: job.address || 'Address pending',
                        earnings: (() => {
                            // Use job.earnings directly - this is the 90% of subtotal calculated at job creation
                            const earnings = Number(job.earnings || 0);
                            if (earnings > 0) {
                                return earnings.toFixed(2);
                            }
                            // Fallback: estimate from amount (total including tax)
                            const amount = Number(job.amount || 0);
                            // Remove ~8.25% tax then take 90%
                            const estimatedSubtotal = amount / 1.0825;
                            const estimatedEarnings = estimatedSubtotal * 0.9;
                            return estimatedEarnings > 0 ? estimatedEarnings.toFixed(2) : '50.00';
                        })(),
                        status: job.status,
                        verificationCodes: job.verificationCodes || null,
                        rawDate: toLocalDateString(dateVal)  // Use centralized utility for local timezone
                    };
                };

                const todaySchedule = await Promise.all(todayJobs.map(async job => {
                    const formatted = formatJobForSchedule(job);
                    try {
                        const booking = await storage.getBookingById(job.bookingId);
                        const houseId = job.houseId || booking?.houseId;
                        const house = houseId ? await storage.getHouseById(houseId) : null;

                        // Fetch customer name
                        const customerId = job.customerId || booking?.customerId;
                        let customerName = null;
                        if (customerId) {
                            const customer = await storage.getUserById(customerId);
                            customerName = customer?.name || customer?.firstName || null;
                        }

                        let fullAddress = formatted.address;
                        if (house?.address) {
                            const { street, city, state, zip, zipcode } = house.address;
                            const addrParts = [street, city].filter(Boolean);
                            let addrStr = addrParts.join(', ');
                            if (state) addrStr += `, ${state}`;
                            if (zip || zipcode) addrStr += ` ${zip || zipcode}`;
                            fullAddress = addrStr;
                        }

                        // Use the earnings stored in the job record (set at acceptance time)
                        // This is the single source of truth for cleaner's net earnings

                        return {
                            ...formatted,
                            address: fullAddress,
                            customerName,
                            // Keep the earnings from formatJobForSchedule - already correctly calculated
                            cleanerReconfirmed: booking?.cleanerReconfirmed || false,
                            trackingStatus: booking?.tracking?.status || 'idle',
                            verificationCodes: booking?.verificationCodes || null
                        };
                    } catch (e) {
                        return formatted;
                    }
                }));

                const upcomingSchedule = await Promise.all(upcomingJobs.slice(0, 5).map(async job => {
                    const formatted = formatJobForSchedule(job);
                    try {
                        const booking = await storage.getBookingById(job.bookingId);
                        const houseId = job.houseId || booking?.houseId;
                        const house = houseId ? await storage.getHouseById(houseId) : null;

                        if (house?.address) {
                            const { street, city, state, zip, zipcode } = house.address;
                            const addrParts = [street, city].filter(Boolean);
                            let addrStr = addrParts.join(', ');
                            if (state) addrStr += `, ${state}`;
                            if (zip || zipcode) addrStr += ` ${zip || zipcode}`;
                            formatted.address = addrStr;
                        }

                        // Earnings already calculated in formatJobForSchedule from job.earnings
                        // No need to override - job.earnings is the source of truth
                    } catch (e) { }
                    return formatted;
                })); // Show next 5 upcoming jobs

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
    }, [user?.uid]); // Dependency array for useEffect

    // Poll for dashboard updates (Available Jobs & Today's Schedule)
    useEffect(() => {
        if (!user?.uid) return;

        const interval = setInterval(async () => {
            try {
                const storage = await import('../storage');

                // 1. Fetch available jobs count
                const cleanerProfile = await storage.getCleanerByUserId(user.uid);
                if (cleanerProfile) {
                    const availableBookings = await storage.getAvailableBookings();
                    const dismissed = JSON.parse(localStorage.getItem(`dismissed_jobs_${user.uid}`) || '[]');
                    const validAvailable = availableBookings.filter(b => !dismissed.includes(b.id));

                    const matchScores = await Promise.all(
                        validAvailable.map(booking =>
                            storage.calculateMatchScore(booking, cleanerProfile).catch(() => ({ isEligible: false }))
                        )
                    );
                    const newCount = matchScores.filter(m => m.isEligible).length;

                    // 2. Poll today's schedule if needed
                    let updatedSchedule = dashboardData.todaySchedule;
                    if (dashboardData.todaySchedule.length > 0) {
                        updatedSchedule = await Promise.all(
                            dashboardData.todaySchedule.map(async (job) => {
                                try {
                                    const updatedBooking = await storage.getBookingWithTracking(job.bookingId);
                                    if (updatedBooking) {
                                        return {
                                            ...job,
                                            verificationCodes: updatedBooking.verificationCodes,
                                            cleanerReconfirmed: updatedBooking.cleanerReconfirmed,
                                            trackingStatus: updatedBooking.tracking?.status || job.trackingStatus,
                                            status: updatedBooking.status
                                        };
                                    }
                                    return job;
                                } catch (err) {
                                    return job;
                                }
                            })
                        );
                    }

                    setDashboardData(prev => ({
                        ...prev,
                        availableJobsCount: newCount,
                        todaySchedule: updatedSchedule
                    }));
                }
            } catch (error) {
                console.error('Error polling dashboard data:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user?.uid, dashboardData.todaySchedule.length, dashboardData.availableJobsCount]);

    const [confirming, setConfirming] = useState({}); // {jobId: boolean}
    const [startingTrip, setStartingTrip] = useState({}); // {jobId: boolean}
    const [cleanerVerificationInput, setCleanerVerificationInput] = useState({}); // {jobId: code}
    const [verifyingCleaner, setVerifyingCleaner] = useState({}); // {jobId: boolean}

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

                {/* Earnings + Available Jobs Row */}
                <div className="flex items-center gap-3">
                    {/* Earnings Display */}
                    <button onClick={onViewEarnings} className="flex-1 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/20 transition-colors">
                        <div className="text-left">
                            <p className="text-xl font-bold text-white leading-tight">${earnings}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Earned this week</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>

                    {/* Available Jobs Button */}
                    <button
                        onClick={onViewJobs}
                        className={`bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-sm py-3 px-12 rounded-xl shadow-lg shadow-secondary-900/30 flex items-center justify-center transition-transform active:scale-[0.98] whitespace-nowrap ${availableJobsCount > 0 ? 'animate-pulse' : ''}`}
                    >
                        Available Jobs {availableJobsCount > 0 ? `(${availableJobsCount})` : ''}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-4 mt-3 relative z-30 hidden">
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
                <div className="hidden">
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
                                    onClick={() => onViewJob?.({
                                        ...job,
                                        displayEarnings: job.earnings,
                                        formattedDate: job.date,
                                        startTime: job.timeRange?.split(' - ')[0],
                                        endTime: job.timeRange?.split(' - ')[1]
                                    })}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex gap-4 w-full">
                                            {/* Left: Time Sidebar */}
                                            <div className="flex flex-col items-center justify-start py-1 w-12 flex-shrink-0">
                                                <p className="text-[13px] font-black text-gray-900 border-b-2 border-teal-500 pb-0.5 mb-1 leading-none">{job.timeRange.split(' - ')[0].replace(':00', '')}</p>
                                                <div className="h-8 w-0.5 bg-gray-100"></div>
                                                <p className="text-[13px] font-black text-gray-400 mt-1 leading-none">{job.timeRange.split(' - ')[1].replace(':00', '')}</p>
                                            </div>

                                            {/* Right: Main Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header: Service Type + Price */}
                                                <div className="flex items-baseline mb-2">
                                                    <h4 className="font-extrabold text-gray-900 text-lg capitalize truncate">
                                                        {(() => {
                                                            const type = (job.serviceType || 'regular').toLowerCase();
                                                            if (type.includes('regular')) return 'Regular Cleaning';
                                                            if (type.includes('deep')) return 'Deep Cleaning';
                                                            return type.replace('-', ' ');
                                                        })()}
                                                    </h4>
                                                    <div className="flex-1 mx-4 border-b border-gray-50 border-dashed self-center mb-1"></div>
                                                    <span className="text-base font-bold text-teal-600 whitespace-nowrap">${job.earnings}</span>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                                                </div>

                                                {/* Address and Map Button Row */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <p className="text-gray-500 text-xs min-w-0 flex-1 leading-snug">{job.address}</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
                                                            window.open(mapUrl, '_blank');
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-secondary-50 text-secondary-700 rounded-lg text-[10px] font-extrabold border border-secondary-100 flex-shrink-0 hover:bg-secondary-100 transition-colors uppercase tracking-wider shadow-sm"
                                                    >
                                                        <MapPin className="w-3.5 h-3.5" /> Map
                                                    </button>
                                                </div>

                                                {/* Action Row: Buttons + Code */}
                                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                                    {!['approved', 'completed'].includes(job.status) && (
                                                        <>
                                                            <button
                                                                disabled={job.rawDate !== getTodayString() || confirming[job.id] || job.cleanerReconfirmed || job.status === 'in_progress'}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setConfirming(prev => ({ ...prev, [job.id]: true }));
                                                                    try {
                                                                        const storage = await import('../storage');
                                                                        await storage.generateVerificationCodes(job.bookingId);
                                                                        await storage.updateBooking(job.bookingId, { cleanerReconfirmed: true });
                                                                        await storage.createNotification(job.customerId, {
                                                                            type: 'cleaner_reconfirmed',
                                                                            title: 'Cleaner Confirmed',
                                                                            message: `${user.name} has re-confirmed and received their verification code for today.`,
                                                                            relatedId: job.bookingId
                                                                        });
                                                                        const updatedBooking = await storage.getBookingWithTracking(job.bookingId);
                                                                        if (updatedBooking) {
                                                                            setDashboardData(prev => ({
                                                                                ...prev,
                                                                                todaySchedule: prev.todaySchedule.map(j =>
                                                                                    j.bookingId === job.bookingId ? {
                                                                                        ...j,
                                                                                        cleanerReconfirmed: updatedBooking.cleanerReconfirmed,
                                                                                        verificationCodes: updatedBooking.verificationCodes
                                                                                    } : j
                                                                                )
                                                                            }));
                                                                        }
                                                                        setConfirming(prev => ({ ...prev, [job.id]: 'done' }));
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        setConfirming(prev => ({ ...prev, [job.id]: false }));
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-tighter shadow-md translate-y-0 active:translate-y-0.5 ${job.rawDate !== getTodayString() || confirming[job.id] || job.cleanerReconfirmed || job.status === 'in_progress'
                                                                    ? 'bg-gray-50 text-gray-400 border border-gray-100 shadow-none opacity-50'
                                                                    : `bg-teal-600 text-white hover:bg-teal-700 active:scale-95 ${!job.cleanerReconfirmed ? 'animate-pulse' : ''}`
                                                                    }`}
                                                            >
                                                                {(confirming[job.id] === 'done' || job.cleanerReconfirmed) ? <><CheckCircle2 className="w-3.5 h-3.5" /> Confirmed</> : confirming[job.id] === true ? 'Confirming...' : 'Confirm & Get Code'}
                                                            </button>

                                                            {/* Hidden Start Trip button for now */}
                                                        </>
                                                    )}

                                                    {/* 6-Digit Code - Aligned Right */}
                                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl whitespace-nowrap shadow-lg flex-shrink-0 border border-gray-800 ml-auto">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</span>
                                                        <div className="h-6 w-[1px] bg-gray-700 mx-1"></div>
                                                        <span className="text-xl font-mono font-black tracking-[0.2em] text-teal-400">
                                                            {job.verificationCodes?.cleanerCode || '------'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Input Section */}
                                        {job.verificationCodes && !job.verificationCodes?.cleanerVerified && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onMessaging({ bookingId: job.bookingId });
                                                        }}
                                                        className="w-11 h-11 bg-teal-50 hover:bg-teal-100 rounded-xl flex items-center justify-center transition-colors border border-teal-100 flex-shrink-0 self-end"
                                                        title="Message Homeowner"
                                                    >
                                                        <MessageSquare className="w-5 h-5 text-teal-600" />
                                                    </button>
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <p className="text-xs font-bold text-gray-700 uppercase">Enter {job.customerName ? `${job.customerName}'s` : "Homeowner's"} Code</p>
                                                        <OTPInput
                                                            length={6}
                                                            value={cleanerVerificationInput[job.id] || ''}
                                                            onChange={(code) => setCleanerVerificationInput(prev => ({ ...prev, [job.id]: code }))}
                                                            disabled={verifyingCleaner[job.id]}
                                                        />
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const inputCode = cleanerVerificationInput[job.id];
                                                                if (inputCode?.length !== 6) return;

                                                                setVerifyingCleaner(prev => ({ ...prev, [job.id]: true }));
                                                                try {
                                                                    const storage = await import('../storage');
                                                                    const success = await storage.verifyJobCode(job.bookingId, 'cleaner', inputCode);
                                                                    if (success) {
                                                                        const started = await storage.checkVerificationAndStart(job.bookingId);
                                                                        if (started) {
                                                                            // Fetch updated booking from database
                                                                            const updatedBooking = await storage.getBookingWithTracking(job.bookingId);
                                                                            if (updatedBooking) {
                                                                                // Update todaySchedule with fresh data from database
                                                                                setDashboardData(prev => ({
                                                                                    ...prev,
                                                                                    todaySchedule: prev.todaySchedule.map(j =>
                                                                                        j.bookingId === job.bookingId ? {
                                                                                            ...j,
                                                                                            verificationCodes: updatedBooking.verificationCodes,
                                                                                            status: updatedBooking.status,
                                                                                            trackingStatus: updatedBooking.tracking?.status || j.trackingStatus
                                                                                        } : j
                                                                                    )
                                                                                }));
                                                                            }
                                                                        }
                                                                    } else {
                                                                        alert("Incorrect code. Please try again.");
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Verification error:', err);
                                                                    alert("Verification failed. Please try again.");
                                                                } finally {
                                                                    setVerifyingCleaner(prev => ({ ...prev, [job.id]: false }));
                                                                }
                                                            }}
                                                            disabled={!cleanerVerificationInput[job.id] || cleanerVerificationInput[job.id].length !== 6 || verifyingCleaner[job.id]}
                                                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${!cleanerVerificationInput[job.id] || cleanerVerificationInput[job.id].length !== 6 || verifyingCleaner[job.id]
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95 shadow-md'
                                                                }`}
                                                        >
                                                            {verifyingCleaner[job.id] ? 'Verifying...' : 'Verify Homeowner'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verified Success Message */}
                                        {job.verificationCodes?.cleanerVerified && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span className="font-bold text-sm">
                                                        {['approved', 'completed'].includes(job.status)
                                                            ? 'Work Finished & Approved'
                                                            : 'Verified! Job Started'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
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
        </div >
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
