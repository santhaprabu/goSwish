import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    getCleanerReviewsWithStats,
    addReviewResponse,
    getCleanerByUserId
} from '../storage';
import {
    Star, ChevronRight, TrendingUp, TrendingDown, Calendar,
    Filter, ThumbsUp, Award, MessageSquare, User, ChevronLeft, Loader
} from 'lucide-react';

// Calculate stats from reviews
const calculateStats = (reviews) => {
    if (!reviews || reviews.length === 0) {
        return {
            totalReviews: 0,
            avgRating: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            last30DaysAvg: 0,
            trend: 'up',
            topTags: []
        };
    }

    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => distribution[r.rating]++);

    const recentReviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt || r.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return reviewDate >= thirtyDaysAgo;
    });

    const last30DaysAvg = recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
        : avgRating;

    // Extract all tags and count
    const tagCounts = {};
    reviews.forEach(r => {
        (r.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

    return {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution,
        last30DaysAvg: Math.round(last30DaysAvg * 10) / 10,
        trend: last30DaysAvg >= avgRating ? 'up' : 'down',
        topTags
    };
};

export default function CleanerRatings({ onBack }) {
    const { user } = useApp();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
    const [selectedReview, setSelectedReview] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load reviews from database
    useEffect(() => {
        const loadReviews = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                // Get cleaner profile
                const cleanerProfile = await getCleanerByUserId(user.uid);
                if (cleanerProfile) {
                    const { reviews: reviewsList, stats: reviewStats } = await getCleanerReviewsWithStats(cleanerProfile.id);
                    setReviews(reviewsList || []);
                    setStats(reviewStats);
                } else {
                    setReviews([]);
                    setStats(calculateStats([]));
                }
            } catch (error) {
                console.error('Error loading reviews:', error);
                setStats(calculateStats([]));
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, [user?.uid]);

    // Calculate stats if not loaded from DB
    const displayStats = stats || calculateStats(reviews);

    const filteredReviews = filter === 'all'
        ? reviews
        : reviews.filter(r => r.rating === parseInt(filter));

    const renderStars = (rating, size = 'small') => {
        const sizeClass = size === 'large' ? 'w-6 h-6' : 'w-4 h-4';
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        className={`${sizeClass} ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    const handleSubmitResponse = async () => {
        if (!responseText.trim() || !selectedReview) return;

        try {
            setSubmitting(true);
            await addReviewResponse(selectedReview.id, responseText);

            // Update local state
            setReviews(prev => prev.map(r =>
                r.id === selectedReview.id
                    ? { ...r, response: responseText, responseDate: new Date().toISOString() }
                    : r
            ));

            setResponseText('');
            setSelectedReview(null);
        } catch (error) {
            console.error('Error submitting response:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Review Detail Modal
    if (selectedReview) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setSelectedReview(null)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Review Details</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Customer & Rating */}
                    <div className="card p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                                {selectedReview.customerPhoto ? (
                                    <img src={selectedReview.customerPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-7 h-7 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{selectedReview.customerName}</h3>
                                <p className="text-sm text-gray-500">{selectedReview.date}</p>
                                <div className="mt-2">{renderStars(selectedReview.rating, 'large')}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-gray-700">{selectedReview.comment}</p>

                            {selectedReview.tags && selectedReview.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedReview.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-secondary-50 text-secondary-700 text-xs rounded-full capitalize">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{selectedReview.helpful} found helpful</span>
                            </div>
                            <span>•</span>
                            <span>{selectedReview.serviceType}</span>
                        </div>
                    </div>

                    {/* Existing Response */}
                    {selectedReview.response && (
                        <div className="card p-6 bg-secondary-50 border-secondary-200">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-secondary-600" />
                                <span className="font-medium text-secondary-900">Your Response</span>
                            </div>
                            <p className="text-sm text-secondary-700">{selectedReview.response}</p>
                        </div>
                    )}

                    {/* Add Response */}
                    {!selectedReview.response && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Reply to this review</h3>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Thank the customer and address any feedback..."
                                className="input min-h-[120px] resize-none"
                                maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-400">{responseText.length}/500</span>
                                <button
                                    onClick={handleSubmitResponse}
                                    disabled={!responseText.trim()}
                                    className="btn btn-secondary"
                                >
                                    Submit Response
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar flex items-center justify-between px-4 py-3">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Ratings & Reviews</h1>
                <div className="w-10" />
            </div>

            {/* Overall Rating Card */}
            <div className="bg-black text-white px-6 py-8 rounded-b-[1.5rem] shadow-xl relative z-10">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-5xl font-bold tracking-tight">{Number(displayStats.avgRating).toFixed(1)}</p>
                        <div className="flex gap-1 mt-2 justify-center">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`w-4 h-4 ${i <= Math.round(displayStats.avgRating) ? 'fill-white text-white' : 'text-gray-700'}`} />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">{displayStats.totalReviews} reviews</p>
                    </div>

                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                            const count = displayStats.distribution[rating];
                            const percentage = displayStats.totalReviews > 0 ? (count / displayStats.totalReviews) * 100 : 0;
                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <span className="text-xs w-3 text-gray-400 font-medium">{rating}</span>
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs w-6 text-right text-gray-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Trend & Badges */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-4 flex items-center gap-3">
                        {displayStats.trend === 'up' ? (
                            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-success-600" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-warning-600" />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{displayStats.last30DaysAvg}</p>
                            <p className="text-xs text-gray-500">Last 30 days</p>
                        </div>
                    </div>

                    <div className="card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Top Rated</p>
                            <p className="text-xs text-gray-500">Top 10% cleaners</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Tags */}
            {displayStats.topTags && displayStats.topTags.length > 0 && (
                <div className="px-6 py-4 bg-white border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">What customers love</h3>
                    <div className="flex flex-wrap gap-2">
                        {displayStats.topTags.map(({ tag, count }) => (
                            <span key={tag} className="px-3 py-1.5 bg-secondary-50 text-secondary-700 rounded-full text-sm capitalize">
                                {tag} ({count})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="px-6 py-3 bg-white border-b border-gray-100">
                <div className="flex gap-2 overflow-x-auto">
                    {['all', '5', '4', '3', '2', '1'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1
                                ${filter === f
                                    ? 'bg-secondary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {f === 'all' ? 'All' : (
                                <>
                                    {f}
                                    <Star className={`w-3 h-3 ${filter === f ? '' : 'text-yellow-400 fill-current'}`} />
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="px-6 py-4 space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-12">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-900">No reviews with this rating</p>
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <button
                            key={review.id}
                            onClick={() => setSelectedReview(review)}
                            className="card w-full text-left hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                                        <span className="text-xs text-gray-500">{review.date}</span>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{review.comment}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{review.serviceType}</span>
                                <div className="flex items-center gap-4">
                                    {review.response && (
                                        <span className="flex items-center gap-1 text-secondary-600">
                                            <MessageSquare className="w-3 h-3" />
                                            Replied
                                        </span>
                                    )}
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
