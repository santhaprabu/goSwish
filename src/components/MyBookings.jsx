import { useState, useEffect } from 'react';
import { Calendar, Clock, Home, Sparkles, MapPin, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLLECTIONS, getDocs } from '../storage/db';

export default function MyBookings() {
    const { user, serviceTypes, addOns } = useApp();

    const [bookings, setBookings] = useState([]);
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            setRefreshing(true);
            setError(null);

            console.log('🔄 Loading bookings for user:', user?.uid);

            // Get ALL bookings from database
            const allBookings = await getDocs(COLLECTIONS.BOOKINGS);
            console.log('📚 Total bookings in DB:', allBookings.length);
            console.log('📋 All bookings:', allBookings);

            // Filter bookings for current user
            // Handle both correct customerId field AND corrupted spread format
            const userBookings = allBookings.filter(booking => {
                // Check if customerId field exists and matches
                if (booking.customerId === user?.uid) {
                    return true;
                }

                // Check if userId field exists (alternative naming)
                if (booking.userId === user?.uid) {
                    return true;
                }

                // Check for corrupted data (string spread as object)
                // If customerId was spread, it creates indices: {"0": "u", "1": "s", "2": "e", ...}
                const hasNumericKeys = Object.keys(booking).some(key => !isNaN(key));
                if (hasNumericKeys) {
                    // Try to reconstruct the string from numeric indices
                    const indices = Object.keys(booking).filter(key => !isNaN(key)).sort((a, b) => a - b);
                    const reconstructed = indices.map(i => booking[i]).join('');
                    if (reconstructed === user?.uid) {
                        console.log('⚠️ Found corrupted booking, reconstructed ID:', reconstructed);
                        return true;
                    }
                }

                return false;
            });

            console.log('👤 User bookings found:', userBookings.length);
            console.log('📊 User bookings data:', userBookings);

            // Get all houses for reference
            const allHouses = await getDocs(COLLECTIONS.HOUSES);
            const userHouses = allHouses.filter(h => h.userId === user?.uid);

            console.log('🏠 User houses:', userHouses.length);

            setBookings(userBookings);
            setHouses(userHouses);

        } catch (err) {
            console.error('❌ Error loading bookings:', err);
            setError('Failed to load bookings. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user?.uid]);

    // Helper functions with safe fallbacks
    const getHouseName = (houseId) => {
        if (!houseId) return 'Property not specified';
        const house = houses.find(h => h.id === houseId);
        return house?.name || 'Unknown Property';
    };

    const getHouseAddress = (houseId) => {
        if (!houseId) return 'Address not available';
        const house = houses.find(h => h.id === houseId);
        if (!house || !house.address) return 'Address not available';
        return `${house.address.street || ''}, ${house.address.city || ''}`.trim();
    };

    const getServiceName = (serviceId) => {
        if (!serviceId) return 'Service not specified';
        const service = serviceTypes.find(s => s.id === serviceId);
        return service?.name || 'Unknown Service';
    };

    const getAddOnNames = (addOnIds) => {
        if (!addOnIds || !Array.isArray(addOnIds) || addOnIds.length === 0) return [];
        return addOnIds
            .map(id => {
                const addOn = addOns.find(a => a.id === id);
                return addOn?.name;
            })
            .filter(Boolean); // Remove undefined/null
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date not set';
        try {
            const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeSlot = (slotId) => {
        const slots = {
            'morning': '🌅 9 AM - 12 PM',
            'afternoon': '☀️ 12 PM - 3 PM',
            'evening': '🌆 3 PM - 6 PM'
        };
        return slots[slotId] || slotId || 'Time not set';
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'confirmed': 'bg-teal-600 text-white border-teal-600',
            'in-progress': 'bg-purple-50 text-purple-700 border-purple-200',
            'completed': 'bg-green-50 text-green-700 border-green-200',
            'cancelled': 'bg-red-50 text-red-700 border-red-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusText = (status) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading bookings...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-white border-b px-4 py-3">
                    <h1 className="text-xl font-bold text-center">My Bookings</h1>
                </div>
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Bookings</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button onClick={loadData} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (bookings.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
                <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">My Bookings</h1>
                        <button
                            onClick={loadData}
                            disabled={refreshing}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-12 h-12 text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">No Bookings Yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm">
                        Your cleaning bookings will appear here once you book a service
                    </p>
                </div>
            </div>
        );
    }

    // Sort bookings by created date (newest first)
    const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    // Bookings list
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-sm text-gray-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={refreshing}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-500' : 'text-gray-600'}`} />
                    </button>
                </div>
            </div>

            {/* Bookings */}
            <div className="p-4 space-y-4">
                {sortedBookings.map((booking, index) => {
                    const firstDate = booking.dates?.[0];
                    const timeSlot = firstDate && booking.timeSlots ? booking.timeSlots[firstDate]?.[0] : null;
                    const addOnsList = getAddOnNames(booking.addOnIds);

                    return (
                        <div
                            key={booking.id || index}
                            className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-mono text-gray-500 mb-1">
                                            {booking.bookingId || booking.id || `BKG-${index}`}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                                                {getStatusText(booking.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">Booked</div>
                                        <div className="text-xs font-medium text-gray-600">
                                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Unknown date'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {/* Property */}
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Home className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 text-lg">{getHouseName(booking.houseId)}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">{getHouseAddress(booking.houseId)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service */}
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">{getServiceName(booking.serviceTypeId)}</div>
                                        {addOnsList.length > 0 && (
                                            <div className="text-sm text-teal-700 mt-1">
                                                + {addOnsList.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">
                                            {firstDate ? formatDate(firstDate) : 'Date not set'}
                                        </div>
                                        {timeSlot && (
                                            <div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTimeSlot(timeSlot)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {booking.specialNotes && (
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Special Instructions</div>
                                        <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                            {booking.specialNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Price */}
                                {booking.totalAmount !== undefined && (
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">Total Amount</span>
                                        <span className="text-2xl font-bold text-teal-700">
                                            ${typeof booking.totalAmount === 'number' ? booking.totalAmount.toFixed(2) : booking.totalAmount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
