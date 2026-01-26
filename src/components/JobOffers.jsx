import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    DollarSign, MapPin, Clock, Calendar, Home, User,
    Check, X, ChevronRight, AlertCircle, TrendingUp
} from 'lucide-react';

// Job Offers - Available Jobs for Cleaners
export default function JobOffers() {
    const { user, bookings, getUserHouses, findEligibleCleaners } = useApp();
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [sortBy, setSortBy] = useState('earnings'); // earnings, distance, expiring
    const [filter, setFilter] = useState('all');

    // Simulate job offers
    useEffect(() => {
        // Find bookings that need cleaners
        const availableBookings = bookings.filter(b =>
            b.status === 'confirmed' && !b.cleanerId
        );

        // Create mock offers
        const mockOffers = availableBookings.map(booking => {
            const house = getUserHouses().find(h => h.id === booking.houseId);
            const distance = Math.random() * 20 + 2; // 2-22 miles
            const earnings = booking.pricingBreakdown.total * 0.7; // 70% to cleaner
            const expiresIn = Math.floor(Math.random() * 15) + 1; // 1-15 minutes

            return {
                id: `offer-${booking.id}`,
                bookingId: booking.id,
                booking,
                house,
                earnings: Math.round(earnings),
                distance: Math.round(distance * 10) / 10,
                expiresAt: new Date(Date.now() + expiresIn * 60 * 1000),
                expiresIn,
                status: 'sent',
                createdAt: new Date()
            };
        });

        setOffers(mockOffers);
    }, [bookings, getUserHouses]);

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
        return offer.booking.serviceType === filter;
    });

    const handleViewDetails = (offer) => {
        setSelectedOffer(offer);
    };

    const handleAcceptOffer = (offer, selectedDate) => {
        // Simulate accepting offer
        console.log('Accepting offer:', offer.id, 'for date:', selectedDate);
        // In real app: call Cloud Function to lock booking and assign cleaner
        setSelectedOffer(null);
        setOffers(prev => prev.filter(o => o.id !== offer.id));
    };

    const handleDeclineOffer = (offer) => {
        setOffers(prev => prev.filter(o => o.id !== offer.id));
        setSelectedOffer(null);
    };

    // Offer Details Modal
    if (selectedOffer) {
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
                                    {selectedOffer.booking.serviceType.replace('-', ' ')}
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
                                    {selectedOffer.booking.pricingBreakdown.estimatedDuration || 3} hours
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
                            Customer provided 3 date options. Select the one that works best for you.
                        </p>

                        <div className="space-y-3">
                            {selectedOffer.booking.dateOptions.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAcceptOffer(selectedOffer, option)}
                                    className="w-full card p-4 hover:shadow-md transition-all text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                {index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice'}
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
                    {selectedOffer.booking.addOns && selectedOffer.booking.addOns.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Add-on Services</h3>
                            <div className="space-y-2">
                                {selectedOffer.booking.addOns.map((addon, index) => (
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
                {filteredOffers.length === 0 ? (
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
                                            {offer.booking.serviceType.replace('-', ' ')}
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
                                    <span>{offer.booking.dateOptions[0].date}</span>
                                    <span className="text-gray-400">+2 more options</span>
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
