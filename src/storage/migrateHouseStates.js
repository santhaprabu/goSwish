/**
 * Migration script to normalize state codes in all house addresses
 * Run this once to fix existing houses in the database
 */

import { getDocs, updateDoc, COLLECTIONS } from './db.js';

/**
 * Normalize state name to 2-letter code
 */
const normalizeStateCode = (state) => {
    if (!state) return 'TX'; // Default to Texas (all seed data is TX)

    // If already 2 letters, return as is (uppercase)
    if (state.length === 2) return state.toUpperCase();

    // Map common state names to codes
    const stateMap = {
        'texas': 'TX', 'california': 'CA', 'new york': 'NY', 'florida': 'FL',
        'illinois': 'IL', 'pennsylvania': 'PA', 'ohio': 'OH', 'georgia': 'GA',
        'north carolina': 'NC', 'michigan': 'MI', 'new jersey': 'NJ', 'virginia': 'VA',
        'washington': 'WA', 'arizona': 'AZ', 'massachusetts': 'MA', 'tennessee': 'TN',
        'indiana': 'IN', 'missouri': 'MO', 'maryland': 'MD', 'wisconsin': 'WI',
        'colorado': 'CO', 'minnesota': 'MN', 'south carolina': 'SC', 'alabama': 'AL',
        'louisiana': 'LA', 'kentucky': 'KY', 'oregon': 'OR', 'oklahoma': 'OK',
        'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA', 'nevada': 'NV',
        'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS', 'new mexico': 'NM',
        'nebraska': 'NE', 'west virginia': 'WV', 'idaho': 'ID', 'hawaii': 'HI',
        'new hampshire': 'NH', 'maine': 'ME', 'montana': 'MT', 'rhode island': 'RI',
        'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND', 'alaska': 'AK',
        'vermont': 'VT', 'wyoming': 'WY'
    };

    const normalized = stateMap[state.toLowerCase()];
    return normalized || state.substring(0, 2).toUpperCase(); // Fallback to first 2 chars
};

/**
 * Migrate all houses to have normalized state codes
 */
export const migrateHouseStates = async () => {
    try {
        console.log('🏠 Starting house state migration...');

        // Get all houses
        const houses = await getDocs(COLLECTIONS.HOUSES);
        console.log(`Found ${houses.length} houses to check`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errors = 0;

        for (const house of houses) {
            try {
                const originalState = house.address?.state;

                if (!originalState) {
                    console.warn(`⚠️  House ${house.id} has no state, setting to US`);
                }

                const normalizedState = normalizeStateCode(originalState);

                // Only update if state changed
                if (originalState !== normalizedState) {
                    console.log(`📝 Updating house ${house.id}: "${originalState}" → "${normalizedState}"`);

                    await updateDoc(COLLECTIONS.HOUSES, house.id, {
                        address: {
                            ...house.address,
                            state: normalizedState
                        }
                    });

                    updatedCount++;
                } else {
                    console.log(`✓ House ${house.id} already has normalized state: "${normalizedState}"`);
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Error updating house ${house.id}:`, error);
                errors++;
            }
        }

        const summary = {
            total: houses.length,
            updated: updatedCount,
            skipped: skippedCount,
            errors: errors
        };

        console.log('✅ Migration complete!', summary);
        return summary;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Allow running from console
if (typeof window !== 'undefined') {
    window.migrateHouseStates = migrateHouseStates;
}
