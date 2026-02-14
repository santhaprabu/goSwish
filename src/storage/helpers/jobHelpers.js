/**
 * ============================================================================
 * JOB OPERATIONS
 * ============================================================================
 *
 * Handles job lifecycle operations for cleaners.
 * Jobs represent the cleaner's work assignment (the "Supply" side).
 *
 * @module storage/helpers/jobHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, queryDocs, generateId, conditionalUpdate } from '../db.js';
import { isValidJobStatus, toLocalDateStr, ALLOWED_JOB_STATUSES } from './constants.js';
import { extractHours } from '../../utils/dateUtils.js';

// Lazy imports to avoid circular dependencies
let getBookingById, getHouseById, getAppSettings, deleteJobOfferNotifications;
const loadDependencies = async () => {
    if (!getBookingById) {
        const bookingHelpers = await import('./bookingHelpers.js');
        getBookingById = bookingHelpers.getBookingById;
    }
    if (!getHouseById) {
        const houseHelpers = await import('./houseHelpers.js');
        getHouseById = houseHelpers.getHouseById;
    }
    if (!getAppSettings) {
        const serviceHelpers = await import('./serviceHelpers.js');
        getAppSettings = serviceHelpers.getAppSettings;
    }
    if (!deleteJobOfferNotifications) {
        const notificationHelpers = await import('./notificationHelpers.js');
        deleteJobOfferNotifications = notificationHelpers.deleteJobOfferNotifications;
    }
};

/**
 * Create job from booking
 * @param {string} bookingId - Booking's ID
 * @returns {Promise<Object>} Created job object
 * @throws {Error} If booking not found
 */
export const createJob = async (bookingId) => {
    await loadDependencies();

    const booking = await getBookingById(bookingId);

    if (!booking) {
        throw new Error('Booking not found');
    }

    const job = {
        id: generateId('job'),
        bookingId: booking.bookingId,
        customerId: booking.customerId,
        cleanerId: booking.cleanerId,
        houseId: booking.houseId,
        status: 'scheduled',
        startTime: booking.selectedDate.date,
        endTime: null,
        checklistItems: [],
        photos: {
            before: [],
            during: [],
            after: [],
        },
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.JOBS, job.id, job);
};

/**
 * Accept a job offer (assign cleaner to booking and create job)
 * Uses optimistic locking to prevent race conditions
 * @param {string} bookingId - Booking's ID
 * @param {string} cleanerId - Cleaner's ID
 * @param {Object} jobDetails - Job schedule details (date, startTime, endTime)
 * @returns {Promise<Object>} Created job object
 * @throws {Error} If job already taken or conflict exists
 */
export const acceptJobOffer = async (bookingId, cleanerId, jobDetails) => {
    await loadDependencies();

    try {
        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.cleanerId) {
            throw new Error('Job already taken by another cleaner');
        }

        // Check for schedule conflicts
        const bookingDates = booking.dates || [booking.date];
        const timeSlots = booking.timeSlots || { [bookingDates[0]]: ['morning'] };

        const myJobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
        const hasConflict = myJobs.some(j => {
            if (j.status !== 'scheduled' && j.status !== 'in_progress') return false;

            const jDate = toLocalDateStr(j.scheduledDate || j.startTime);
            if (bookingDates.includes(jDate)) {
                const hour = extractHours(j.startTime || j.scheduledDate);
                let slot = 'morning';
                if (hour >= 12) slot = 'afternoon';
                if (hour >= 15) slot = 'evening';

                const requestedSlots = timeSlots[jDate] || [];
                if (requestedSlots.includes(slot)) return true;
            }
            return false;
        });

        if (hasConflict) {
            throw new Error("You already have a booking at this time block.");
        }

        // Use conditional update with optimistic locking
        const currentVersion = booking.version || 0;
        const claimResult = await conditionalUpdate(
            COLLECTIONS.BOOKINGS,
            bookingId,
            {
                cleanerId: cleanerId,
                status: 'confirmed',
                version: currentVersion + 1,
                updatedAt: new Date().toISOString()
            },
            {
                cleanerId: null,
                version: currentVersion
            }
        );

        if (!claimResult.success) {
            if (claimResult.error === 'Condition not met') {
                throw new Error('Job was just claimed by another cleaner. Please try a different job.');
            }
            throw new Error(claimResult.error || 'Failed to claim job');
        }

        // Fetch related data
        const [house, customer, settings] = await Promise.all([
            getDoc(COLLECTIONS.HOUSES, booking.houseId),
            getDoc(COLLECTIONS.USERS, booking.customerId),
            getAppSettings()
        ]);

        const earningsRate = settings?.cleanerEarningsRate || 0.90;

        // Calculate earnings
        let baseForEarnings = 0;
        if (booking.pricingBreakdown?.subtotal) {
            baseForEarnings = booking.pricingBreakdown.subtotal;
        } else if (booking.pricingBreakdown?.total && booking.pricingBreakdown?.taxes) {
            baseForEarnings = booking.pricingBreakdown.total - booking.pricingBreakdown.taxes;
        } else {
            baseForEarnings = (booking.totalAmount || 0) / 1.0825;
        }

        // Create Job record
        const job = {
            id: generateId('job'),
            bookingId: booking.bookingId,
            customerId: booking.customerId,
            cleanerId: cleanerId,
            houseId: booking.houseId,
            serviceType: booking.serviceTypeId,
            amount: booking.totalAmount,
            earnings: baseForEarnings * earningsRate,
            status: 'confirmed',
            scheduledDate: jobDetails.date,
            startTime: jobDetails.startTime,
            endTime: jobDetails.endTime,
            duration: 3,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
            address: house ? `${house.address.street}, ${house.address.city}` : 'Unknown Address',
            checklistItems: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.JOBS, job.id, job);

        // Notify Customer
        try {
            const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);
            let cleanerName = 'A cleaner';
            if (cleaner) {
                const cleanerUser = await getDoc(COLLECTIONS.USERS, cleaner.userId);
                if (cleanerUser) cleanerName = `${cleanerUser.firstName} ${cleanerUser.lastName}`;
            }

            const notifId = generateId('notification');
            await setDoc(COLLECTIONS.NOTIFICATIONS, notifId, {
                id: notifId,
                userId: booking.customerId,
                type: 'booking_accepted',
                title: 'Booking Confirmed!',
                message: `${cleanerName} has accepted your booking for ${jobDetails.date}.`,
                relatedId: booking.id,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (notifError) {
            console.warn('Failed to send notification:', notifError);
        }

        // Cleanup old notifications
        try {
            await deleteJobOfferNotifications(booking.id);
        } catch (cleanupError) {
            console.warn('Failed to delete job offer notifications:', cleanupError);
        }

        return job;

    } catch (error) {
        console.error(`Error accepting job offer ${bookingId}:`, error);
        throw error;
    }
};

/**
 * Get job by ID
 * @param {string} jobId - Job's unique identifier
 * @returns {Promise<Object|null>} Job object or null
 */
export const getJobById = async (jobId) => {
    return await getDoc(COLLECTIONS.JOBS, jobId);
};

/**
 * Get all jobs for a cleaner
 * @param {string} cleanerId - Cleaner's ID
 * @returns {Promise<Array>} Array of job objects
 */
export const getCleanerJobs = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
};

/**
 * Update job
 * @param {string} jobId - Job's ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated job object
 */
export const updateJob = async (jobId, updates) => {
    return await updateDoc(COLLECTIONS.JOBS, jobId, updates);
};

/**
 * Update job status with validation
 * @param {string} jobId - Job's ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated job object
 * @throws {Error} If status is invalid or job not found
 */
export const updateJobStatus = async (jobId, status) => {
    try {
        if (!isValidJobStatus(status)) {
            throw new Error(`Invalid job status: ${status}. Allowed values: ${ALLOWED_JOB_STATUSES.join(', ')}`);
        }

        if (!jobId || typeof jobId !== 'string') {
            throw new Error('Invalid job ID');
        }

        const updates = { status };

        if (status === 'in_progress') {
            updates.startTime = new Date().toISOString();
        } else if (status === 'completed') {
            updates.endTime = new Date().toISOString();
        }

        return await updateDoc(COLLECTIONS.JOBS, jobId, updates);
    } catch (error) {
        console.error(`Error updating job status for ${jobId}:`, error);
        throw error;
    }
};
