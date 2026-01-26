import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    getAvailableBookings,
    getHouseById,
    getCleanerByUserId
} from '../storage'; // Import direct helpers not exposed in context

import {
    DollarSign, MapPin, Clock, Calendar, Home, User,
    Check, X, ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';

// Job Offers - Available Jobs for Cleaners
export default function JobOffers() {
    const { user, acceptJobOffer } = useApp();
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [sortBy, setSortBy] = useState('earnings'); // earnings, distance, expiring
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    // Load available job offers
    useEffect(() => {
        async function loadOffers() {
            try {
                setLoading(true);
                // 1. Get available bookings (confirmed, no cleaner yet)
                const bookings = await getAvailableBookings();

                // 2. Map to offers ( enriching with house data )
                const offersData = await Promise.all(bookings.map(async (booking) => {
                    let house = null;
                    if (booking.houseId) {
                        try {
                            house = await getHouseById(booking.houseId);
                        } catch (e) {
                            console.warn('Could not fetch house for booking', booking.id);
                        }
                    }

                    // Calculate distance (mock for now or real if cleaner location known)
                    // In a real app we'd need cleaner's location here. 
                    // For now, mockup distance.
                    const distance = Math.random() * 15 + 2;

                    // Earnings estimate (70% of total)
                    // If booking has totalAmount, use it.
                    const amount = booking.totalAmount || 100; // Fallback
                    const earnings = amount * 0.7;

                    // Expiry logic (mock)
                    // Real app might use booking.createdAt + 1 hour?
                    // Let's just say it expires in 30 mins from now for engagement.
                    const expiresIn = Math.floor(Math.random() * 30) + 10;

                    return {
                        id: booking.id, // Use booking ID as offer ID
                        bookingId: booking.id,
                        booking,
                        house: house || {
                            // Fallback house data if missing
                            id: 'unknown',
                            sqft: 1500,
                            bedrooms: 2,
                            bathrooms: 2,
                            address: { street: 'Unknown St', city: 'City', state: 'ST', zip: '00000' }
                        },
                        earnings: Math.round(earnings),
                        distance: Math.round(distance * 10) / 10,
                        expiresIn,
                        status: 'open',
                        createdAt: booking.createdAt
                    };
                }));

                setOffers(offersData);
            } catch (error) {
                console.error('Error loading job offers:', error);
            } finally {
                setLoading(false);
            }
        }

        loadOffers();
    }, []);

    // Sort offers
    const sortedOffers = [...offers].sort((a, b) => {
        if (sortBy === 'earnings') return b.earnings - a.earnings;
        if (sortBy === 'distance') return a.distance - b.distance;
        if (sortBy === 'expiring') return a.expiresIn - b.expiresIn;
        return 0;
    });

    // Filter offers
    const filteredOffers = sortedOffers.filter(offer => {
        if (filter === 'all') return true;
        // Check service type ID, assuming booking.serviceTypeId exists
        const type = offer.booking.serviceTypeId || 'regular';
        return type.includes(filter);
    });

    const handleViewDetails = (offer) => {
        setSelectedOffer(offer);
    };

    const handleAcceptOffer = async (offer, selectedDateOption) => {
        try {
            if (!user?.uid) {
                console.log('Please log in first');
                return;
            }

            // Get Cleaner Profile ID
            const cleanerProfile = await getCleanerByUserId(user.uid);
            if (!cleanerProfile) {
                console.log('Cleaner profile not found. Please setup your profile.');
                return;
            }

            const { date, startTime, endTime } = selectedDateOption || {
                // If options not provided, use booking's primary selection
                date: offer.booking.dates?.[0],
                startTime: '09:00', // Default hardcode if not detailed
                endTime: '12:00'
            };

            // If booking has timeSlots, use that
            let actualStartTime = startTime;
            let actualEndTime = endTime;

            if (offer.booking.timeSlots && offer.booking.timeSlots[date]) {
                // timeSlots is { "2026-01-25": ["morning"] }
                // Need to map "morning" to times
                const slot = offer.booking.timeSlots[date][0];
                if (slot === 'morning') { actualStartTime = '09:00'; actualEndTime = '12:00'; }
                else if (slot === 'afternoon') { actualStartTime = '12:00'; actualEndTime = '15:00'; }
                else if (slot === 'evening') { actualStartTime = '15:00'; actualEndTime = '18:00'; }
            }

            console.log('Accepting offer for:', date, actualStartTime);

            await acceptJobOffer(offer.booking.id, cleanerProfile.id, {
                date,
                startTime: actualStartTime,
                endTime: actualEndTime
            });

            // Remove from list
            setOffers(prev => prev.filter(o => o.id !== offer.id));
            setSelectedOffer(null);
            console.log('Job Accepted! Check your schedule.');

        } catch (error) {
            console.error('Failed to accept offer:', error);
            console.log('Failed to accept job: ' + error.message);
        }
    };

    const handleDeclineOffer = (offer) => {
        setOffers(prev => prev.filter(o => o.id !== offer.id));
        setSelectedOffer(null);
    };

    // Helper: Normalize date options for UI
    const getDateOptions = (booking) => {
        if (booking.dateOptions && booking.dateOptions.length > 0) return booking.dateOptions;

        // Fallback: create options from booking.dates
        if (booking.dates && booking.dates.length > 0) {
            return booking.dates.map(date => {
                const slots = booking.timeSlots?.[date] || ['morning'];
                const slot = slots[0];
                let timeRange = '9 AM - 12 PM';
                if (slot === 'afternoon') timeRange = '12 PM - 3 PM';
                if (slot === 'evening') timeRange = '3 PM - 6 PM';

                return {
                    date,
                    timeSlot: slot,
                    startTime: timeRange.split(' - ')[0],
                    endTime: timeRange.split(' - ')[1]
                };
            });
        }
        return [];
    };

    // Offer Details Modal
    if (selectedOffer) {
        const dateOptions = getDateOptions(selectedOffer.booking);

        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setSelectedOffer(null)} className="p-2">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-lg font-semibold">Job Details</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Earnings */}
                    <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
                        <div className="text-center">
                            <p className="text-sm text-success-700 mb-1">You'll Earn</p>
                            <p className="text-4xl font-bold text-success-900">
                                ${selectedOffer.earnings}
                            </p>
                            <p className="text-xs text-success-600 mt-2">
                                Paid within 48 hours after completion
                            </p>
                        </div>
                    </div>

                    {/* Expiry Warning */}
                    <div className="card p-4 bg-warning-50 border-warning-200 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-warning-600 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-warning-900">
                                Expires in {selectedOffer.expiresIn} minutes
                            </p>
                            <p className="text-sm text-warning-700">
                                Accept soon or this offer will expire
                            </p>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="card p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Service Details</h3>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Service Type</p>
                                <p className="font-medium text-gray-900 capitalize">
                                    {(selectedOffer.booking.serviceTypeId || 'regular').replace('-', ' ')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Distance</p>
                                <p className="font-medium text-gray-900">
                                    {selectedOffer.distance} miles away
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estimated Duration</p>
                                <p className="font-medium text-gray-900">
                                    {Math.ceil(selectedOffer.house.sqft / 500)} hours
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* House Details */}
                    <div className="card p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Property Details</h3>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Address</p>
                            <p className="font-medium text-gray-900">
                                {selectedOffer.house.address.street}
                            </p>
                            <p className="text-sm text-gray-600">
                                {selectedOffer.house.address.city}, {selectedOffer.house.address.state} {selectedOffer.house.address.zip}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500">Size</p>
                                <p className="font-medium text-gray-900">{selectedOffer.house.sqft} sqft</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Bedrooms</p>
                                <p className="font-medium text-gray-900">{selectedOffer.house.bedrooms}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Bathrooms</p>
                                <p className="font-medium text-gray-900">{selectedOffer.house.bathrooms}</p>
                            </div>
                        </div>

                        {selectedOffer.house.pets?.hasPets && (
                            <div className="p-3 bg-warning-50 rounded-lg">
                                <p className="text-sm font-medium text-warning-900">🐾 Pets in home</p>
                                {selectedOffer.house.pets.notes && (
                                    <p className="text-xs text-warning-700 mt-1">{selectedOffer.house.pets.notes}</p>
                                )}
                            </div>
                        )}

                        {selectedOffer.house.petInfo != null && selectedOffer.house.petInfo !== 'No pets' && (
                            <div className="p-3 bg-warning-50 rounded-lg">
                                <p className="text-sm font-medium text-warning-900">🐾 Pets: {selectedOffer.house.petInfo}</p>
                            </div>
                        )}

                        {selectedOffer.house.accessNotes && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Access Instructions</p>
                                <p className="text-sm text-gray-700">{selectedOffer.house.accessNotes}</p>
                            </div>
                        )}
                    </div>

                    {/* Date Options */}
                    <div className="card p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Choose Your Preferred Date</h3>
                        <p className="text-sm text-gray-600">
                            Customer provided {dateOptions.length} date options. Select the one that works best for you.
                        </p>

                        <div className="space-y-3">
                            {dateOptions.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAcceptOffer(selectedOffer, option)}
                                    className="w-full card p-4 hover:shadow-md transition-all text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                {index === 0 ? '1st Choice' : `Option ${index + 1}`}
                                            </p>
                                            <p className="font-medium text-gray-900">{option.date}</p>
                                            <p className="text-sm text-gray-600 capitalize">
                                                {option.timeSlot} ({option.startTime} - {option.endTime})
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special Notes */}
                    {selectedOffer.booking.specialNotes && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
                            <p className="text-sm text-gray-700">{selectedOffer.booking.specialNotes}</p>
                        </div>
                    )}

                    {/* Add-ons */}
                    {selectedOffer.booking.addOnIds && selectedOffer.booking.addOnIds.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Add-on Services</h3>
                            <div className="space-y-2">
                                {selectedOffer.booking.addOnIds.map((addon, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-success-600" />
                                        <span className="text-sm text-gray-700 capitalize">
                                            {addon.replace('-', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleDeclineOffer(selectedOffer)}
                            className="btn btn-ghost w-full text-error-600 hover:bg-error-50"
                        >
                            Not Interested
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Offers List
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">Available Jobs</h1>
                </div>
            </div>

            {/* Sort & Filter */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 space-y-3">
                <div className="flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setSortBy('earnings')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${sortBy === 'earnings'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Highest Earnings
                    </button>
                    <button
                        onClick={() => setSortBy('distance')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${sortBy === 'distance'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Closest
                    </button>
                    <button
                        onClick={() => setSortBy('expiring')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${sortBy === 'expiring'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Clock className="w-4 h-4 inline mr-1" />
                        Expiring Soon
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto">
                    {['all', 'regular', 'deep', 'move', 'windows'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${filter === type
                                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary-200'
                                }`}
                        >
                            {type === 'all' ? 'All Jobs' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Offers List */}
            <div className="px-6 py-6 space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading open jobs...</p>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">No jobs available right now</h3>
                        <p className="text-gray-500 text-sm">
                            We'll notify you when new jobs arrive!
                        </p>
                    </div>
                ) : (
                    filteredOffers.map(offer => (
                        <div
                            key={offer.id}
                            onClick={() => handleViewDetails(offer)}
                            className="card p-4 hover:shadow-lg transition-all cursor-pointer"
                        >
                            {/* Earnings Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-success-100 rounded-full">
                                        <span className="text-lg font-bold text-success-700">
                                            ${offer.earnings}
                                        </span>
                                    </div>
                                    <div className="px-2 py-1 bg-primary-100 rounded-full">
                                        <span className="text-xs font-medium text-primary-700 capitalize">
                                            {(offer.booking.serviceTypeId || 'regular').replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Expires in</p>
                                    <p className="text-sm font-semibold text-warning-600">
                                        {offer.expiresIn} min
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{offer.distance} miles away</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{offer.house.address.city}, {offer.house.address.state}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Home className="w-4 h-4" />
                                    <span>{offer.house.sqft} sqft</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{offer.house.bedrooms} bed</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{offer.house.bathrooms} bath</span>
                                    {offer.house.pets?.hasPets && <span>🐾</span>}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{offer.booking.dates?.[0] || 'Flexible'}</span>
                                    {offer.booking.dates?.length > 1 && (
                                        <span className="text-gray-400">+{offer.booking.dates.length - 1} more options</span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(offer);
                                    }}
                                    className="btn btn-primary flex-1"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeclineOffer(offer);
                                    }}
                                    className="btn btn-ghost px-4"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
