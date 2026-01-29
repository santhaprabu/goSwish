import { useState, useEffect } from 'react';
import {
    MapPin, Navigation, Phone, MessageCircle, Clock,
    User, Car, Home, ChevronRight, Loader2
} from 'lucide-react';
import { getBookingWithTracking } from '../storage';

// Live Tracking - Customer view of cleaner en route
export default function LiveTracking({ booking, cleaner, onBack }) {
    const [cleanerLocation, setCleanerLocation] = useState({
        lat: 32.7767,
        lng: -96.7970
    });
    const [distance, setDistance] = useState(3.2); // miles
    const [eta, setEta] = useState(12); // minutes
    const [status, setStatus] = useState('on_the_way'); // on_the_way, arrived, in_progress
    const [loading, setLoading] = useState(true);

    // Poll for location updates
    useEffect(() => {
        let interval;

        const fetchLocation = async () => {
            try {
                const updatedBooking = await getBookingWithTracking(booking.id);
                if (updatedBooking?.tracking) {
                    const t = updatedBooking.tracking;
                    if (t.lat && t.lng) setCleanerLocation({ lat: t.lat, lng: t.lng });
                    if (t.distance !== undefined) setDistance(t.distance);
                    if (t.eta !== undefined) setEta(t.eta);
                    if (t.status) setStatus(t.status);
                } else {
                    // Start simulation if no real tracking data yet
                    // Only if we haven't received any data
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching tracking:", err);
            }
        };

        // Initial fetch
        fetchLocation();

        // Poll every 4 seconds
        if (status !== 'arrived') {
            interval = setInterval(fetchLocation, 4000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [booking.id, status]);

    const houseLocation = booking.house?.location || { lat: 32.7831, lng: -96.8067 };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold">
                    {status === 'arrived' ? 'Cleaner Arrived' : 'Track Cleaner'}
                </h1>
                <div className="w-10" />
            </div>

            {/* Booking ID */}
            {booking?.bookingId && (
                <div className="px-4 py-2 bg-white border-b border-gray-100">
                    <p className="text-xs text-center text-gray-500">
                        Booking: <span className="font-mono font-semibold text-gray-700">{booking.bookingId}</span>
                    </p>
                </div>
            )}

            {/* Map Placeholder */}
            <div className="relative h-80 bg-gradient-to-br from-primary-100 to-primary-200">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="w-16 h-16 text-primary-600 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-primary-900">Live Map View</p>
                        <p className="text-sm text-primary-700 mt-1">Real-time GPS tracking enabled</p>
                        {loading && <p className="text-xs text-primary-600 mt-2 flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Connecting...</p>}
                    </div>
                </div>

                {/* Status Overlay */}
                <div className="absolute top-4 left-4 right-4">
                    <div className="card p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center
                ${status === 'arrived' ? 'bg-success-100' : 'bg-primary-100'}`}
                            >
                                {status === 'arrived' ? (
                                    <Home className="w-6 h-6 text-success-600" />
                                ) : (
                                    <Car className="w-6 h-6 text-primary-600 animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    {status === 'arrived' ? 'Arrived at your home' : 'On the way'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {status === 'arrived'
                                        ? 'Your cleaner has arrived and will start shortly'
                                        : `${distance.toFixed(1)} miles away • ${eta} min`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* Cleaner Info */}
                <div className="card p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                            {cleaner.photoURL ? (
                                <img
                                    src={cleaner.photoURL}
                                    alt={cleaner.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-secondary-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{cleaner.name}</h3>
                            <p className="text-sm text-gray-500">{cleaner.headline || 'Professional Cleaner'}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-500">
                                    ⭐ {cleaner.rating || 5.0} • {cleaner.completedJobs || 0} jobs
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="btn btn-ghost flex items-center justify-center gap-2">
                            <Phone className="w-5 h-5" />
                            Call
                        </button>
                        <button className="btn btn-ghost flex items-center justify-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Message
                        </button>
                    </div>
                </div>

                {/* Trip Details */}
                {status !== 'arrived' && (
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Trip Details</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <Navigation className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Distance Remaining</p>
                                    <p className="font-semibold text-gray-900">{distance.toFixed(1)} miles</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estimated Arrival</p>
                                    <p className="font-semibold text-gray-900">{eta} minutes</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Destination</p>
                                    <p className="font-semibold text-gray-900">
                                        {booking.house?.address?.street}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Arrival Notice */}
                {status === 'arrived' && (
                    <div className="card p-6 bg-success-50 border-success-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Home className="w-8 h-8 text-success-600" />
                            </div>
                            <h3 className="font-bold text-success-900 text-lg mb-2">
                                {cleaner.name} has arrived!
                            </h3>
                            <p className="text-success-700 mb-4">
                                Your cleaner will start the job shortly. You'll receive a notification when they begin.
                            </p>
                        </div>
                    </div>
                )}

                {/* Service Details */}
                <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Service Details</h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Service Type</span>
                            <span className="font-medium text-gray-900 capitalize">
                                {booking.serviceType} Clean
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Scheduled Time</span>
                            <span className="font-medium text-gray-900 capitalize">
                                {booking.selectedDate?.timeSlot} ({booking.selectedDate?.startTime})
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Estimated Duration</span>
                            <span className="font-medium text-gray-900">
                                {booking.estimatedDuration || 3} hours
                            </span>
                        </div>
                    </div>
                </div>

                {/* Safety Info */}
                <div className="card p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-2">Safety & Trust</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>✓ Background check verified</p>
                        <p>✓ Identity confirmed</p>
                        <p>✓ GPS tracking enabled</p>
                        <p>✓ Insured and bonded</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
