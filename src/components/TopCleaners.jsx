import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * TOP CLEANERS DISCOVERY
 * ============================================================================
 * 
 * Purpose:
 * Allows customers to browse and book highlighted cleaners in their area.
 * 
 * Logic:
 * - Queries cleaners collection.
 * - Filters by service radius (relative to customer's property).
 * - Sorts by Match Score (Distance + Rating + Availability).
 */
import {
    Users, MapPin, Star, ChevronLeft, ShieldCheck,
    Award, CheckCircle, Search, Filter, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDocs, COLLECTIONS, queryDocs } from '../storage/db';
import { calculateMatchScore } from '../storage/helpers';

export default function TopCleaners({ onBack }) {
    const { user } = useApp();
    const [cleaners, setCleaners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [house, setHouse] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopCleaners = async () => {
            if (!user?.uid) return;

            setLoading(true);
            try {
                // 1. Get user's houses to find area
                const houses = await queryDocs(COLLECTIONS.HOUSES, 'userId', user.uid);
                if (houses.length === 0) {
                    setError('Please add a property first to find cleaners in your area.');
                    setLoading(false);
                    return;
                }

                // Use default or first house
                const activeHouse = houses.find(h => h.isDefault) || houses[0];
                setHouse(activeHouse);

                // 2. Get all cleaners
                const allCleaners = await getDocs(COLLECTIONS.CLEANERS);

                // 3. Calculate match scores for the area
                // We'll simulate a 'regular clean' booking to get scores
                const simulatedBooking = {
                    serviceTypeId: 'regular',
                    houseId: activeHouse.id,
                    customerId: user.uid,
                    dates: []
                };

                const scoredCleaners = [];
                for (const cleaner of allCleaners) {
                    const match = await calculateMatchScore(simulatedBooking, cleaner, activeHouse);
                    if (match.isEligible) {
                        scoredCleaners.push({
                            ...cleaner,
                            matchScore: match.score,
                            distance: match.distance,
                            matchDescription: match.matchDescription
                        });
                    }
                }

                // 4. Sort and limit
                scoredCleaners.sort((a, b) => b.matchScore - a.matchScore);
                setCleaners(scoredCleaners.slice(0, 10)); // Top 10
            } catch (err) {
                console.error('Error fetching top cleaners:', err);
                setError('Failed to load cleaners. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTopCleaners();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">
                        Top Cleaners
                    </h1>
                </div>

                {house && (
                    <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <MapPin className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium">Area: {house.address.neighborhood}, {house.address.city}</span>
                    </div>
                )}
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Finding the best matches...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button
                            onClick={onBack}
                            className="btn btn-primary w-full"
                        >
                            Go Back
                        </button>
                    </div>
                ) : cleaners.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Cleaners Found</h2>
                        <p className="text-gray-500 px-10">We couldn't find any eligible cleaners in your immediate area right now.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">
                            {cleaners.length} Pro Cleaners Nearby
                        </p>

                        {cleaners.map((cleaner, index) => (
                            <div key={cleaner.id} className="card p-5 group hover:border-black transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    {/* Avatar/Photo */}
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-black transition-colors">
                                            {cleaner.photoURL ? (
                                                <img
                                                    src={cleaner.photoURL}
                                                    alt={cleaner.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-secondary-100 flex items-center justify-center">
                                                    <Users className="w-8 h-8 text-secondary-600" />
                                                </div>
                                            )}
                                        </div>
                                        {index < 3 && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                                <Award className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg truncate">
                                                {cleaner.name}
                                            </h3>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                <span className="text-sm font-bold">{cleaner.rating || '5.0'}</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-2 font-medium">
                                            {cleaner.headline || 'Professional Cleaning Partner'}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                                                <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100 uppercase">
                                                {cleaner.matchDescription || 'Strong Match'}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase">
                                                {cleaner.distance} mi away
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider & Quick Stats */}
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Experience</p>
                                            <p className="text-sm font-bold text-gray-900">{cleaner.yearsExperience || 0} years</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Jobs</p>
                                            <p className="text-sm font-bold text-gray-900">{cleaner.completedJobs || 0}+</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Top Rated</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
