import { useState, useEffect } from 'react';
import {
    getDocs, updateDoc, COLLECTIONS
} from '../storage/db';
import {
    Search, Filter, Calendar, Clock, MapPin, User, Briefcase,
    ChevronDown, ChevronUp, Eye, XCircle, CheckCircle, AlertTriangle,
    DollarSign, Home, Phone, Mail, MessageSquare, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG = {
    'booking-placed': { label: 'Placed', color: 'bg-blue-100 text-blue-700', icon: Clock },
    'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'confirmed': { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    'cleaner-assigned': { label: 'Assigned', color: 'bg-purple-100 text-purple-700', icon: User },
    'in-progress': { label: 'In Progress', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
    'completed': { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
    'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
};

const PAYMENT_STATUS_CONFIG = {
    'pending': { label: 'Pending', color: 'text-yellow-600' },
    'paid': { label: 'Paid', color: 'text-green-600' },
    'refunded': { label: 'Refunded', color: 'text-blue-600' },
    'failed': { label: 'Failed', color: 'text-red-600' },
};

export default function BookingManagement() {
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [houses, setHouses] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, amount

    // Detail View
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsData, usersData, cleanersData, housesData, serviceTypesData] = await Promise.all([
                getDocs(COLLECTIONS.BOOKINGS),
                getDocs(COLLECTIONS.USERS),
                getDocs(COLLECTIONS.CLEANERS),
                getDocs(COLLECTIONS.HOUSES),
                getDocs(COLLECTIONS.SERVICE_TYPES),
            ]);

            setBookings(bookingsData || []);
            setUsers(usersData || []);
            setCleaners(cleanersData || []);
            setHouses(housesData || []);
            setServiceTypes(serviceTypesData || []);
        } catch (e) {
            console.error('Error loading bookings:', e);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Get user by ID
    const getUser = (userId) => users.find(u => u.id === userId) || {};

    // Get cleaner by ID
    const getCleaner = (cleanerId) => cleaners.find(c => c.id === cleanerId || c.userId === cleanerId) || {};

    // Get house by ID
    const getHouse = (houseId) => houses.find(h => h.id === houseId) || {};

    // Get service type by ID
    const getServiceType = (serviceTypeId) => serviceTypes.find(s => s.id === serviceTypeId) || {};

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        // Status filter
        if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

        // Date filter
        if (dateFilter !== 'all') {
            const bookingDate = new Date(booking.createdAt || booking.dates?.[0]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateFilter === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (bookingDate < today || bookingDate >= tomorrow) return false;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (bookingDate < weekAgo) return false;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                if (bookingDate < monthAgo) return false;
            }
        }

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            const customer = getUser(booking.customerId);
            const cleaner = getCleaner(booking.cleanerId);
            const house = getHouse(booking.houseId);

            const matchesSearch =
                booking.bookingId?.toLowerCase().includes(searchLower) ||
                booking.id?.toLowerCase().includes(searchLower) ||
                customer.name?.toLowerCase().includes(searchLower) ||
                customer.email?.toLowerCase().includes(searchLower) ||
                cleaner.name?.toLowerCase().includes(searchLower) ||
                house.name?.toLowerCase().includes(searchLower) ||
                house.address?.street?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;
        }

        return true;
    });

    // Sort bookings
    const sortedBookings = [...filteredBookings].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else if (sortBy === 'oldest') {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        } else if (sortBy === 'amount') {
            return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        return 0;
    });

    // Toggle row expansion
    const toggleRow = (bookingId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(bookingId)) {
            newExpanded.delete(bookingId);
        } else {
            newExpanded.add(bookingId);
        }
        setExpandedRows(newExpanded);
    };

    // Update booking status
    const handleUpdateStatus = async (bookingId, newStatus) => {
        if (!window.confirm(`Update booking status to "${STATUS_CONFIG[newStatus]?.label || newStatus}"?`)) return;

        try {
            await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
                status: newStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin'
            });
            await loadData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // Stats calculation
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'booking-placed' || b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'cleaner-assigned').length,
        inProgress: bookings.filter(b => b.status === 'in-progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };

    // Booking Detail Modal
    const BookingDetailModal = () => {
        if (!selectedBooking) return null;

        const customer = getUser(selectedBooking.customerId);
        const cleaner = getCleaner(selectedBooking.cleanerId);
        const house = getHouse(selectedBooking.houseId);
        const serviceType = getServiceType(selectedBooking.serviceTypeId);
        const statusConfig = STATUS_CONFIG[selectedBooking.status] || STATUS_CONFIG['pending'];
        const StatusIcon = statusConfig.icon;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start z-10">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Booking #{selectedBooking.bookingId || selectedBooking.id?.slice(-8)}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusConfig.color}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusConfig.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Created: {formatDate(selectedBooking.createdAt)} at {formatTime(selectedBooking.createdAt)}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedBooking(null)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Customer & Cleaner Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Customer
                                </h4>
                                <div className="space-y-2">
                                    <p className="font-semibold text-gray-900">{customer.name || 'Unknown'}</p>
                                    {customer.email && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> {customer.email}
                                        </p>
                                    )}
                                    {customer.phone && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> {customer.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Cleaner */}
                            <div className="bg-orange-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Cleaner
                                </h4>
                                {selectedBooking.cleanerId ? (
                                    <div className="space-y-2">
                                        <p className="font-semibold text-gray-900">{cleaner.name || 'Unknown'}</p>
                                        {cleaner.phone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> {cleaner.phone}
                                            </p>
                                        )}
                                        {cleaner.rating && (
                                            <p className="text-sm text-gray-600">Rating: {cleaner.rating}/5</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Not yet assigned</p>
                                )}
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4" /> Property Details
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="font-medium">{house.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Size</p>
                                    <p className="font-medium">{house.sqft || house.size || 'N/A'} sqft</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Bedrooms</p>
                                    <p className="font-medium">{house.bedrooms || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Bathrooms</p>
                                    <p className="font-medium">{house.bathrooms || 'N/A'}</p>
                                </div>
                            </div>
                            {house.address && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {house.address.street}, {house.address.city}, {house.address.state} {house.address.zip}
                                    </p>
                                </div>
                            )}
                            {house.petInfo && house.petInfo !== 'No pets' && (
                                <div className="mt-2">
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                        Pets: {house.petInfo}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Service & Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-purple-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-purple-800 uppercase tracking-wide mb-3">Service</h4>
                                <p className="font-semibold text-gray-900">{serviceType.name || selectedBooking.serviceTypeId}</p>
                                <p className="text-sm text-gray-600 mt-1">{serviceType.description}</p>
                                {selectedBooking.addOnIds?.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs text-gray-500">Add-ons:</p>
                                        <p className="text-sm font-medium">{selectedBooking.addOnIds.join(', ')}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-green-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Schedule
                                </h4>
                                {selectedBooking.dates?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedBooking.dates.map((date, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="font-medium">{formatDate(date)}</span>
                                                {selectedBooking.timeSlots?.[idx] && (
                                                    <span className="text-sm text-gray-600">
                                                        at {selectedBooking.timeSlots[idx]}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No dates scheduled</p>
                                )}
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="bg-emerald-50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Pricing
                            </h4>
                            {selectedBooking.pricingBreakdown ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Base Price</span>
                                        <span className="font-medium">${selectedBooking.pricingBreakdown.base?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedBooking.pricingBreakdown.addOns > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Add-ons</span>
                                            <span className="font-medium">${selectedBooking.pricingBreakdown.addOns?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">${selectedBooking.pricingBreakdown.subtotal?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax ({((selectedBooking.pricingBreakdown.taxRate || 0.0825) * 100).toFixed(2)}%)</span>
                                        <span className="font-medium">${selectedBooking.pricingBreakdown.taxes?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedBooking.pricingBreakdown.promoDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-${selectedBooking.pricingBreakdown.promoDiscount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-emerald-200 text-lg font-bold">
                                        <span>Total</span>
                                        <span>${selectedBooking.totalAmount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${selectedBooking.totalAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment Status</span>
                                <span className={`font-semibold ${PAYMENT_STATUS_CONFIG[selectedBooking.paymentStatus]?.color || 'text-gray-600'}`}>
                                    {PAYMENT_STATUS_CONFIG[selectedBooking.paymentStatus]?.label || selectedBooking.paymentStatus || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        {/* Special Notes */}
                        {selectedBooking.specialNotes && (
                            <div className="bg-yellow-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Special Notes
                                </h4>
                                <p className="text-gray-700">{selectedBooking.specialNotes}</p>
                            </div>
                        )}

                        {/* Status Update Actions */}
                        <div className="bg-gray-100 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateStatus(selectedBooking.id, status)}
                                        disabled={selectedBooking.status === status}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                            ${selectedBooking.status === status
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : `${config.color} hover:opacity-80`}`}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
                    <p className="text-gray-500 text-sm mt-1">View and manage all bookings</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <p className="text-xs text-yellow-600 uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-xs text-purple-600 uppercase tracking-wide">Confirmed</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.confirmed}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-600 uppercase tracking-wide">In Progress</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.inProgress}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 uppercase tracking-wide">Completed</p>
                    <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <p className="text-xs text-red-600 uppercase tracking-wide">Cancelled</p>
                    <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide">Revenue</p>
                    <p className="text-2xl font-bold text-emerald-700">${stats.totalRevenue.toFixed(0)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by booking ID, customer, cleaner, or address..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                    ))}
                </select>

                {/* Date Filter */}
                <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Highest Amount</option>
                </select>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-500">
                Showing {sortedBookings.length} of {bookings.length} bookings
            </p>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cleaner</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                                        No bookings found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                sortedBookings.map(booking => {
                                    const customer = getUser(booking.customerId);
                                    const cleaner = getCleaner(booking.cleanerId);
                                    const serviceType = getServiceType(booking.serviceTypeId);
                                    const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG['pending'];
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-sm font-semibold text-gray-900">
                                                    #{booking.bookingId || booking.id?.slice(-8)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(booking.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{customer.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{customer.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {booking.cleanerId ? (
                                                    <p className="font-medium text-gray-900">{cleaner.name || 'Unknown'}</p>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {serviceType.name || booking.serviceTypeId}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {booking.dates?.[0] ? (
                                                    <div>
                                                        <p className="text-sm text-gray-900">{formatDate(booking.dates[0])}</p>
                                                        {booking.timeSlots?.[0] && (
                                                            <p className="text-xs text-gray-500">{booking.timeSlots[0]}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">
                                                    ${booking.totalAmount?.toFixed(2) || '0.00'}
                                                </p>
                                                <p className={`text-xs ${PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.color || 'text-gray-500'}`}>
                                                    {PAYMENT_STATUS_CONFIG[booking.paymentStatus]?.label || booking.paymentStatus}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <BookingDetailModal />
        </div>
    );
}
