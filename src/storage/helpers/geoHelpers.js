/**
 * ============================================================================
 * GEOLOCATION & PROXIMITY UTILITIES
 * ============================================================================
 *
 * Handles distance calculations and travel time estimates.
 *
 * @module storage/helpers/geoHelpers
 */

/**
 * Calculate straight-line distance between two points (Haversine Formula)
 * @param {Object} loc1 - First location {lat, lng}
 * @param {Object} loc2 - Second location {lat, lng}
 * @returns {number} Distance in miles
 */
export const calculateGeoDistance = (loc1, loc2) => {
    if (!loc1?.lat || !loc1?.lng || !loc2?.lat || !loc2?.lng) return 999;

    // Same coordinate check
    if (loc1.lat === loc2.lat && loc1.lng === loc2.lng) return 0;

    const R = 3959; // Earth's radius in miles
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Estimate road distance and travel time
 * Straight line is multiplied by a "Road Curvature Factor" (typically 1.3 - 1.4)
 * @param {Object} loc1 - First location {lat, lng}
 * @param {Object} loc2 - Second location {lat, lng}
 * @returns {Object} { airMiles, roadMiles, travelMinutes }
 */
export const calculateTravelEstimate = (loc1, loc2) => {
    const airMiles = calculateGeoDistance(loc1, loc2);

    // Industry standard: Road distance is approx 30% longer than air distance
    const roadMiles = airMiles * 1.3;

    // Average city speed estimate: 25-30 mph (including lights/traffic)
    // 30 mph = 0.5 miles per minute => 2 minutes per mile
    const travelMinutes = roadMiles * 2.2;

    return {
        airMiles: Math.round(airMiles * 10) / 10,
        roadMiles: Math.round(roadMiles * 10) / 10,
        travelMinutes: Math.round(travelMinutes)
    };
};
