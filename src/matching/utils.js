/**
 * Matching Algorithm Utilities
 * Helper functions for distance calculation, scoring, and matching logic
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Get day of week from date
 * @param {Date|string} date
 * @returns {string} 'monday', 'tuesday', etc.
 */
export const getDayOfWeek = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const d = new Date(date);
    return days[d.getDay()];
};

/**
 * Get time slot from date
 * @param {Date|string} date
 * @returns {string} 'morning', 'afternoon', or 'evening'
 */
export const getTimeSlot = (date) => {
    const d = new Date(date);
    const hour = d.getHours();

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
};

/**
 * Calculate hours until a date
 * @param {Date|string} date
 * @returns {number} Hours from now
 */
export const getHoursUntil = (date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    return Math.max(0, diff / (1000 * 60 * 60));
};

/**
 * Check if two dates conflict (same day)
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
export const datesConflict = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

/**
 * Calculate cleaner earnings from booking
 * @param {number} customerTotal - Total customer paid
 * @param {number} platformFee - Platform fee percentage (0-1)
 * @param {number} incentiveBoost - Additional incentive amount
 * @returns {number} Cleaner earnings
 */
export const calculateEarnings = (customerTotal, platformFee = 0.25, incentiveBoost = 0) => {
    const baseEarnings = customerTotal * (1 - platformFee);
    return Math.round((baseEarnings + incentiveBoost) * 100) / 100;
};

/**
 * Calculate earnings per mile
 * @param {number} earnings
 * @param {number} distance
 * @returns {number}
 */
export const calculateEarningsPerMile = (earnings, distance) => {
    if (distance === 0) return earnings;
    return Math.round((earnings / distance) * 100) / 100;
};

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Generate unique offer ID
 * @returns {string}
 */
export const generateOfferId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `offer-${timestamp}-${random}`;
};

/**
 * Format date for display
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

/**
 * Calculate estimated job duration
 * @param {string} serviceType
 * @param {number} sqft
 * @param {number} bedrooms
 * @param {number} bathrooms
 * @param {Array} addOns
 * @returns {number} Duration in hours
 */
export const calculateDuration = (serviceType, sqft, bedrooms, bathrooms, addOns = []) => {
    let baseHours = 0;

    // Base time by service type
    switch (serviceType) {
        case 'regular':
            baseHours = 2;
            break;
        case 'deep':
            baseHours = 3;
            break;
        case 'move':
            baseHours = 4;
            break;
        case 'windows':
            baseHours = 1.5;
            break;
        default:
            baseHours = 2;
    }

    // Add time for size
    const sqftHours = Math.floor(sqft / 1000) * 0.5;

    // Add time for rooms
    const roomHours = (bedrooms * 0.3) + (bathrooms * 0.25);

    // Add time for add-ons
    const addOnHours = addOns.length * 0.25;

    const totalHours = baseHours + sqftHours + roomHours + addOnHours;

    return Math.round(totalHours * 2) / 2; // Round to nearest 0.5
};

/**
 * Check if cleaner's onboarding is complete
 * @param {Object} cleaner
 * @returns {boolean}
 */
export const isOnboardingComplete = (cleaner) => {
    if (!cleaner.onboardingStatus) return false;

    return (
        cleaner.onboardingStatus.profileComplete &&
        cleaner.onboardingStatus.photoUploaded &&
        cleaner.onboardingStatus.locationSet &&
        cleaner.onboardingStatus.availabilitySet &&
        cleaner.onboardingStatus.backgroundCheckComplete &&
        cleaner.onboardingStatus.bankConnected
    );
};

/**
 * Get confidence-adjusted rating
 * @param {number} rating - Average rating
 * @param {number} totalReviews - Number of reviews
 * @param {number} minReviews - Minimum reviews for full confidence
 * @returns {number} Adjusted rating
 */
export const getConfidenceAdjustedRating = (rating, totalReviews, minReviews = 5) => {
    if (totalReviews >= minReviews) return rating;

    const confidence = totalReviews / minReviews;
    const neutralRating = 2.5;

    return (rating * confidence) + (neutralRating * (1 - confidence));
};

/**
 * Calculate market condition from ratio
 * @param {number} ratio - availableCleaners / unmatchedBookings
 * @returns {string} 'oversupply', 'balanced', 'tight', or 'undersupply'
 */
export const getMarketCondition = (ratio) => {
    if (ratio > 3.0) return 'oversupply';
    if (ratio >= 1.5) return 'balanced';
    if (ratio >= 0.7) return 'tight';
    return 'undersupply';
};

/**
 * Calculate surge multiplier from market condition
 * @param {number} ratio
 * @returns {number} Multiplier (1.0 - 2.0)
 */
export const getSurgeMultiplier = (ratio) => {
    if (ratio >= 0.7) return 1.0; // No surge
    if (ratio >= 0.5) return 1.2; // 20% increase
    if (ratio >= 0.3) return 1.5; // 50% increase
    return 2.0; // 100% increase (capped)
};

/**
 * Log matching event
 * @param {string} bookingId
 * @param {string} eventType
 * @param {Object} metadata
 */
export const logMatchingEvent = async (bookingId, eventType, metadata = {}) => {
    const event = {
        bookingId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata,
    };

    console.log(`[MATCHING EVENT] ${eventType}:`, event);

    // In production, save to analytics collection
    // await addDoc(COLLECTIONS.ANALYTICS, event);

    return event;
};
