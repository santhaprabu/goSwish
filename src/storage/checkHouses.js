/**
 * Database inspection script to check house state codes
 * Run in browser console: window.checkAllHouses()
 */

import { getDocs, COLLECTIONS } from './db.js';

export const checkAllHouses = async () => {
    try {
        console.log('🔍 Checking all houses in database...\n');

        const houses = await getDocs(COLLECTIONS.HOUSES);
        console.log(`Found ${houses.length} houses\n`);

        const results = {
            withState: [],
            missingState: [],
            invalidState: []
        };

        houses.forEach((house, index) => {
            const state = house?.address?.state;
            const houseInfo = {
                id: house.id,
                name: house.name || house.nickname,
                address: house.address,
                state: state
            };

            if (!state) {
                results.missingState.push(houseInfo);
                console.log(`❌ House ${index + 1}: ${houseInfo.name} - NO STATE`);
            } else if (state.length !== 2) {
                results.invalidState.push(houseInfo);
                console.log(`⚠️  House ${index + 1}: ${houseInfo.name} - Invalid state: "${state}" (length: ${state.length})`);
            } else {
                results.withState.push(houseInfo);
                console.log(`✅ House ${index + 1}: ${houseInfo.name} - State: ${state}`);
            }
        });

        console.log('\n📊 Summary:');
        console.log(`✅ With valid state (2 letters): ${results.withState.length}`);
        console.log(`⚠️  With invalid state: ${results.invalidState.length}`);
        console.log(`❌ Missing state: ${results.missingState.length}`);

        if (results.missingState.length > 0) {
            console.log('\n🚨 Houses missing state codes:');
            results.missingState.forEach(h => {
                console.log(`  - ${h.name} (${h.id})`);
                console.log(`    Full address:`, h.address);
            });
        }

        if (results.invalidState.length > 0) {
            console.log('\n🚨 Houses with invalid state codes:');
            results.invalidState.forEach(h => {
                console.log(`  - ${h.name} (${h.id}) - State: "${h.state}"`);
            });
        }

        return results;
    } catch (error) {
        console.error('❌ Error checking houses:', error);
        throw error;
    }
};

// Make available in browser console
if (typeof window !== 'undefined') {
    window.checkAllHouses = checkAllHouses;
}
