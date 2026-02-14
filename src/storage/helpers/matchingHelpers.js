/**
 * ============================================================================
 * CLEANER MATCHING OPERATIONS
 * ============================================================================
 *
 * Handles cleaner-to-booking matching with scoring algorithms.
 *
 * @module storage/helpers/matchingHelpers
 */

import { COLLECTIONS, setDoc, getDoc, getDocs, generateId } from '../db.js';
import { METRO_AREAS } from './constants.js';
import { calculateTravelEstimate } from './geoHelpers.js';

// Lazy imports
let getCustomerBookings, checkCleanerConflict, getAppSettings;
const loadDependencies = async () => {
    if (!getCustomerBookings) {
        const bookingHelpers = await import('./bookingHelpers.js');
        getCustomerBookings = bookingHelpers.getCustomerBookings;
    }
    if (!checkCleanerConflict) {
        const cleanerHelpers = await import('./cleanerHelpers.js');
        checkCleanerConflict = cleanerHelpers.checkCleanerConflict;
    }
    if (!getAppSettings) {
        const serviceHelpers = await import('./serviceHelpers.js');
        getAppSettings = serviceHelpers.getAppSettings;
    }
};

/**
 * Calculate match score between a cleaner and a booking
 * @param {Object} booking - Booking object
 * @param {Object} cleaner - Cleaner profile object
 * @param {Object} house - House object (optional, will be fetched if null)
 * @param {Object} customer - Customer object (optional)
 * @param {Set} previousCleaners - Set of cleaner IDs who have worked for this customer
 * @returns {Promise<Object>} { score, matchDescription, distance, isEligible, error? }
 */
export const calculateMatchScore = async (booking, cleaner, house = null, customer = null, previousCleaners = null) => {
    await loadDependencies();

    try {
        // Fetch missing data
        if (!house && booking.houseId) {
            house = await getDoc(COLLECTIONS.HOUSES, booking.houseId);
        }
        if (!house) {
            return { score: 0, isEligible: false, error: 'House not found' };
        }

        if (!customer && booking.customerId) {
            customer = await getDoc(COLLECTIONS.USERS, booking.customerId);
        }

        if (previousCleaners === null && booking.customerId) {
            const previousBookings = await getCustomerBookings(booking.customerId);
            previousCleaners = new Set(
                previousBookings
                    .filter(b => b.status === 'completed' && b.cleanerId)
                    .map(b => b.cleanerId)
            );
        }

        // Base Filters (Hard Constraints)
        if (cleaner.status !== 'active') {
            return { score: 0, isEligible: false };
        }

        // City Boundary Check
        if (cleaner.baseLocation?.city && house.address?.city) {
            if (cleaner.baseLocation.city !== house.address.city) {
                const cleanerMetro = METRO_AREAS[cleaner.baseLocation.city];
                const houseMetro = METRO_AREAS[house.address.city];

                if (cleanerMetro && houseMetro && cleanerMetro !== houseMetro) {
                    return { score: 0, isEligible: false, error: 'Wrong Metro Area' };
                }
            }
        }

        // Service support
        const supportsService = !booking.serviceTypeId ||
            (cleaner.serviceTypes && cleaner.serviceTypes.includes(booking.serviceTypeId));
        if (!supportsService) {
            return { score: 0, isEligible: false };
        }

        // Distance & Travel estimation
        const travel = calculateTravelEstimate(cleaner.baseLocation, house.address);
        const distance = travel.airMiles;

        if (distance > (cleaner.serviceRadius || 25)) {
            return { score: 0, isEligible: false, distance, error: 'Outside Service Radius' };
        }

        // Availability check
        const isBusy = await checkCleanerConflict(cleaner.id, booking.dates || [], booking.timeSlots || {});
        if (isBusy) {
            return { score: 0, isEligible: false, distance, error: 'Busy' };
        }

        // Pet compatibility
        const houseHasPets = (house.pets && house.pets.hasPets) ||
            (house.petInfo && house.petInfo !== 'No pets');

        if (houseHasPets && cleaner.petFriendly === false) {
            return { score: 0, isEligible: false, distance, error: 'Pets' };
        }

        // SCORING LOGIC
        let score = 50; // Base score

        // 1. Relationship Score (Highest priority)
        if (previousCleaners?.has(cleaner.id)) score += 50;

        // 2. Proximity Score
        if (distance < 5) score += 20;
        else if (distance < 10) score += 10;

        // 3. Rating Score
        if (cleaner.rating >= 4.8) score += 20;
        else if (cleaner.rating >= 4.5) score += 10;

        // 4. Experience Score
        if (cleaner.yearsExperience >= 5) score += 10;

        // 5. Reliability
        if (cleaner.stats?.reliabilityScore > 95) score += 10;

        const matchDescription = score > 100 ? 'Premier Match' : score > 75 ? 'Highly Recommended' : 'Strong Match';

        return {
            score,
            matchDescription,
            distance: Math.round(distance * 10) / 10,
            isEligible: true
        };
    } catch (e) {
        console.error('Error calculating match score:', e);
        return { score: 0, isEligible: false };
    }
};

/**
 * Broadcast new job to eligible cleaners
 * @param {Object} booking - Booking object to broadcast
 * @returns {Promise<void>}
 */
export const broadcastNewJob = async (booking) => {
    await loadDependencies();

    try {
        console.log('Matching cleaners for broadcasting:', booking.id);

        const [house, settings] = await Promise.all([
            getDoc(COLLECTIONS.HOUSES, booking.houseId),
            getAppSettings()
        ]);
        if (!house) return;

        const earningsRate = settings?.cleanerEarningsRate || 0.90;

        const previousBookings = await getCustomerBookings(booking.customerId);
        const previousCleaners = new Set(
            previousBookings
                .filter(b => b.status === 'completed' && b.cleanerId)
                .map(b => b.cleanerId)
        );

        const cleaners = await getDocs(COLLECTIONS.CLEANERS);
        const eligibleMatches = [];

        for (const cleaner of cleaners) {
            const match = await calculateMatchScore(booking, cleaner, house, null, previousCleaners);
            if (match.isEligible) {
                eligibleMatches.push({ cleaner, ...match });
            }
        }

        // Sort by score
        eligibleMatches.sort((a, b) => b.score - a.score);
        const topMatches = eligibleMatches.slice(0, 15);

        console.log(`Broadcasting to top ${topMatches.length} matches`);

        const createPromises = topMatches.map(({ cleaner, score, matchDescription }) => {
            const baseAmount = booking.pricingBreakdown?.subtotal || booking.totalAmount || 0;
            const earnings = Math.round(baseAmount * earningsRate);
            const notif = {
                id: generateId('notification'),
                userId: cleaner.userId,
                type: 'job_offer',
                title: 'New Match: ' + matchDescription,
                message: `New ${booking.serviceTypeId} job near you ($${earnings}). Match score: ${score}%`,
                relatedId: booking.id,
                read: false,
                createdAt: new Date().toISOString()
            };
            return setDoc(COLLECTIONS.NOTIFICATIONS, notif.id, notif);
        });

        await Promise.all(createPromises);

    } catch (e) {
        console.error('Error broadcasting job:', e);
    }
};
