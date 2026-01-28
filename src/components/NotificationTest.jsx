
import { useState } from 'react';
import {
    generateId,
    setDoc,
    COLLECTIONS,
    broadcastNewJob,
    getUserNotifications,
    addDoc,
    getDocs
} from '../storage';

export default function NotificationTest() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        setLoading(true);
        setResults(null);
        try {
            const logs = [];
            const log = (msg) => logs.push(msg);

            log("🚀 Starting Notification Test...");

            // 1. Setup Test Data
            const timestamp = Date.now();

            // Cleaners
            const cleanerNear = {
                id: `test_c_near_${timestamp}`,
                userId: `user_near_${timestamp}`,
                status: 'active',
                name: 'Cleaner Near',
                baseLocation: { lat: 32.7767, lng: -96.7970 }, // Dallas
                serviceRadius: 25
            };

            const cleanerFar = {
                id: `test_c_far_${timestamp}`,
                userId: `user_far_${timestamp}`,
                status: 'active',
                name: 'Cleaner Far',
                baseLocation: { lat: 30.2672, lng: -97.7431 }, // Austin (~200mi away)
                serviceRadius: 25
            };

            const cleanerNoLoc = {
                id: `test_c_noloc_${timestamp}`,
                userId: `user_noloc_${timestamp}`,
                status: 'active',
                name: 'Cleaner No Loc',
                baseLocation: null, // No location
                serviceRadius: 25
            };

            log("📝 Creating test cleaners...");
            await setDoc(COLLECTIONS.CLEANERS, cleanerNear.id, cleanerNear);
            await setDoc(COLLECTIONS.CLEANERS, cleanerFar.id, cleanerFar);
            await setDoc(COLLECTIONS.CLEANERS, cleanerNoLoc.id, cleanerNoLoc);

            // House (in Dallas)
            const house = {
                id: `test_house_${timestamp}`,
                address: { lat: 32.7767, lng: -96.7970, city: 'Dallas', street: 'Test St' }
            };
            await setDoc(COLLECTIONS.HOUSES, house.id, house);

            // Booking
            const booking = {
                id: `test_booking_${timestamp}`,
                houseId: house.id,
                serviceTypeId: 'deep-clean',
                totalAmount: 200,
                status: 'confirmed'
            };

            // 2. Run Broadcast
            log("📡 Broadcasting Job...");
            await broadcastNewJob(booking);

            // 3. Verify
            log("🔍 Verifying results...");

            // Check alerts
            const getAlerts = async (userId) => {
                const notifs = await getDocs(COLLECTIONS.NOTIFICATIONS);
                return notifs.filter(n => n.userId === userId && n.type === 'job_offer' && n.relatedId === booking.id);
            };

            const nearAlerts = await getAlerts(cleanerNear.userId);
            const farAlerts = await getAlerts(cleanerFar.userId);
            const noLocAlerts = await getAlerts(cleanerNoLoc.userId);

            const testResults = {
                near: { expected: true, actual: nearAlerts.length > 0, name: cleanerNear.name },
                far: { expected: false, actual: farAlerts.length > 0, name: cleanerFar.name },
                noLoc: { expected: true, actual: noLocAlerts.length > 0, name: cleanerNoLoc.name }
            };

            log(`✅ Cleaner Near (Dallas): ${testResults.near.actual ? 'RECEIVED (Pass)' : 'MISSED (Fail)'}`);
            log(`✅ Cleaner Far (Austin): ${testResults.far.actual ? 'RECEIVED (Fail)' : 'SKIPPED (Pass)'}`);
            log(`✅ Cleaner NoLoc: ${testResults.noLoc.actual ? 'RECEIVED (Pass)' : 'MISSED (Fail)'}`);

            setResults({ logs, tests: testResults });

            // Cleanup (optional, keeping for inspection)
            // ...

        } catch (e) {
            console.error(e);
            setResults({ error: e.message, logs: [] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Notification Distribution Test</h2>
            <div className="card p-6 bg-white shadow-sm rounded-xl border border-gray-200">
                <p className="mb-4 text-gray-600">
                    This test simulates 3 cleaners (Near, Far, No Location) and verifies that
                    geofencing logic correctly distributes the job broadcast.
                </p>

                <button
                    onClick={runTest}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Running Test...' : 'Run Test Scenario'}
                </button>

                {results && (
                    <div className="mt-6 space-y-4">
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            {results.logs?.map((l, i) => <div key={i}>{l}</div>)}
                        </div>

                        {results.tests && (
                            <div className="grid gap-3">
                                {Object.values(results.tests).map(t => (
                                    <div key={t.name} className={`p-3 rounded-lg border-l-4 ${t.expected === t.actual ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                        <div className="font-bold">{t.name}</div>
                                        <div className="text-sm">
                                            Expected: {t.expected ? 'Receive' : 'Skip'} •
                                            Actual: {t.actual ? 'Received' : 'Skipped'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
