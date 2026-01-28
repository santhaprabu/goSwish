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
    const [dismissedIds, setDismissedIds] = useState([]);

    // Load dismissed jobs from localStorage on mount
    useEffect(() => {
        if (user?.uid) {
            const saved = localStorage.getItem(`dismissed_jobs_${user.uid}`);
            if (saved) {
                try {
                    setDismissedIds(JSON.parse(saved));
                } catch (e) {
                    console.error('Error parsing dismissed jobs');
                }
            }
        }
    }, [user?.uid]);

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
        // Hide dismissed ones
        if (dismissedIds.includes(offer.id)) return false;

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

            // Success feedback
            alert('Job Accepted! It has been added to your schedule.');
        } catch (error) {
            console.error('Failed to accept offer:', error);
            // Show alert to user
            alert(error.message || 'Failed to accept job. It may have been taken.');
        }
    };

    const handleDeclineOffer = (offer) => {
        const newDismissed = [...dismissedIds, offer.id];
        setDismissedIds(newDismissed);

        if (user?.uid) {
            localStorage.setItem(`dismissed_jobs_${user.uid}`, JSON.stringify(newDismissed));
        }

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
                        <h3 className="font-semibold text-gray-900">
                            {dateOptions.length > 1 ? 'Choose Your Preferred Date' : 'Scheduled Date'}
                        </h3>
                        {dateOptions.length > 1 && (
                            <p className="text-sm text-gray-600">
                                Customer provided {dateOptions.length} date options. Select the one that works best for you to accept the job.
                            </p>
                        )}

                        <div className="space-y-3">
                            {dateOptions.map((option, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="card p-4 bg-gray-50 border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {dateOptions.length > 1 ? (index === 0 ? '1st Choice' : `Option ${index + 1}`) : 'Requested Schedule'}
                                                </p>
                                                <p className="font-bold text-gray-900">{option.date}</p>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {option.timeSlot} ({option.startTime} - {option.endTime})
                                                </p>
                                            </div>
                                            {dateOptions.length > 1 && (
                                                <button
                                                    onClick={() => handleAcceptOffer(selectedOffer, option)}
                                                    className="btn btn-primary px-4 py-2 text-sm"
                                                >
                                                    Select & Accept
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {dateOptions.length === 1 && (
                                        <button
                                            onClick={() => handleAcceptOffer(selectedOffer, option)}
                                            className="w-full btn btn-primary py-4 text-lg"
                                        >
                                            Accept Job
                                        </button>
                                    )}
                                </div>
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
            {/* Header */}
            <div className="bg-black text-white px-6 pt-8 pb-8 rounded-b-[2rem] shadow-xl relative z-20">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Available Jobs</h1>
                        <p className="text-gray-400 text-sm mt-1">Find your next clean</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-xs font-medium text-gray-300">
                        {filteredOffers.length} nearby
                    </div>
                </div>

                {/* Quick Sort - Integrated in Header Area */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    <button
                        onClick={() => setSortBy('earnings')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${sortBy === 'earnings'
                                ? 'bg-white text-black border-white'
                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
                            }`}
                    >
                        Highest Pay
                    </button>
                    <button
                        onClick={() => setSortBy('distance')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${sortBy === 'distance'
                                ? 'bg-white text-black border-white'
                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
                            }`}
                    >
                        Closest
                    </button>
                    <button
                        onClick={() => setSortBy('expiring')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${sortBy === 'expiring'
                                ? 'bg-white text-black border-white'
                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
                            }`}
                    >
                        Expiring Soon
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-6 mt-4 mb-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                    {['all', 'regular', 'deep', 'move', 'windows'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all capitalize border
                ${filter === type
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {type === 'all' ? 'All Types' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Offers List */}
            <div className="px-6 pb-6 space-y-5 mt-2">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-gray-500 font-medium">Finding best jobs near you...</p>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">No jobs available</h3>
                        <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                            Check back later or adjust your filters to see more results.
                        </p>
                    </div>
                ) : (
                    filteredOffers.map(offer => (
                        <div
                            key={offer.id}
                            onClick={() => handleViewDetails(offer)}
                            className="bg-white rounded-[1.5rem] shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer relative group"
                        >
                            {/* Header Gradient Stripe */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-gray-900 to-gray-600"></div>

                            <div className="p-5">
                                {/* Top Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                        {(offer.booking.serviceTypeId || 'regular').replace('-', ' ')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" />
                                        {offer.expiresIn}m left
                                    </span>
                                </div>

                                {/* Main Info */}
                                <div className="mb-5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900 tracking-tight">${offer.earnings}</span>
                                        <span className="text-sm font-medium text-gray-400">est.</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm font-medium">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{offer.distance} mi</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{offer.house.address.city}</span>
                                    </div>
                                </div>

                                {/* House Grid */}
                                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-50 mb-5">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">{offer.house.bedrooms}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Bed</p>
                                    </div>
                                    <div className="text-center border-l border-gray-50">
                                        <p className="text-lg font-bold text-gray-900">{offer.house.bathrooms}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Bath</p>
                                    </div>
                                    <div className="text-center border-l border-gray-50">
                                        <p className="text-lg font-bold text-gray-900">{Math.round(offer.house.sqft / 1000)}k</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Sqft</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeclineOffer(offer);
                                        }}
                                        className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (offer.booking.dates?.length === 1) {
                                                const options = getDateOptions(offer.booking);
                                                handleAcceptOffer(offer, options[0]);
                                            } else {
                                                handleViewDetails(offer);
                                            }
                                        }}
                                        className="flex-1 bg-black text-white font-bold text-lg rounded-xl py-3 shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Accept Job
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
