/**
 * Eligibility Filtering
 * Filters cleaners who CAN perform the job (hard filters)
 */

import { getDocs, queryDocs, COLLECTIONS } from '../storage/db.js';
import {
    calculateDistance,
    getDayOfWeek,
    getTimeSlot,
    datesConflict,
    isOnboardingComplete,
    logMatchingEvent,
} from './utils.js';

/**
 * Find all eligible cleaners for a booking
 * @param {Object} booking - The booking to match
 * @param {Object} house - Customer's house details
 * @returns {Promise<Array>} Array of eligible cleaners with distance
 */
export const findEligibleCleaners = async (booking, house) => {
    console.log('🔍 Starting eligibility filtering...');

    const stats = {
        total: 0,
        afterVerification: 0,
        afterStatus: 0,
        afterOnboarding: 0,
        afterGeography: 0,
        afterAvailability: 0,
        afterServiceType: 0,
        afterConflicts: 0,
        final: 0,
    };

    // Get all cleaners
    const allCleaners = await getDocs(COLLECTIONS.CLEANERS);
    stats.total = allCleaners.length;
    console.log(`📊 Total cleaners in database: ${stats.total}`);

    let eligible = allCleaners;

    // FILTER 1: Verification Status
    eligible = eligible.filter(c => c.verificationStatus === 'approved');
    stats.afterVerification = eligible.length;
    console.log(`✅ After verification filter: ${stats.afterVerification}`);

    // FILTER 2: Account Status
    eligible = eligible.filter(c => c.status === 'active');
    stats.afterStatus = eligible.length;
    console.log(`✅ After status filter: ${stats.afterStatus}`);

    // FILTER 3: Onboarding Completion
    eligible = eligible.filter(c => isOnboardingComplete(c));
    stats.afterOnboarding = eligible.length;
    console.log(`✅ After onboarding filter: ${stats.afterOnboarding}`);

    // FILTER 4: Geographic Proximity
    if (!house.location || !house.location.latitude || !house.location.longitude) {
        console.error('❌ House location missing');
        return [];
    }

    eligible = eligible.map(cleaner => {
        if (!cleaner.baseLocation || !cleaner.baseLocation.latitude) {
            return { ...cleaner, distance: 999, eligible: false };
        }

        const distance = calculateDistance(
            cleaner.baseLocation.latitude,
            cleaner.baseLocation.longitude,
            house.location.latitude,
            house.location.longitude
        );

        const withinRadius = distance <= (cleaner.serviceRadius || 15);

        return {
            ...cleaner,
            distance,
            eligible: withinRadius,
        };
    }).filter(c => c.eligible);

    stats.afterGeography = eligible.length;
    console.log(`✅ After geography filter: ${stats.afterGeography}`);

    // FILTER 5: Availability Matching
    eligible = eligible.filter(cleaner => {
        return checkAvailability(cleaner, booking.dateOptions);
    });

    stats.afterAvailability = eligible.length;
    console.log(`✅ After availability filter: ${stats.afterAvailability}`);

    // FILTER 6: Service Type Capability
    eligible = eligible.filter(cleaner => {
        if (!cleaner.serviceTypes || !Array.isArray(cleaner.serviceTypes)) {
            return false;
        }
        return cleaner.serviceTypes.includes(booking.serviceType);
    });

    stats.afterServiceType = eligible.length;
    console.log(`✅ After service type filter: ${stats.afterServiceType}`);

    // FILTER 7: No Scheduling Conflicts
    const eligibleWithoutConflicts = [];

    for (const cleaner of eligible) {
        const hasConflict = await checkSchedulingConflicts(cleaner.id, booking.dateOptions);
        if (!hasConflict) {
            eligibleWithoutConflicts.push(cleaner);
        }
    }

    eligible = eligibleWithoutConflicts;
    stats.afterConflicts = eligible.length;
    stats.final = eligible.length;
    console.log(`✅ After conflict filter: ${stats.final}`);

    // Log the filtering results
    await logMatchingEvent(booking.id, 'eligible_found', stats);

    // Warning if too few cleaners
    if (stats.final < 5) {
        console.warn(`⚠️ Only ${stats.final} eligible cleaners found - may need to expand search`);
    }

    return eligible;
};

/**
 * Check if cleaner is available for at least one date option
 * @param {Object} cleaner
 * @param {Array} dateOptions - Customer's 3 date choices
 * @returns {boolean}
 */
export const checkAvailability = (cleaner, dateOptions) => {
    if (!cleaner.availability || !dateOptions || dateOptions.length === 0) {
        return false;
    }

    for (const option of dateOptions) {
        const dayOfWeek = getDayOfWeek(option.date);
        const timeSlot = option.timeSlot || getTimeSlot(option.date);

        // Check if cleaner has availability for this day
        if (!cleaner.availability[dayOfWeek]) {
            continue;
        }

        // Check if cleaner is available for this time slot
        const dayAvailability = cleaner.availability[dayOfWeek];

        // Handle different availability formats
        if (typeof dayAvailability === 'object') {
            // Format: { morning: true, afternoon: false, evening: true }
            if (dayAvailability[timeSlot] === true) {
                return true;
            }
        } else if (Array.isArray(dayAvailability)) {
            // Format: ["9:00 AM", "5:00 PM"] - available all day
            if (dayAvailability.length >= 2) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check for scheduling conflicts
 * @param {string} cleanerId
 * @param {Array} dateOptions
 * @returns {Promise<boolean>} True if conflict exists
 */
export const checkSchedulingConflicts = async (cleanerId, dateOptions) => {
    // Get cleaner's existing jobs
    const existingJobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);

    // Filter to only scheduled/confirmed jobs
    const activeJobs = existingJobs.filter(job =>
        ['scheduled', 'in_progress', 'confirmed'].includes(job.status)
    );

    // Check each date option for conflicts
    for (const option of dateOptions) {
        for (const job of activeJobs) {
            if (job.startTime && datesConflict(option.date, job.startTime)) {
                return true; // Conflict found
            }
        }
    }

    return false; // No conflicts
};

/**
 * Expand search radius if too few cleaners found
 * @param {Object} booking
 * @param {Object} house
 * @param {number} currentRadius
 * @returns {Promise<Array>}
 */
export const expandSearchRadius = async (booking, house, currentRadius = 15) => {
    console.log(`🔄 Expanding search radius from ${currentRadius} to ${currentRadius + 5} miles...`);

    // Temporarily increase service radius for all cleaners
    const allCleaners = await getDocs(COLLECTIONS.CLEANERS);

    const expandedCleaners = allCleaners.map(cleaner => ({
        ...cleaner,
        serviceRadius: currentRadius + 5,
    }));

    // Re-run eligibility with expanded radius
    // (This is a simplified version - in production, you'd modify the actual filtering)
    return findEligibleCleaners(booking, house);
};

/**
 * Get eligibility summary for debugging
 * @param {Object} cleaner
 * @param {Object} booking
 * @param {Object} house
 * @returns {Object} Summary of why cleaner is/isn't eligible
 */
export const getEligibilitySummary = async (cleaner, booking, house) => {
    const summary = {
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        eligible: true,
        reasons: [],
    };

    // Check each filter
    if (cleaner.verificationStatus !== 'approved') {
        summary.eligible = false;
        summary.reasons.push(`Verification: ${cleaner.verificationStatus}`);
    }

    if (cleaner.status !== 'active') {
        summary.eligible = false;
        summary.reasons.push(`Status: ${cleaner.status}`);
    }

    if (!isOnboardingComplete(cleaner)) {
        summary.eligible = false;
        summary.reasons.push('Onboarding incomplete');
    }

    if (cleaner.baseLocation && house.location) {
        const distance = calculateDistance(
            cleaner.baseLocation.latitude,
            cleaner.baseLocation.longitude,
            house.location.latitude,
            house.location.longitude
        );

        if (distance > (cleaner.serviceRadius || 15)) {
            summary.eligible = false;
            summary.reasons.push(`Too far: ${distance} mi > ${cleaner.serviceRadius} mi`);
        } else {
            summary.reasons.push(`Distance: ${distance} mi`);
        }
    }

    if (!checkAvailability(cleaner, booking.dateOptions)) {
        summary.eligible = false;
        summary.reasons.push('Not available on requested dates');
    }

    if (!cleaner.serviceTypes || !cleaner.serviceTypes.includes(booking.serviceType)) {
        summary.eligible = false;
        summary.reasons.push(`Cannot perform ${booking.serviceType}`);
    }

    const hasConflict = await checkSchedulingConflicts(cleaner.id, booking.dateOptions);
    if (hasConflict) {
        summary.eligible = false;
        summary.reasons.push('Scheduling conflict');
    }

    return summary;
};
