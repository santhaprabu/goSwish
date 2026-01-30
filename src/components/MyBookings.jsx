import { useState, useEffect } from 'react';
import { Calendar, Clock, Home, Sparkles, MapPin, RefreshCw, Loader2, AlertCircle, MessageSquare, Star, X, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLLECTIONS, getDocs } from '../storage/db';
import { createReview } from '../storage';

export default function MyBookings({ onMessaging, onTrackJob }) {
    const { user, serviceTypes, addOns, startChat } = useApp();
    const [bookings, setBookings] = useState([]);
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [cleanerDetails, setCleanerDetails] = useState({});

    // Review State
    const [reviewingBooking, setReviewingBooking] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const loadData = async () => {
        try {
            setRefreshing(true);
            setError(null);

            console.log('🔄 Loading bookings for user:', user?.uid);

            // Get ALL bookings from database
            const allBookings = await getDocs(COLLECTIONS.BOOKINGS);

            // Filter bookings for current user
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
                const hasNumericKeys = Object.keys(booking).some(key => !isNaN(key));
                if (hasNumericKeys) {
                    const indices = Object.keys(booking).filter(key => !isNaN(key)).sort((a, b) => a - b);
                    const reconstructed = indices.map(i => booking[i]).join('');
                    if (reconstructed === user?.uid) {
                        return true;
                    }
                }
                return false;
            });

            // Get all houses for reference
            const allHouses = await getDocs(COLLECTIONS.HOUSES);
            const userHouses = allHouses.filter(h => h.userId === user?.uid);

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

    // Load cleaner details for bookings
    useEffect(() => {
        const fetchCleanerDetails = async () => {
            if (bookings.length === 0) return;

            const cleanerIds = [...new Set(bookings
                .filter(b => b.cleanerId)
                .map(b => b.cleanerId)
            )];

            if (cleanerIds.length === 0) return;

            const details = {};
            for (const cleanerId of cleanerIds) {
                try {
                    // First get cleaner doc to find userId
                    const cleanerDoc = await getDocs(COLLECTIONS.CLEANERS).then(docs =>
                        docs.find(c => c.id === cleanerId)
                    );

                    if (cleanerDoc && cleanerDoc.userId) {
                        // Then get user doc for name/photo
                        const userDoc = await getDocs(COLLECTIONS.USERS).then(docs =>
                            docs.find(u => u.uid === cleanerDoc.userId || u.id === cleanerDoc.userId)
                        );

                        if (userDoc) {
                            details[cleanerId] = {
                                name: userDoc.profile?.name || userDoc.name || 'Cleaner',
                                photo: userDoc.profile?.photoURL || userDoc.photoURL || null,
                                phone: userDoc.profile?.phone || userDoc.phone,
                                rating: cleanerDoc.stats?.rating || 5.0
                            };
                        }
                    }
                } catch (e) {
                    console.error('Error fetching cleaner details:', e);
                }
            }
            setCleanerDetails(prev => ({ ...prev, ...details }));
        };

        fetchCleanerDetails();
    }, [bookings]);

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user?.uid]);

    // Helper functions with safe fallbacks
    const getHouseName = (houseId) => {
        if (!houseId) return 'Property not specified';
        const house = houses.find(h => h.id === houseId);
        return house?.name || house?.address?.street || 'Unknown Property';
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
            'morning': '9 AM - 12 PM',
            'afternoon': '12 PM - 3 PM',
            'evening': '3 PM - 6 PM'
        };
        return slots[slotId] || slotId || 'Time not set';
    };

    const getStatusStyle = (status) => {
        const styles = {
            'booking-placed': 'bg-amber-100 text-amber-600 font-bold',
            'confirmed': 'bg-secondary-500 text-white font-bold',
            'on_the_way': 'bg-black text-white',
            'arrived': 'bg-black text-white',
            'in-progress': 'bg-black text-white',
            'completed': 'bg-gray-100 text-gray-400',
            'approved': 'bg-gray-100 text-gray-400',
            'completed_pending_approval': 'bg-secondary-100 text-secondary-700 font-bold',
            'cancelled': 'bg-red-50 text-red-500',
        };
        return styles[status] || 'bg-gray-100 text-gray-400';
    };

    const getStatusText = (status) => {
        if (!status) return 'Pending';
        if (status === 'booking-placed') return 'Booking Placed';
        if (status === 'completed_pending_approval') return 'Review Pending';
        if (status === 'approved') return 'Completed';
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ').replace(/_/g, ' ');
    };

    const handleSubmitReview = async () => {
        if (!reviewingBooking) return;
        setSubmittingReview(true);
        try {
            await createReview({
                customerId: user.uid,
                cleanerId: reviewingBooking.cleanerId,
                bookingId: reviewingBooking.id, // Link review to booking
                customerName: user.name || 'Customer',
                rating: reviewRating,
                comment: reviewComment,
                serviceType: getServiceName(reviewingBooking.serviceTypeId),
                tags: ['professional', 'punctual'] // Demo tags
            });
            // Ideally mark booking as reviewed locally or refresh
            alert('Review submitted! Thank you.');
            setReviewingBooking(null);
            setReviewComment('');
            setReviewRating(5);
        } catch (e) {
            console.error(e);
            alert('Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Review Modal
    const renderReviewModal = () => {
        if (!reviewingBooking) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={() => setReviewingBooking(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">Rate your experience</h3>
                    <p className="text-sm text-gray-500 mb-6">How was your cleaning with the professional?</p>

                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`w-10 h-10 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
                        placeholder="Write a review (optional)..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        );
    };

    // Sort bookings
    const sortedBookings = [...bookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <div className="px-6 pt-14 pb-6 flex items-center justify-between opacity-50">
                    <div className="w-10 h-10 rounded-full bg-gray-50"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-6 bg-gray-100 rounded-lg"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-secondary-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Bookings</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                    <div className="flex items-center justify-center">
                        <h1 className="text-lg font-bold">My Bookings</h1>
                    </div>
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
            <div className="min-h-screen bg-white flex flex-col pb-20">
                <div className="px-6 pt-14 pb-6 flex items-center justify-between">
                    <div className="w-10" />
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">Bookings</h1>
                        <div className="w-8 h-1 bg-secondary-500 rounded-full mt-1"></div>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={refreshing}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 border border-gray-100 active:scale-90 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-secondary-500' : ''}`} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8 border border-gray-100">
                        <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-widest">No Bookings</h2>
                    <p className="text-gray-400 font-medium mb-10 max-w-xs leading-relaxed">
                        You haven't booked any cleanings yet. Experience a spotless home today.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            {renderReviewModal()}

            {/* Header */}
            <div className="px-6 pt-14 pb-6 flex items-center justify-between">
                <div className="w-10" />
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">Bookings</h1>
                    <div className="w-8 h-1 bg-secondary-500 rounded-full mt-1"></div>
                </div>
                <button
                    onClick={loadData}
                    disabled={refreshing}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 border border-gray-100 active:scale-90 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-secondary-500' : ''}`} />
                </button>
            </div>

            {/* Bookings List */}
            <div className="px-6 space-y-4">
                {sortedBookings.map((booking, index) => {
                    const firstDate = booking.dates?.[0];
                    const timeSlot = firstDate && booking.timeSlots ? booking.timeSlots[firstDate]?.[0] : null;
                    const addOnsList = getAddOnNames(booking.addOnIds);

                    const handleMessageCleaner = async () => {
                        if (!booking.cleanerId) return;
                        try {
                            await startChat(booking.cleanerId);
                            onMessaging?.();
                        } catch (error) {
                            console.error('Error starting chat:', error);
                        }
                    };

                    return (
                        <div
                            key={booking.id || index}
                            className="bg-white rounded-[2rem] p-5 relative transition-all shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border border-gray-200"
                        >
                            {/* Card Header: Status & ID */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                                    #{booking.bookingId || booking.id?.slice(-6) || 'N/A'}
                                </span>
                            </div>

                            {/* Property Info */}
                            <div className="flex gap-4 items-center mb-4">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                                    <Home className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 text-base tracking-tight truncate">
                                        {getHouseName(booking.houseId)}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium truncate">
                                        {getHouseAddress(booking.houseId)}
                                    </p>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-2 border-t border-gray-50 pt-4 mb-4">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                    <Sparkles className="w-3.5 h-3.5 text-secondary-500" />
                                    <span>{getServiceName(booking.serviceTypeId)}</span>
                                    {addOnsList.length > 0 && (
                                        <span className="text-secondary-400 text-[9px]">+ {addOnsList.length} ADD-ONS</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{firstDate ? formatDate(firstDate) : 'TBD'}</span>
                                    <span className="text-gray-200">|</span>
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{timeSlot ? formatTimeSlot(timeSlot) : 'TBD'}</span>
                                </div>
                            </div>

                            {/* Card Footer: Amount & Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Total Price</span>
                                    <span className="text-xl font-black text-gray-900">
                                        ${typeof booking.totalAmount === 'number' ? booking.totalAmount.toFixed(2) : booking.totalAmount}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {booking.cleanerId && (
                                        <button
                                            onClick={handleMessageCleaner}
                                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                                            title="Message Cleaner"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    )}

                                    {['on_the_way', 'arrived', 'in_progress', 'completed_pending_approval'].includes(booking.status) && (
                                        <button
                                            onClick={() => onTrackJob?.(booking)}
                                            className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-md active:scale-95 transition-all"
                                        >
                                            {booking.status === 'completed_pending_approval' ? 'Review' : 'Track'}
                                        </button>
                                    )}

                                    {booking.status === 'completed' && (
                                        <button
                                            onClick={() => setReviewingBooking(booking)}
                                            className="bg-secondary-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-md active:scale-95 transition-all"
                                        >
                                            Rate Clean
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
