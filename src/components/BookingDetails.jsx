import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * BOOKING DETAILS VIEW
 * ============================================================================
 * 
 * Purpose:
 * The single source of truth for a specific booking.
 * 
 * Data Aggregation:
 * This component fetches and combines data from 3 sources:
 * 1. Booking Record (Status, Price, Time)
 * 2. House Record (Address, Access Info)
 * 3. User Record (Cleaner Profiles, Customer info)
 * 
 * It handles the display logic for all 10+ status states of a job.
 */
/**
 * ============================================================================
 * BOOKING DETAILS VIEW
 * ============================================================================
 * 
 * Purpose:
 * The single source of truth for a specific booking.
 * 
 * Data Aggregation:
 * This component fetches and combines data from 3 sources:
 * 1. Booking Record (Status, Price, Time)
 * 2. House Record (Address, Access Info)
 * 3. User Record (Cleaner Profiles, Customer info)
 * 
 * It handles the display logic for all 10+ status states of a job.
 */
import {
    ChevronRight, Calendar, Clock, Home, Sparkles, MapPin,
    User, Phone, MessageSquare, DollarSign, CheckCircle,
    AlertCircle, Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLLECTIONS, getDocs, getDoc } from '../storage/db';

export default function BookingDetails({ booking, onBack, onMessage, onTrack }) {
    const { serviceTypes, addOns, settings } = useApp();
    const [house, setHouse] = useState(null);
    const [cleaner, setCleanerInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                // Load house details
                if (booking.houseId) {
                    const houseDoc = await getDoc(COLLECTIONS.HOUSES, booking.houseId);
                    setHouse(houseDoc);
                }

                // Load cleaner details
                if (booking.cleanerId) {
                    const cleanerDoc = await getDoc(COLLECTIONS.CLEANERS, booking.cleanerId);
                    if (cleanerDoc?.userId) {
                        const userDoc = await getDocs(COLLECTIONS.USERS).then(docs =>
                            docs.find(u => u.uid === cleanerDoc.userId || u.id === cleanerDoc.userId)
                        );
                        if (userDoc) {
                            setCleanerInfo({
                                name: userDoc.profile?.name || userDoc.name || 'Cleaner',
                                photo: userDoc.profile?.photoURL || userDoc.photoURL,
                                phone: userDoc.profile?.phone || userDoc.phone,
                                rating: cleanerDoc.stats?.rating || 5.0
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading booking details:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDetails();
    }, [booking]);

    const getServiceName = (serviceId) => {
        if (!serviceId) return 'Service not specified';
        const service = serviceTypes?.find(s => s.id === serviceId);
        return service?.name || serviceId;
    };

    const getAddOnNames = (addOnIds) => {
        if (!addOnIds || !Array.isArray(addOnIds) || addOnIds.length === 0) return [];
        return addOnIds
            .map(id => {
                const addOn = addOns?.find(a => a.id === id);
                return addOn?.name;
            })
            .filter(Boolean);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date not set';
        try {
            const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatTimeSlot = (slotId) => {
        const slots = {
            'morning': '9:00 AM - 12:00 PM',
            'afternoon': '12:00 PM - 3:00 PM',
            'evening': '3:00 PM - 6:00 PM'
        };
        return slots[slotId] || slotId || 'Time not set';
    };

    const getStatusStyle = (status) => {
        const styles = {
            'booking-placed': 'bg-amber-100 text-amber-700',
            'confirmed': 'bg-green-100 text-green-700',
            'matched': 'bg-green-100 text-green-700',
            'scheduled': 'bg-blue-100 text-blue-700',
            'on_the_way': 'bg-blue-100 text-blue-700',
            'arrived': 'bg-purple-100 text-purple-700',
            'in_progress': 'bg-indigo-100 text-indigo-700',
            'completed': 'bg-gray-100 text-gray-600',
            'approved': 'bg-gray-100 text-gray-600',
            'completed_pending_approval': 'bg-orange-100 text-orange-700',
            'cancelled': 'bg-red-100 text-red-600',
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    const getStatusText = (status) => {
        if (!status) return 'Pending';
        const statusMap = {
            'booking-placed': 'Booking Placed',
            'confirmed': 'Confirmed',
            'matched': 'Cleaner Matched',
            'scheduled': 'Scheduled',
            'on_the_way': 'Cleaner On The Way',
            'arrived': 'Cleaner Arrived',
            'in_progress': 'Cleaning In Progress',
            'completed': 'Completed',
            'approved': 'Completed',
            'completed_pending_approval': 'Pending Your Approval',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/-|_/g, ' ');
    };

    const firstDate = booking.dates?.[0];
    const timeSlot = firstDate && booking.timeSlots ? booking.timeSlots[firstDate]?.[0] : null;
    const addOnsList = getAddOnNames(booking.addOnIds);
    const isTrackable = ['on_the_way', 'arrived', 'in_progress', 'completed_pending_approval'].includes(booking.status);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="app-bar">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="flex-1 text-center text-lg font-semibold">Booking Details</h1>
                <div className="w-10" />
            </div>

            <div className="px-6 py-4 space-y-4">
                {/* Status Card */}
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusStyle(booking.status)}`}>
                            {getStatusText(booking.status)}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                            {booking.bookingId || `#${booking.id?.slice(-8)}`}
                        </span>
                    </div>
                    {isTrackable && (
                        <button
                            onClick={() => onTrack?.(booking)}
                            className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-4 h-4" />
                            {booking.status === 'completed_pending_approval' ? 'Review & Approve' : 'Track Cleaner'}
                        </button>
                    )}
                </div>

                {/* Property Details */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Property</h3>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Home className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">
                                {house?.name || house?.nickname || 'Property'}
                            </p>
                            {house?.address && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {house.address.street}, {house.address.city}, {house.address.state} {house.address.zip || house.address.zipcode}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Schedule</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="font-semibold text-gray-900">{formatDate(firstDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Time Slot</p>
                                <p className="font-semibold text-gray-900">{formatTimeSlot(timeSlot)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Details */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Service</h3>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{getServiceName(booking.serviceTypeId)}</p>
                            <p className="text-xs text-gray-500">Cleaning Service</p>
                        </div>
                    </div>
                    {addOnsList.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                            <p className="text-xs text-gray-500 mb-2">Add-ons</p>
                            <div className="flex flex-wrap gap-2">
                                {addOnsList.map((addon, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                                        {addon}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cleaner Details */}
                {booking.cleanerId && (
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Cleaner</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {cleaner?.photo ? (
                                    <img src={cleaner.photo} alt={cleaner.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-secondary-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{cleaner?.name || 'Assigned Cleaner'}</p>
                                {cleaner?.rating && (
                                    <p className="text-sm text-gray-500">Rating: {cleaner.rating.toFixed(1)} / 5.0</p>
                                )}
                            </div>
                            <button
                                onClick={() => onMessage?.(booking)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <MessageSquare className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h3>
                    {(() => {
                        // Use stored breakdown if available, otherwise recalculate
                        const breakdown = booking.pricingBreakdown;
                        const sqft = house?.squareFeet || house?.sqft || 1500;
                        const service = serviceTypes?.find(s => s.id === (booking.serviceTypeId || booking.serviceType));

                        const servicePrice = breakdown?.base ?? (
                            service?.rate ? Math.ceil((service.rate * sqft) / 10) * 10 : (service?.basePrice || 0)
                        );

                        const addonItems = breakdown?.addOnDetails ?
                            breakdown.addOnDetails.map(a => ({ name: a.name, price: a.price })) :
                            (booking.addOnIds || []).map(id => {
                                const addon = addOns?.find(a => a.id === id);
                                if (!addon) return null;
                                const price = addon.rate ? Math.ceil((addon.rate * sqft) / 10) * 10 : (addon.price || 0);
                                return { name: addon.name, price };
                            }).filter(Boolean);

                        const addonsTotal = breakdown?.addOns ??
                            Math.round(addonItems.reduce((sum, item) => sum + item.price, 0) * 100) / 100;

                        const subtotal = breakdown?.subtotal ??
                            Math.round((servicePrice + addonsTotal) * 100) / 100;

                        const total = typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;

                        const taxRate = settings?.taxRate || 0.0825;
                        const actualTax = breakdown?.taxes ?? Math.round((subtotal * taxRate) * 100) / 100;

                        // Any remaining difference is platform/service fees
                        const serviceFees = Math.round((total - subtotal - actualTax) * 100) / 100;
                        const taxes = actualTax;

                        return (
                            <div className="space-y-2">
                                {/* Service */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{getServiceName(booking.serviceTypeId)}</span>
                                    <span className="font-medium">${servicePrice.toFixed(2)}</span>
                                </div>

                                {/* Add-ons */}
                                {addonItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.name}</span>
                                        <span className="font-medium">+${item.price.toFixed(2)}</span>
                                    </div>
                                ))}

                                {/* Taxes */}
                                {taxes > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Taxes ({(taxRate * 100).toFixed(1)}%)</span>
                                        <span className="font-medium">${taxes.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Service Fees (for legacy/adjustments) */}
                                {serviceFees !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service Fees</span>
                                        <span className="font-medium">${serviceFees.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Discount */}
                                {booking.discount && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount {booking.discount.code && `(${booking.discount.code})`}</span>
                                        <span>-${typeof booking.discount.value === 'number' ? booking.discount.value.toFixed(2) : booking.discount}</span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t border-gray-100 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="font-bold text-xl text-gray-900">
                                            ${typeof booking.totalAmount === 'number' ? booking.totalAmount.toFixed(2) : booking.totalAmount || '0.00'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Payment: {booking.paymentMethod === 'card' ? 'Credit/Debit Card' : booking.paymentMethod || 'Card'}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Special Instructions */}
                {booking.specialInstructions && (
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Special Instructions</h3>
                        <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
                    </div>
                )}

                {/* Booking Timeline */}
                <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Booking Created</p>
                                <p className="text-xs text-gray-500">
                                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        {booking.matchedAt && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Cleaner Assigned</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.matchedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                        {booking.jobStartedAt && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Cleaning Started</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.jobStartedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                        {booking.completedAt && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Cleaning Completed</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.completedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
