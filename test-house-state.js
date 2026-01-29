/**
 * Test script to verify house state codes and booking ID generation
 * Run this in the browser console when logged in as a homeowner
 */

async function testHouseStateAndBooking() {
    console.log('🧪 Starting House State & Booking ID Test\n');
    console.log('='.repeat(60));

    try {
        // Import storage functions
        const storage = await import('./src/storage/index.js');

        // Step 1: Check current houses in database
        console.log('\n📋 Step 1: Checking existing houses...');
        const houses = await storage.getDocs(storage.COLLECTIONS.HOUSES);
        console.log(`Found ${houses.length} houses in database`);

        // Analyze state codes
        const stateAnalysis = {
            valid: [],
            invalid: [],
            missing: []
        };

        houses.forEach(house => {
            const state = house?.address?.state;
            if (!state) {
                stateAnalysis.missing.push(house);
            } else if (state.length !== 2) {
                stateAnalysis.invalid.push(house);
            } else {
                stateAnalysis.valid.push(house);
            }
        });

        console.log('\n📊 Current State Analysis:');
        console.log(`✅ Valid (2-letter codes): ${stateAnalysis.valid.length}`);
        console.log(`⚠️  Invalid codes: ${stateAnalysis.invalid.length}`);
        console.log(`❌ Missing codes: ${stateAnalysis.missing.length}`);

        if (stateAnalysis.invalid.length > 0) {
            console.log('\n⚠️  Houses with invalid states:');
            console.table(stateAnalysis.invalid.map(h => ({
                Name: h.name,
                State: h.address?.state || 'NONE',
                Length: h.address?.state?.length || 0,
                City: h.address?.city
            })));
        }

        if (stateAnalysis.missing.length > 0) {
            console.log('\n❌ Houses missing states:');
            console.table(stateAnalysis.missing.map(h => ({
                Name: h.name,
                City: h.address?.city || 'N/A',
                Street: h.address?.street || 'N/A'
            })));
        }

        // Step 2: Test with the first house (or create a test one)
        console.log('\n📋 Step 2: Testing booking ID generation...');

        if (houses.length === 0) {
            console.error('❌ No houses found. Please add a house first.');
            return;
        }

        const testHouse = houses[0];
        console.log(`Using house: ${testHouse.name} (ID: ${testHouse.id})`);
        console.log(`Address state: "${testHouse.address?.state}" (length: ${testHouse.address?.state?.length || 0})`);

        // Test the booking number generation
        console.log('\n🔢 Testing generateBookingNumber function...');
        const testDate = new Date().toISOString();

        // Access the private function via import
        const helpers = await import('./src/storage/helpers.js');

        // Since generateBookingNumber is not exported, let's test the flow
        console.log('\n📝 Creating a test booking...');

        // Get current user
        const currentUser = await storage.getCurrentUser();
        if (!currentUser) {
            console.error('❌ No user logged in. Please sign in first.');
            return;
        }

        console.log(`Current user: ${currentUser.email}`);

        // Create a test booking
        const testBooking = await storage.createBooking(currentUser.uid, {
            houseId: testHouse.id,
            serviceTypeId: 'regular-cleaning',
            dates: [new Date().toISOString()],
            totalAmount: 100,
            specialNotes: 'TEST BOOKING - State Code Verification'
        });

        console.log('\n✅ Test booking created!');
        console.log(`Booking ID: ${testBooking.bookingId}`);
        console.log(`House used: ${testHouse.name}`);
        console.log(`House state: "${testHouse.address?.state}"`);

        // Analyze the booking ID
        const bookingIdParts = testBooking.bookingId.split('-');
        const stateFromBooking = bookingIdParts[0];

        console.log('\n📊 Booking ID Analysis:');
        console.log(`Full ID: ${testBooking.bookingId}`);
        console.log(`State code in ID: "${stateFromBooking}"`);
        console.log(`Expected state: "${testHouse.address?.state}"`);

        if (stateFromBooking === 'US') {
            console.error('\n❌ PROBLEM FOUND: Booking ID uses fallback "US" instead of house state!');
            console.error('This means the house state is either:');
            console.error('  1. Missing (null/undefined)');
            console.error('  2. Empty string');
            console.error('  3. Not normalized to 2 letters');
            console.error(`\nActual state in database: "${testHouse.address?.state}"`);
        } else if (stateFromBooking === testHouse.address?.state) {
            console.log('\n✅ SUCCESS: Booking ID correctly uses house state!');
        } else {
            console.warn('\n⚠️  WARNING: Booking ID state differs from house state');
            console.warn(`  Booking: "${stateFromBooking}"`);
            console.warn(`  House: "${testHouse.address?.state}"`);
        }

        // Clean up test booking
        console.log('\n🧹 Cleaning up test booking...');
        await storage.updateDoc(storage.COLLECTIONS.BOOKINGS, testBooking.id, {
            status: 'cancelled',
            specialNotes: 'TEST BOOKING - CANCELLED'
        });

        console.log('\n' + '='.repeat(60));
        console.log('🏁 Test Complete!');

        return {
            totalHouses: houses.length,
            validStates: stateAnalysis.valid.length,
            invalidStates: stateAnalysis.invalid.length,
            missingStates: stateAnalysis.missing.length,
            testBookingId: testBooking.bookingId,
            testHouseState: testHouse.address?.state,
            success: stateFromBooking !== 'US'
        };

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        console.error(error.stack);
        throw error;
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.testHouseStateAndBooking = testHouseStateAndBooking;
}

console.log('✅ Test script loaded!');
console.log('Run: testHouseStateAndBooking()');

export { testHouseStateAndBooking };
