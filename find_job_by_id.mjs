
import { getDocs, COLLECTIONS } from './src/storage/db.js';
import { initializeDatabase } from './src/storage/initDatabase.js';

async function findJob() {
    await initializeDatabase();

    const jobId = 'TX-2026-0206-20269';
    console.log(`Searching for job ID: ${jobId}`);

    // Try JOBS collection
    const jobs = await getDocs(COLLECTIONS.JOBS);
    const jobInJobs = jobs.find(j => j.id === jobId || j.bookingId === jobId || (j.metadata && j.metadata.transactionId === jobId));

    if (jobInJobs) {
        console.log('--- FOUND IN JOBS ---');
        console.log(JSON.stringify(jobInJobs, null, 2));
    }

    // Try BOOKINGS collection
    const bookings = await getDocs(COLLECTIONS.BOOKINGS);
    const jobInBookings = bookings.find(b => b.id === jobId || b.bookingId === jobId);

    if (jobInBookings) {
        console.log('--- FOUND IN BOOKINGS ---');
        console.log(JSON.stringify(jobInBookings, null, 2));
    }

    if (!jobInJobs && !jobInBookings) {
        console.log('Job not found in JOBS or BOOKINGS.');
        // List a few IDs to see the format
        console.log('Sample Job IDs:', jobs.slice(0, 5).map(j => j.id));
        console.log('Sample Booking IDs:', bookings.slice(0, 5).map(b => b.id));
    }
}

findJob().catch(console.error).finally(() => process.exit());
