import { useState, useEffect } from 'react';
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

// Job Offers - Available Jobs for Cleaners
import UpcomingJobs from './UpcomingJobs';

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

                    // Earnings estimate (70% of total)
                    const amount = booking.totalAmount || 100;
                    const earnings = amount * 0.7;

                    // Expiry logic (mock)
                    const expiresIn = Math.floor(Math.random() * 30) + 10;

                    offersData.push({
                        id: booking.id,
                        bookingId: booking.id,
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
            // Switch to upcoming view?
            // setViewMode('upcoming');
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
                            filteredOffers.map(offer => (
                                <div
                                    key={offer.id}
                                    onClick={() => handleViewDetails(offer)}
                                    className="bg-white rounded-[1rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
                                >
                                    <div className="h-1 w-full bg-gradient-to-r from-gray-900 to-gray-700"></div>

                                    <div className="p-3">
                                        {/* Top Header: Pay & Time */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-gray-900 leading-none">${offer.earnings}</span>
                                                    <span className="text-[10px] font-medium text-gray-400">est.</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{getDateOptions(offer.booking)[0]?.date.split('-').slice(1).join('/')} • {getDateOptions(offer.booking)[0]?.timeSlot}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className="inline-flex items-center gap-1 text-red-500 text-[9px] font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {offer.expiresIn}m
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    ID: {offer.bookingId.slice(-4).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Secondary Info: Badges & Proximity */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                                {(offer.booking.serviceTypeId || 'regular')}
                                            </span>
                                            {offer.matchScore >= 75 && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${offer.matchScore > 100 ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                    {offer.matchScore}% MATCH
                                                </span>
                                            )}
                                            <span className="text-gray-400 text-[10px] flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {offer.distance} mi • {offer.house.address.city}
                                            </span>
                                        </div>

                                        {/* Property & Note Row (Combined) */}
                                        <div className="flex items-center justify-between text-[10px] text-gray-500 py-1.5 border-t border-gray-50">
                                            <div className="flex gap-2 font-medium">
                                                <span>{offer.house.bedrooms}b/{offer.house.bathrooms}ba</span>
                                                <span>•</span>
                                                <span>{offer.house.sqft} sqft</span>
                                            </div>
                                            {offer.booking.specialNotes && (
                                                <div className="max-w-[120px] truncate italic text-gray-400 text-[9px]">
                                                    "{offer.booking.specialNotes}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Compact Actions */}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeclineOffer(offer); }}
                                                className="flex-1 bg-white text-gray-400 font-bold text-[10px] rounded-lg py-1.5 border border-gray-100 hover:bg-gray-50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (offer.booking.dates?.length === 1) {
                                                        const options = getDateOptions(offer.booking);
                                                        handleAcceptOffer(offer, options[0]);
                                                    } else { handleViewDetails(offer); }
                                                }}
                                                className="flex-[1.8] bg-black text-white font-bold text-[10px] rounded-lg py-1.5 shadow-sm active:scale-95 transition-all uppercase tracking-wider"
                                            >
                                                Accept Job
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
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
