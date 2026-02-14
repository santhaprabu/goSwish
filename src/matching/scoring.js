/**
 * Scoring & Ranking System
 * Ranks eligible cleaners from best to worst match (0-100 points)
 */

import { queryDocs, COLLECTIONS } from '../storage/db.js';
import {
    calculateEarningsPerMile,
    getHoursUntil,
    getDayOfWeek,
    getTimeSlot,
    getConfidenceAdjustedRating,
    clamp,
    logMatchingEvent,
} from './utils.js';
import { toLocalDateString } from '../utils/dateUtils.js';

/**
 * Score and rank all eligible cleaners
 * @param {Array} eligibleCleaners - Cleaners who passed eligibility
 * @param {Object} booking - The booking to match
 * @param {Object} house - Customer's house
 * @returns {Promise<Array>} Ranked cleaners with scores
 */
export const scoreAndRankCleaners = async (eligibleCleaners, booking, house) => {
    console.log(`📊 Scoring ${eligibleCleaners.length} eligible cleaners...`);

    const scoredCleaners = [];

    for (const cleaner of eligibleCleaners) {
        const score = await calculateMatchScore(cleaner, booking, house);
        scoredCleaners.push({
            ...cleaner,
            matchScore: score.total,
            scoreBreakdown: score.breakdown,
        });
    }

    // Sort by score (highest first)
    scoredCleaners.sort((a, b) => b.matchScore - a.matchScore);

    // Add rank
    scoredCleaners.forEach((cleaner, index) => {
        cleaner.rank = index + 1;
    });

    // Log top 10
    console.log('🏆 Top 10 ranked cleaners:');
    scoredCleaners.slice(0, 10).forEach(c => {
        console.log(`  #${c.rank}: ${c.name} - ${c.matchScore.toFixed(1)} pts (${c.distance} mi)`);
    });

    // Log scoring results
    await logMatchingEvent(booking.id, 'scored', {
        totalScored: scoredCleaners.length,
        topScore: scoredCleaners[0]?.matchScore,
        averageScore: scoredCleaners.reduce((sum, c) => sum + c.matchScore, 0) / scoredCleaners.length,
        topCleaners: scoredCleaners.slice(0, 5).map(c => ({
            id: c.id,
            name: c.name,
            score: c.matchScore,
            rank: c.rank,
        })),
    });

    return scoredCleaners;
};

/**
 * Calculate match score for a single cleaner
 * @param {Object} cleaner
 * @param {Object} booking
 * @param {Object} house
 * @returns {Promise<Object>} Score object with total and breakdown
 */
export const calculateMatchScore = async (cleaner, booking, house) => {
    const breakdown = {};

    // FACTOR 1: Distance (25 points max)
    breakdown.distance = calculateDistanceScore(cleaner.distance, cleaner.serviceRadius || 15);

    // FACTOR 2: Acceptance Probability (20 points max)
    breakdown.acceptanceProbability = await calculateAcceptanceProbability(cleaner, booking);

    // FACTOR 3: Rating (20 points max)
    breakdown.rating = calculateRatingScore(cleaner.stats);

    // FACTOR 4: Availability Match Quality (15 points max)
    breakdown.availability = calculateAvailabilityScore(cleaner, booking.dateOptions);

    // FACTOR 5: Historical Performance in Area (10 points max)
    breakdown.areaPerformance = await calculateAreaPerformance(cleaner, house);

    // FACTOR 6: Real-time Engagement (5 points max)
    breakdown.engagement = calculateEngagementScore(cleaner.lastActiveAt);

    // FACTOR 7: Complementary Scheduling (5 points max)
    breakdown.scheduling = await calculateSchedulingScore(cleaner, booking, house);

    // Calculate total
    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    return {
        total: Math.round(total * 10) / 10,
        breakdown,
    };
};

/**
 * FACTOR 1: Distance Score (25 points max)
 * Closer cleaners score higher
 */
export const calculateDistanceScore = (distance, maxRadius = 15) => {
    const score = 25 * (1 - (distance / maxRadius));
    return Math.max(0, Math.round(score * 10) / 10);
};

/**
 * FACTOR 2: Acceptance Probability (20 points max)
 * Predict likelihood of cleaner accepting the offer
 */
export const calculateAcceptanceProbability = async (cleaner, booking) => {
    let probability = 0.5; // Start with 50% base probability

    const earnings = booking.pricingBreakdown?.total || 100;
    const distance = cleaner.distance;
    const earningsPerMile = calculateEarningsPerMile(earnings, distance);
    const hoursUntil = getHoursUntil(booking.dateOptions[0]?.date);

    // Distance factor
    if (distance < 5) probability += 0.2;
    else if (distance > 15) probability -= 0.15;

    // Earnings factor
    if (earningsPerMile > 30) probability += 0.15;
    else if (earningsPerMile < 15) probability -= 0.1;

    // Urgency factor
    if (hoursUntil > 48) probability += 0.1;
    else if (hoursUntil < 6) probability -= 0.1;

    // Historical acceptance rate
    if (cleaner.stats?.acceptanceRate > 0.8) probability += 0.1;
    else if (cleaner.stats?.acceptanceRate < 0.5) probability -= 0.15;

    // Service type specialty
    if (cleaner.specialties && cleaner.specialties.some(s =>
        s.toLowerCase().includes(booking.serviceType.toLowerCase())
    )) {
        probability += 0.15;
    }

    // Current workload
    const upcomingJobs = cleaner.upcomingJobs?.length || 0;
    if (upcomingJobs < 2) probability += 0.1;
    else if (upcomingJobs > 5) probability -= 0.2;

    // Clamp between 0 and 1
    probability = clamp(probability, 0, 1);

    // Convert to score (0-20 points)
    return Math.round(probability * 20 * 10) / 10;
};

/**
 * FACTOR 3: Rating Score (20 points max)
 * Higher-rated cleaners score better
 */
export const calculateRatingScore = (stats) => {
    if (!stats || !stats.rating) {
        return 10; // Neutral score for new cleaners
    }

    const totalReviews = stats.totalReviews || 0;
    const rating = stats.rating;

    // Apply confidence adjustment for cleaners with few reviews
    const adjustedRating = getConfidenceAdjustedRating(rating, totalReviews, 5);

    // Convert to score (0-20 points)
    const score = (adjustedRating / 5.0) * 20;

    return Math.round(score * 10) / 10;
};

/**
 * FACTOR 4: Availability Match Quality (15 points max)
 * Rewards cleaners who match multiple date options
 */
export const calculateAvailabilityScore = (cleaner, dateOptions) => {
    let score = 0;
    let matchedDates = 0;

    dateOptions.forEach((option, index) => {
        const dayOfWeek = getDayOfWeek(option.date);
        const timeSlot = option.timeSlot || getTimeSlot(option.date);

        if (!cleaner.availability || !cleaner.availability[dayOfWeek]) {
            return;
        }

        const dayAvailability = cleaner.availability[dayOfWeek];
        let isAvailable = false;

        if (typeof dayAvailability === 'object' && dayAvailability[timeSlot]) {
            isAvailable = true;
        } else if (Array.isArray(dayAvailability) && dayAvailability.length >= 2) {
            isAvailable = true;
        }

        if (isAvailable) {
            matchedDates++;

            // Points based on priority
            if (option.priority === 1 || index === 0) score += 5;
            else if (option.priority === 2 || index === 1) score += 3;
            else score += 2;
        }
    });

    // Bonus for matching all dates
    if (matchedDates === dateOptions.length) {
        score += 5;
    }

    return Math.min(15, Math.round(score * 10) / 10);
};

/**
 * FACTOR 5: Historical Performance in Area (10 points max)
 * Cleaners with good track record in this area score higher
 */
export const calculateAreaPerformance = async (cleaner, house) => {
    // Get cleaner's completed jobs
    const jobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleaner.id);

    // Filter to jobs near this house (within 5 miles)
    const nearbyJobs = jobs.filter(job => {
        if (!job.houseLocation || !house.location) return false;

        // Simplified distance check (you'd use actual distance calculation)
        return true; // In production, calculate actual distance
    });

    if (nearbyJobs.length === 0) {
        return 5; // Neutral score for no history in area
    }

    // Calculate average rating in this area
    const ratingsInArea = nearbyJobs
        .filter(j => j.rating)
        .map(j => j.rating);

    const areaRating = ratingsInArea.length > 0
        ? ratingsInArea.reduce((sum, r) => sum + r, 0) / ratingsInArea.length
        : cleaner.stats?.rating || 2.5;

    // Calculate completion rate in area
    const completedInArea = nearbyJobs.filter(j => j.status === 'completed').length;
    const completionRate = completedInArea / nearbyJobs.length;

    // Rating component (6 points max)
    const ratingScore = (areaRating / 5.0) * 6;

    // Completion component (4 points max)
    const completionScore = completionRate * 4;

    return Math.round((ratingScore + completionScore) * 10) / 10;
};

/**
 * FACTOR 6: Real-time Engagement (5 points max)
 * Recently active cleaners score higher
 */
export const calculateEngagementScore = (lastActiveAt) => {
    if (!lastActiveAt) return 0;

    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const minutesAgo = (now - lastActive) / (1000 * 60);

    if (minutesAgo < 5) return 5;
    if (minutesAgo < 30) return 3;
    if (minutesAgo < 60) return 1;
    return 0;
};

/**
 * FACTOR 7: Complementary Scheduling (5 points max)
 * Jobs that fit well with existing schedule score higher
 */
export const calculateSchedulingScore = async (cleaner, booking, house) => {
    let score = 3; // Neutral base

    // Get cleaner's jobs on the same day
    const jobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleaner.id);

    const sameDayJobs = jobs.filter(job => {
        if (!job.startTime) return false;

        return booking.dateOptions.some(option => {
            // Use toLocalDateString for timezone-safe date comparison
            const jobDateStr = toLocalDateString(job.startTime);
            const optionDateStr = toLocalDateString(option.date);
            return jobDateStr === optionDateStr;
        });
    });

    // Bonus for jobs nearby on same day (efficient routing)
    const nearbyJobs = sameDayJobs.filter(job => {
        // In production, calculate actual distance
        return true; // Simplified
    });

    if (nearbyJobs.length > 0 && nearbyJobs.length < 3) {
        score += Math.min(2, nearbyJobs.length);
    }

    // Penalty for too many jobs same day
    if (sameDayJobs.length >= 3) {
        score -= 2;
    }

    return Math.max(0, Math.min(5, score));
};

/**
 * Get detailed score explanation for debugging
 * @param {Object} cleaner
 * @param {Object} booking
 * @param {Object} house
 * @returns {Promise<Object>}
 */
export const getScoreExplanation = async (cleaner, booking, house) => {
    const score = await calculateMatchScore(cleaner, booking, house);

    return {
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        totalScore: score.total,
        breakdown: score.breakdown,
        explanation: {
            distance: `${cleaner.distance} mi away`,
            rating: `${cleaner.stats?.rating || 'N/A'} stars (${cleaner.stats?.totalReviews || 0} reviews)`,
            acceptanceRate: `${((cleaner.stats?.acceptanceRate || 0) * 100).toFixed(0)}% historical acceptance`,
            availability: 'Matches customer dates',
            engagement: cleaner.lastActiveAt ? `Last active ${new Date(cleaner.lastActiveAt).toLocaleString()}` : 'Unknown',
        },
    };
};
