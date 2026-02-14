/**
 * ============================================================================
 * CLEANER PROFILE & AVAILABILITY OPERATIONS
 * ============================================================================
 *
 * Handles cleaner profile management, availability, and schedule operations.
 *
 * @module storage/helpers/cleanerHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, getDocs, queryDocs, generateId } from '../db.js';
import { toLocalDateStr } from './constants.js';
import { extractHours } from '../../utils/dateUtils.js';

// Lazy imports to avoid circular dependencies
let getCleanerJobs, getCleanerReviews;
const loadDependencies = async () => {
    if (!getCleanerJobs) {
        const jobHelpers = await import('./jobHelpers.js');
        getCleanerJobs = jobHelpers.getCleanerJobs;
    }
    if (!getCleanerReviews) {
        const reviewHelpers = await import('./reviewHelpers.js');
        getCleanerReviews = reviewHelpers.getCleanerReviews;
    }
};

/**
 * Create cleaner profile
 * @param {string} userId - User's ID
 * @param {Object} cleanerData - Cleaner profile data
 * @returns {Promise<Object>} Created cleaner profile
 */
export const createCleanerProfile = async (userId, cleanerData) => {
    const cleaner = {
        id: generateId('cleaner'),
        userId,
        ...cleanerData,
        verificationStatus: 'pending',
        status: 'active',
        stats: {
            completedJobs: 0,
            rating: 0,
            totalReviews: 0,
            acceptanceRate: 0,
            cancellationRate: 0,
            reliabilityScore: 100,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.CLEANERS, cleaner.id, cleaner);
};

/**
 * Get cleaner profile by user ID
 * @param {string} userId - User's ID
 * @returns {Promise<Object|null>} Cleaner profile or null
 */
export const getCleanerByUserId = async (userId) => {
    const cleaners = await getDocs(COLLECTIONS.CLEANERS);
    return cleaners.find(c => c.userId === userId) || null;
};

/**
 * Get all cleaners
 * @returns {Promise<Array>} Array of all cleaner profiles
 */
export const getAllCleaners = async () => {
    return await getDocs(COLLECTIONS.CLEANERS);
};

/**
 * Update cleaner profile
 * @param {string} cleanerId - Cleaner's ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated cleaner profile
 */
export const updateCleanerProfile = async (cleanerId, updates) => {
    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, updates);
};

/**
 * Get cleaner schedule for a date range
 * @param {string} cleanerId - Cleaner's ID
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {Promise<Array>} Array of scheduled jobs
 */
export const getCleanerSchedule = async (cleanerId, startDate, endDate) => {
    await loadDependencies();

    const jobs = await getCleanerJobs(cleanerId);

    const startDateStr = toLocalDateStr(startDate);
    const endDateStr = toLocalDateStr(endDate);

    return jobs.filter(j => {
        const jobDateStr = toLocalDateStr(j.scheduledDate || j.startTime || j.createdAt);
        return jobDateStr >= startDateStr && jobDateStr <= endDateStr;
    }).sort((a, b) => {
        const dateA = toLocalDateStr(a.scheduledDate || a.startTime);
        const dateB = toLocalDateStr(b.scheduledDate || b.startTime);
        return dateA.localeCompare(dateB);
    });
};

/**
 * Get cleaner stats
 * @param {string} cleanerId - Cleaner's ID
 * @returns {Promise<Object>} Comprehensive stats object
 */
export const getCleanerStats = async (cleanerId) => {
    await loadDependencies();

    const jobs = await getCleanerJobs(cleanerId);
    const reviews = await getCleanerReviews(cleanerId);

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const totalEarnings = completedJobs.reduce((sum, j) =>
        sum + (j.amount || j.earnings || 0), 0
    );
    const totalTips = completedJobs.reduce((sum, j) => sum + (j.tip || 0), 0);

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const onTimeJobs = completedJobs.filter(j => !j.startedLate);
    const onTimeRate = completedJobs.length > 0
        ? Math.round((onTimeJobs.length / completedJobs.length) * 100)
        : 100;

    const clientCounts = {};
    completedJobs.forEach(j => {
        clientCounts[j.customerId] = (clientCounts[j.customerId] || 0) + 1;
    });
    const repeatClients = Object.values(clientCounts).filter(c => c > 1).length;
    const totalClients = Object.keys(clientCounts).length;
    const repeatRate = totalClients > 0
        ? Math.round((repeatClients / totalClients) * 100)
        : 0;

    return {
        completedJobs: completedJobs.length,
        totalEarnings,
        totalTips,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        onTimeRate,
        repeatRate,
        totalClients,
    };
};

// ============================================
// AVAILABILITY OPERATIONS
// ============================================

/**
 * Get cleaner availability for a date range
 * @param {string} cleanerId - Cleaner's ID
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {Promise<Object>} Availability object by date
 */
export const getCleanerAvailability = async (cleanerId, startDate, endDate) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        return {};
    }

    return cleaner.availability || {};
};

/**
 * Update cleaner availability for a specific shift
 * @param {string} cleanerId - Cleaner's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} shift - Shift name (morning, afternoon, evening)
 * @param {string} status - Status (available, unavailable, blocked)
 * @returns {Promise<Object>} Updated cleaner profile
 */
export const updateCleanerAvailability = async (cleanerId, date, shift, status) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        throw new Error('Cleaner not found');
    }

    const availability = cleaner.availability || {};

    if (!availability[date]) {
        availability[date] = {};
    }

    availability[date][shift] = status;

    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, {
        availability,
        updatedAt: new Date().toISOString(),
    });
};

/**
 * Bulk update cleaner availability
 * @param {string} cleanerId - Cleaner's ID
 * @param {Array} updates - Array of {date, shift, status} objects
 * @returns {Promise<Object>} Updated cleaner profile
 */
export const bulkUpdateCleanerAvailability = async (cleanerId, updates) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        throw new Error('Cleaner not found');
    }

    const availability = cleaner.availability || {};

    updates.forEach(({ date, shift, status }) => {
        if (!availability[date]) {
            availability[date] = {};
        }
        availability[date][shift] = status;
    });

    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, {
        availability,
        updatedAt: new Date().toISOString(),
    });
};

/**
 * Get cleaners available for a specific date and shift
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} shift - Shift name
 * @returns {Promise<Array>} Array of available cleaner profiles
 */
export const getAvailableCleanersForSlot = async (date, shift) => {
    const cleaners = await getDocs(COLLECTIONS.CLEANERS);

    return cleaners.filter(cleaner => {
        if (cleaner.status !== 'active' || cleaner.verificationStatus !== 'approved') {
            return false;
        }

        const availability = cleaner.availability || {};
        const dayAvailability = availability[date] || {};
        const slotStatus = dayAvailability[shift] || 'available';

        return slotStatus === 'available';
    });
};

/**
 * Clear old availability data (cleanup function)
 * @param {string} cleanerId - Cleaner's ID
 * @param {number} daysToKeep - Number of past days to keep (default 7)
 * @returns {Promise<Object|void>} Updated cleaner or void
 */
export const cleanupOldAvailability = async (cleanerId, daysToKeep = 7) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner || !cleaner.availability) {
        return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = toLocalDateStr(cutoffDate);

    const availability = cleaner.availability;
    const cleanedAvailability = {};

    Object.keys(availability).forEach(date => {
        if (date >= cutoffStr) {
            cleanedAvailability[date] = availability[date];
        }
    });

    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, {
        availability: cleanedAvailability,
        updatedAt: new Date().toISOString(),
    });
};

/**
 * Check if cleaner has a conflicting job OR has blocked the requested time slot
 * @param {string} cleanerId - The cleaner's profile ID
 * @param {Array} dates - Array of dates in YYYY-MM-DD format
 * @param {Object} timeSlots - Object mapping dates to slot arrays
 * @returns {Promise<boolean>} True if there's a conflict
 */
export const checkCleanerConflict = async (cleanerId, dates, timeSlots) => {
    await loadDependencies();

    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);
    const availability = cleaner?.availability || {};

    const jobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
    const activeJobs = jobs.filter(j =>
        j.status === 'scheduled' || j.status === 'in_progress'
    );

    for (const date of dates) {
        const requestedSlots = timeSlots[date] || [];

        // Check 1: Is any requested slot BLOCKED in cleaner's availability settings?
        const dayAvailability = availability[date] || {};
        for (const slot of requestedSlots) {
            if (dayAvailability[slot] === 'unavailable' || dayAvailability[slot] === 'blocked') {
                console.log(`Cleaner ${cleanerId} has ${slot} blocked on ${date}`);
                return true;
            }
        }

        // Check 2: Is there an existing job that conflicts?
        for (const job of activeJobs) {
            const jobDate = toLocalDateStr(job.scheduledDate || job.startTime);

            if (jobDate === date) {
                let jobSlot = 'morning';

                const hour = extractHours(job.startTime || job.scheduledDate);
                if (hour >= 12 && hour < 15) jobSlot = 'afternoon';
                if (hour >= 15) jobSlot = 'evening';

                if (requestedSlots.includes(jobSlot)) {
                    return true;
                }
            }
        }
    }

    return false;
};
