import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * JOB OFFERS COMPONENT (Marketplace)
 * ============================================================================
 * 
 * Purpose:
 * Displays available jobs to cleaners (Uber-style feed).
 * 
 * Features:
 * - Tabbed view: 'Available' (Marketplace) vs 'Upcoming' (My Schedule).
 * - Match Score: Calculates compatibility based on location & preferences.
 * - Acceptance Flow: Cleaners can claim a job instantly or bid.
 */
import { useApp } from '../context/AppContext';
import {
    getAvailableBookings,
    getHouseById,
    getCleanerByUserId,
    calculateMatchScore
} from '../storage'; // Import direct helpers not exposed in context

import {
    DollarSign, MapPin, Clock, Calendar, Home, User,
    Check, X, ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';

// Import centralized date utilities
import { parseLocalDate, formatDisplayDate } from '../utils/dateUtils';

// Job Offers - Available Jobs for Cleaners
import UpcomingJobs from './UpcomingJobs';

/**
 * ============================================================================
 * JOB OFFERS COMPONENT (Marketplace)
 * ============================================================================
 * 
 * Purpose:
 * This component is the "Marketplace" where Cleaners find work.
 * It displays a list of available bookings that match the cleaner's criteria.
 * 
 * Key Features:
 * 1. Eligibility Filtering: Only shows jobs the cleaner CAN do (skills, location).
 * 2. Match Scoring: Ranks jobs by how well they fit the cleaner's preferences.
 * 3. Optimistic UI: Allows instant acceptance (handled safely by backend).
 * 4. Dual View: Toggles between "Available" (Marketplace) and "Upcoming" (My Schedule).
 * 
 * @param {Function} onViewUpcomingJob - Navigation callback
 */
export default function JobOffers({ onViewUpcomingJob }) {
    const { user, acceptJobOffer } = useApp();
    const [viewMode, setViewMode] = useState('available'); // 'available' | 'upcoming'
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

                // 2. Get current cleaner profile
                const cleaner = await getCleanerByUserId(user.uid);
                if (!cleaner) {
                    setOffers([]);
                    return;
                }

                // 3. Map to offers ( enriching with house data and match score )
                const offersData = [];

                for (const booking of bookings) {
                    // Check match logic
                    const match = await calculateMatchScore(booking, cleaner);

                    // Only show if eligible (passes hard constraints)
                    if (!match.isEligible) continue;

                    let house = null;
                    if (booking.houseId) {
                        try {
                            house = await getHouseById(booking.houseId);
                        } catch (e) {
                            console.warn('Could not fetch house for booking', booking.id);
                        }
                    }

                    // Earnings estimate (90% of subtotal - 10% platform fee)
                    // Priority: subtotal (pre-tax) > (total - taxes) > totalAmount * 0.92 (estimated)
                    let baseAmount = 0;
                    if (booking.pricingBreakdown?.subtotal) {
                        baseAmount = booking.pricingBreakdown.subtotal;
                    } else if (booking.pricingBreakdown?.total && booking.pricingBreakdown?.taxes) {
                        // Back-calculate subtotal from total minus taxes
                        baseAmount = booking.pricingBreakdown.total - booking.pricingBreakdown.taxes;
                    } else {
                        // Fallback: estimate subtotal as ~92% of total (assuming ~8% tax)
                        baseAmount = (booking.totalAmount || 0) / 1.0825;
                    }
                    const earnings = baseAmount * 0.9;

                    // Expiry logic (mock)
                    const expiresIn = Math.floor(Math.random() * 30) + 10;

                    offersData.push({
                        id: booking.id,
                        bookingId: booking.bookingId || booking.id,
                        booking,
                        house: house || {
                            id: 'unknown',
                            sqft: 1500,
                            bedrooms: 2,
                            bathrooms: 2,
                            address: { street: 'Unknown St', city: 'City', state: 'ST', zip: '00000' }
                        },
                        earnings: Math.round(earnings),
                        distance: match.distance || 0,
                        matchScore: match.score || 0,
                        matchDescription: match.matchDescription || 'Compatible',
                        expiresIn,
                        status: 'open',
                        createdAt: booking.createdAt
                    });
                }

                setOffers(offersData);
            } catch (error) {
                console.error('Error loading job offers:', error);
            } finally {
                setLoading(false);
            }
        }

        if (viewMode === 'available') {
            loadOffers();
        }
    }, [user, viewMode]);

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

    /**
     * Handle Accepting a Job Offer
     * 
     * EDUCATIONAL NOTE:
     * This is a critical transaction. In a real marketplace, multiple cleaners
     * might try to accept the same job at the same time (Race Condition).
     * 
     * Our backend (helpers.js -> acceptJobOffer) handles this using 
     * "Optimistic Locking" (checking version numbers) to ensure only one 
     * cleaner wins the job.
     */
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

            // Switch to upcoming view to show the new job
            setViewMode('upcoming');
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

    // Helper to format date for display using centralized utility
    const formatDateForDisplay = (dateStr) => {
        return formatDisplayDate(dateStr, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Helper: Normalize date options for UI
    const getDateOptions = (booking) => {
        if (booking.dateOptions && booking.dateOptions.length > 0) {
            // Format dates in dateOptions
            return booking.dateOptions.map(option => ({
                ...option,
                date: option.date, // Keep original for processing
                displayDate: formatDateForDisplay(option.date)
            }));
        }

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
                    displayDate: formatDateForDisplay(date),
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
                <div className="app-bar flex items-center justify-between px-4 py-3">
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
                                    {Math.ceil((selectedOffer.house.sqft || selectedOffer.house.size || 1500) / 500)} hours
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
                                <p className="font-medium text-gray-900">{selectedOffer.house.sqft || selectedOffer.house.size || 1500} sqft</p>
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
                                                <p className="font-bold text-gray-900">{option.displayDate || option.date}</p>
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
            <div className="bg-black text-white px-6 pt-6 pb-6 rounded-b-[2rem] shadow-xl relative z-20">
                {/* Toggle */}
                <div className="flex bg-gray-800 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setViewMode('available')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'available'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Available
                    </button>
                    <button
                        onClick={() => setViewMode('upcoming')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'upcoming'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Upcoming
                    </button>
                </div>

                {viewMode === 'available' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Available Jobs</h1>
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
                    </>
                )}
            </div>

            {viewMode === 'available' ? (
                <>
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
                            filteredOffers.map(offer => {
                                const dateOptions = getDateOptions(offer.booking);
                                const estimatedHours = Math.ceil((offer.house.sqft || offer.house.size || 1500) / 500);
                                const addOns = offer.booking.addOnIds || [];
                                const hasPets = (offer.house.pets?.hasPets) || (offer.house.petInfo && offer.house.petInfo !== 'No pets');

                                return (
                                    <div
                                        key={offer.id}
                                        onClick={() => handleViewDetails(offer)}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer relative group"
                                    >
                                        {/* Top Gradient Bar with Service Type */}
                                        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm">
                                                    {(offer.booking.serviceTypeId || 'regular').replace('-', ' ')}
                                                </span>
                                                {offer.matchScore >= 75 && (
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${offer.matchScore >= 100
                                                        ? 'bg-purple-500/30 text-purple-200'
                                                        : 'bg-green-500/30 text-green-200'
                                                        }`}>
                                                        ⭐ {offer.matchScore}% match
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (offer.booking.dates?.length === 1) {
                                                        handleAcceptOffer(offer, dateOptions[0]);
                                                    } else { handleViewDetails(offer); }
                                                }}
                                                className="bg-secondary-600 hover:bg-secondary-700 text-white text-[10px] font-bold tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-lg shadow-secondary-500/30 animate-pulse"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Accept Job
                                            </button>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Earnings & Urgency Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-gray-900">${offer.earnings}</span>
                                                    <span className="text-xs font-medium text-gray-400">earn</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-orange-600 text-xs font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 animate-pulse">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {offer.expiresIn}m left
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Schedule & Duration */}
                                            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                        <Calendar className="w-5 h-5 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{dateOptions[0]?.displayDate || dateOptions[0]?.date}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{dateOptions[0]?.timeSlot} slot</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">~{estimatedHours} hrs</p>
                                                    <p className="text-xs text-gray-500">Est. duration</p>
                                                </div>
                                            </div>

                                            {/* Location Card */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{offer.house.address.street}</p>
                                                    <p className="text-sm text-gray-500">{offer.house.address.city}, {offer.house.address.state} {offer.house.address.zip || offer.house.address.zipcode}</p>
                                                    <p className="text-xs text-teal-600 font-semibold mt-1">{offer.distance} miles away</p>
                                                </div>
                                            </div>

                                            {/* Property Details Grid */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                                    <p className="text-lg font-bold text-gray-900">{offer.house.sqft || offer.house.size || 1500}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">sq ft</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                                    <p className="text-lg font-bold text-gray-900">{offer.house.bedrooms}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">beds</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                                    <p className="text-lg font-bold text-gray-900">{offer.house.bathrooms}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">baths</p>
                                                </div>
                                            </div>

                                            {/* Add-ons */}
                                            {addOns.length > 0 && (
                                                <div className="border-t border-gray-100 pt-3">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Includes Add-ons</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {addOns.map((addon, idx) => (
                                                            <span key={idx} className="bg-teal-50 text-teal-700 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize">
                                                                {addon.replace(/-/g, ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Alerts Row */}
                                            <div className="flex flex-wrap gap-2">
                                                {hasPets && (
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100">
                                                        🐾 Pets in home
                                                    </span>
                                                )}
                                                {offer.booking.specialNotes && (
                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                                        📝 Has instructions
                                                    </span>
                                                )}
                                            </div>

                                            {/* Special Notes Preview */}
                                            {offer.booking.specialNotes && (
                                                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Special Instructions</p>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{offer.booking.specialNotes}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeclineOffer(offer); }}
                                                    className="flex-1 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl py-3.5 hover:bg-gray-200 transition-colors"
                                                >
                                                    Not Interested
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (offer.booking.dates?.length === 1) {
                                                            const options = getDateOptions(offer.booking);
                                                            handleAcceptOffer(offer, options[0]);
                                                        } else { handleViewDetails(offer); }
                                                    }}
                                                    className="flex-[1.5] bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm rounded-xl py-3.5 shadow-lg shadow-teal-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Accept Job
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="mt-4">
                    <UpcomingJobs embedded={true} onViewJob={onViewUpcomingJob} />
                </div>
            )}
        </div>
    );
}
