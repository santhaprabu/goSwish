import { useState, useEffect } from 'react';
import { Calendar, Clock, Home, Sparkles, MapPin, Phone, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BookingsListNew() {
    const { getUserBookings, serviceTypes, getUserHouses, addOns } = useApp();

    const [bookings, setBookings] = useState([]);
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBookings = async () => {
        try {
            setRefreshing(true);
            const [bookingsData, housesData] = await Promise.all([
                getUserBookings(),
                getUserHouses()
            ]);

            console.log('📚 Loaded bookings:', bookingsData);
            console.log('🏠 Loaded houses:', housesData);

            setBookings(bookingsData || []);
            setHouses(housesData || []);
        } catch (error) {
            console.error('❌ Error loading bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const getHouseName = (houseId) => {
        const house = houses.find(h => h.id === houseId);
        return house ? house.name : 'Unknown Property';
    };

    const getHouseAddress = (houseId) => {
        const house = houses.find(h => h.id === houseId);
        return house ? `${house.address.street}, ${house.address.city}` : 'No address';
    };

    const getServiceName = (serviceId) => {
        const service = serviceTypes.find(s => s.id === serviceId);
        return service ? service.name : 'Unknown Service';
    };

    const getAddOnNames = (addOnIds) => {
        if (!addOnIds || addOnIds.length === 0) return [];
        return addOnIds.map(id => {
            const addOn = addOns.find(a => a.id === id);
            return addOn ? addOn.name : 'Unknown';
        }).filter(name => name !== 'Unknown');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No date';
        try {
            const date = new Date(dateStr + 'T12:00:00');
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
            'morning': '9 AM - 12 PM',
            'afternoon': '12 PM - 3 PM',
            'evening': '3 PM - 6 PM'
        };
        return slots[slotId] || slotId;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'in-progress': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">My Bookings</h1>
                        <button
                            onClick={loadBookings}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={refreshing}
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-12 h-12 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm">
                        Book your first cleaning service and it will appear here
                    </p>
                </div>
            </div>
        );
    }

    // Sort bookings by date (newest first)
    const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">My Bookings</h1>
                        <p className="text-sm text-gray-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={loadBookings}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-500' : 'text-gray-600'}`} />
                    </button>
                </div>
            </div>

            {/* Bookings List */}
            <div className="p-4 space-y-4">
                {sortedBookings.map((booking, index) => {
                    const addOnsList = getAddOnNames(booking.addOnIds || []);
                    const firstDate = booking.dates && booking.dates[0];
                    const timeSlot = booking.timeSlots && firstDate ? booking.timeSlots[firstDate]?.[0] : null;

                    return (
                        <div
                            key={booking.id || index}
                            className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden hover:border-blue-200 transition-all"
                        >
                            {/* Header */}
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500">
                                                {booking.id || 'BKG-' + index}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                                {getStatusText(booking.status)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Booked {new Date(booking.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {/* Property */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Home className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">{getHouseName(booking.houseId)}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {getHouseAddress(booking.houseId)}
                                        </div>
                                    </div>
                                </div>

                                {/* Service */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">{getServiceName(booking.serviceTypeId)}</div>
                                        {addOnsList.length > 0 && (
                                            <div className="text-sm text-gray-500">
                                                + {addOnsList.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">
                                            {firstDate ? formatDate(firstDate) : 'Date not set'}
                                        </div>
                                        {timeSlot && (
                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeSlot(timeSlot)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Special Notes */}
                                {booking.specialNotes && (
                                    <div className="pt-3 border-t">
                                        <div className="text-xs font-semibold text-gray-500 mb-1">Special Instructions</div>
                                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {booking.specialNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Price */}
                                {booking.totalAmount && (
                                    <div className="pt-3 border-t flex items-center justify-between">
                                        <span className="text-gray-600">Total Amount</span>
                                        <span className="text-xl font-bold text-blue-600">
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
