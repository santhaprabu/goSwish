
import { getDocs, COLLECTIONS } from './src/storage/db.js';
import { initializeDatabase } from './src/storage/initDatabase.js';

async function checkJobs() {
    // Ensure DB is init
    await initializeDatabase();

    const jobs = await getDocs(COLLECTIONS.JOBS);
    console.log(`Found ${jobs.length} jobs.`);

    // Look for the specific job mentioned: "6082 Meadow Dr, Fort Worth", Amount $173.20
    const targetJob = jobs.find(j => j.address && j.address.includes('6082 Meadow Dr') && (Math.abs(j.amount - 173.20) < 0.1 || Math.abs(j.earnings - 173.20) < 0.1));

    if (targetJob) {
        console.log('--- FOUND TARGET JOB ---');
        console.log(JSON.stringify(targetJob, null, 2));
    } else {
        console.log('Could not find the specific job mentioned.');
        // Print a few sample jobs to see structure
        if (jobs.length > 0) {
            console.log('--- SAMPLE JOB ---');
            console.log(JSON.stringify(jobs[0], null, 2));
        }
    }
}

checkJobs().catch(console.error).finally(() => process.exit());
