import { useState } from 'react';
import {
    Calendar, MapPin, User, DollarSign, ChevronRight,
    Filter, Download, RefreshCw, CheckCircle, Clock,
    XCircle, AlertCircle, Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Booking History - Complete customer booking history
export default function BookingHistory({ onViewDetails, onRebook }) {
    const { bookings, user } = useApp();
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    // Filter user's bookings
    const userBookings = bookings.filter(b => b.customerId === user?.uid);

    // Apply filters
    const filteredBookings = userBookings.filter(booking => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'upcoming') {
            return ['confirmed', 'matched'].includes(booking.status);
        }
        if (filterStatus === 'completed') {
            return booking.status === 'completed';
        }
        if (filterStatus === 'cancelled') {
            return booking.status === 'cancelled';
        }
        return true;
    });

    // Apply sorting
    const sortedBookings = [...filteredBookings].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === 'amount') {
            return (b.pricingBreakdown?.total || 0) - (a.pricingBreakdown?.total || 0);
        }
        return 0;
    });

    const getStatusConfig = (status) => {
        const configs = {
            confirmed: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: Clock },
            matched: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: Clock },
            in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
            completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
            cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle }
        };
        return configs[status] || configs.confirmed;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getServiceIcon = (serviceType) => {
        const icons = {
            regular: '🧹',
            deep: '✨',
            move: '📦',
            windows: '🪟'
        };
        return icons[serviceType] || '🏠';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">My Bookings</h1>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filter</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'cancelled', label: 'Cancelled' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setFilterStatus(filter.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${filterStatus === filter.id
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div className="px-6 py-3 bg-white border-b border-gray-100">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-none outline-none"
                >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Amount (High to Low)</option>
                </select>
            </div>

            {/* Bookings List */}
            <div className="px-6 py-6 space-y-4">
                {sortedBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filterStatus === 'all'
                                ? 'Book your first cleaning to get started'
                                : 'Try adjusting your filters'
                            }
                        </p>
                        {filterStatus === 'all' && (
                            <button className="btn btn-primary">
                                Book Your First Cleaning
                            </button>
                        )}
                    </div>
                ) : (
                    sortedBookings.map(booking => {
                        const statusConfig = getStatusConfig(booking.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={booking.id}
                                className="card p-5 cursor-pointer hover:shadow-lg transition-all"
                                onClick={() => onViewDetails?.(booking)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">
                                            {getServiceIcon(booking.serviceType)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 capitalize">
                                                {booking.serviceType} Clean
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {booking.house?.nickname || 'Home'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`badge ${statusConfig.color} flex items-center gap-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(booking.selectedDate?.date || booking.createdAt)}</span>
                                    </div>

                                    {booking.cleaner && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="w-4 h-4" />
                                            <span>{booking.cleaner.name}</span>
                                            {booking.cleaner.rating && (
                                                <span className="flex items-center gap-1 text-yellow-600">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    {booking.cleaner.rating}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span className="truncate">{booking.house?.address?.street}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <DollarSign className="w-4 h-4" />
                                        <span>${booking.pricingBreakdown?.total?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    {booking.status === 'completed' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRebook?.(booking);
                                            }}
                                            className="flex items-center gap-2 text-sm font-medium text-black hover:underline"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Rebook
                                        </button>
                                    ) : booking.status === 'confirmed' || booking.status === 'matched' ? (
                                        <span className="text-sm text-gray-500">
                                            Scheduled
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-500">
                                            {booking.status === 'cancelled' ? 'Cancelled' : 'View Details'}
                                        </span>
                                    )}

                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More (if needed) */}
            {sortedBookings.length > 0 && sortedBookings.length >= 20 && (
                <div className="px-6 pb-6">
                    <button className="btn btn-ghost w-full">
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
