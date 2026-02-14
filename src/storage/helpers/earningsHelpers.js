/**
 * ============================================================================
 * EARNINGS & TRANSACTION OPERATIONS
 * ============================================================================
 *
 * Handles cleaner earnings calculations and transaction tracking.
 *
 * IMPORTANT NOTES:
 * - Only count COMPLETED/PAID jobs
 * - Use CLEANER'S SHARE (Net), not total charge (Gross)
 * - Handle timezones correctly for "Today" calculations
 *
 * @module storage/helpers/earningsHelpers
 */

import { COLLECTIONS, setDoc, generateId } from '../db.js';
import { toLocalDateStr, extractDateFromObject } from './constants.js';

// Lazy import to avoid circular dependency
let getCleanerJobs;
const loadDependencies = async () => {
    if (!getCleanerJobs) {
        const jobHelpers = await import('./jobHelpers.js');
        getCleanerJobs = jobHelpers.getCleanerJobs;
    }
};

/**
 * Create an earning/transaction record
 * @param {string} cleanerId - Cleaner's ID
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Created transaction object
 */
export const createTransaction = async (cleanerId, transactionData) => {
    const transaction = {
        id: generateId('txn'),
        cleanerId,
        ...transactionData,
        createdAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.JOBS, `txn_${transaction.id}`, transaction);
};

/**
 * Get cleaner earnings for a specific period
 * @param {string} cleanerId - The Cleaner's ID
 * @param {string} period - 'today', 'week', 'month', 'all'
 * @returns {Promise<Object>} Earnings summary with earnings, tips, jobs count, hours, and transactions
 */
export const getCleanerEarnings = async (cleanerId, period = 'all') => {
    await loadDependencies();

    const jobs = await getCleanerJobs(cleanerId);
    const completedJobs = jobs.filter(j =>
        ['completed', 'approved', 'completed_pending_approval'].includes(j.status)
    );

    const now = new Date();
    const today = toLocalDateStr(now);

    let filteredJobs = completedJobs;

    if (period === 'today') {
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDateFromObject(j);
            return dateStr === today;
        });
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDateFromObject(j);
            if (!dateStr) return false;
            return new Date(dateStr) >= weekAgo;
        });
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDateFromObject(j);
            if (!dateStr) return false;
            return new Date(dateStr) >= monthAgo;
        });
    }

    // Prioritize 'earnings' (net) over 'amount' (gross)
    const earnings = filteredJobs.reduce((sum, j) => sum + Number(j.earnings || j.amount || 0), 0);
    const tips = filteredJobs.reduce((sum, j) => sum + Number(j.tip || 0), 0);
    const hours = filteredJobs.reduce((sum, j) => sum + Number(j.duration || 2), 0);

    return {
        earnings,
        tips,
        jobs: filteredJobs.length,
        hours,
        transactions: filteredJobs,
    };
};

/**
 * Get cleaner daily earnings for a date range
 * @param {string} cleanerId - Cleaner's ID
 * @param {number} days - Number of days to include (default 7)
 * @returns {Promise<Array>} Array of daily earnings objects
 */
export const getCleanerDailyEarnings = async (cleanerId, days = 7) => {
    await loadDependencies();

    const jobs = await getCleanerJobs(cleanerId);
    const completedJobs = jobs.filter(j =>
        ['completed', 'approved', 'completed_pending_approval'].includes(j.status)
    );

    const dailyEarnings = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = toLocalDateStr(date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayJobs = completedJobs.filter(j => {
            const jobDateStr = extractDateFromObject(j);
            return jobDateStr === dateStr;
        });

        dailyEarnings.push({
            day: dayName,
            date: dateStr,
            earnings: dayJobs.reduce((sum, j) => sum + Number(j.earnings || j.amount || 0), 0),
            jobs: dayJobs.length,
        });
    }

    return dailyEarnings;
};
