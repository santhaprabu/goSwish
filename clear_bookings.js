/**
 * Clear All Booking Data Script
 *
 * Run this in browser console at http://localhost:5174
 * Or import and run from the app
 */

const DB_NAME = 'GoSwishDB';
const DB_VERSION = 5;

const COLLECTIONS_TO_CLEAR = [
    'bookings',
    'jobs',
    'reviews',
    'messages',
    'notifications'
];

async function clearBookingData() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = async () => {
            const db = request.result;

            console.log('🧹 Clearing booking data...');

            for (const collection of COLLECTIONS_TO_CLEAR) {
                try {
                    const transaction = db.transaction([collection], 'readwrite');
                    const store = transaction.objectStore(collection);

                    await new Promise((res, rej) => {
                        const clearRequest = store.clear();
                        clearRequest.onsuccess = () => {
                            console.log(`  ✅ Cleared: ${collection}`);
                            res();
                        };
                        clearRequest.onerror = () => rej(clearRequest.error);
                    });
                } catch (err) {
                    console.warn(`  ⚠️ Could not clear ${collection}:`, err.message);
                }
            }

            console.log('');
            console.log('✨ All booking data cleared!');
            console.log('🔄 Refresh the page to see changes.');

            resolve();
        };
    });
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    clearBookingData()
        .then(() => console.log('Done!'))
        .catch(err => console.error('Error:', err));
}

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = { clearBookingData };
}
