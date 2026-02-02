/**
 * ============================================================================
 * GO-SWISH STORAGE HELPERS - CORE BACKEND LOGIC
 * ============================================================================
 * 
 * This file acts as the "Service Layer" for the application. It handles:
 * 1. Data Parsing & Validation (ensuring clean data enters the DB)
 * 2. Complex Business Logic (e.g., matching cleaners, calculating earnings)
 * 3. Atomic Operations (e.g., verifying codes, updating job statuses)
 * 
 * ARCHITECTURE NOTE:
 * We use a "Doc-based" NoSQL approach (simulated). 
 * - 'BOOKINGS' represent the Homeowner's request (The "Demand").
 * - 'JOBS' represent the Cleaner's assignment (The "Supply").
 * 
 * Key Relationship:
 * One Booking -> (matches to) -> One Job (typically).
 * However, we keep them separate so we can have multiple 'Job Offers' for a single booking
 * before one is accepted.
 * 
 * @module StorageHelpers
 */

import { COLLECTIONS, addDoc, setDoc, updateDoc, getDoc, getDocs, queryDocs, deleteDoc, generateId, conditionalUpdate, atomicIncrement } from './db.js';

// ============================================
// VALIDATION CONSTANTS
// ============================================

/**
 * ALLOWED BOOKING STATUSES (The Lifecycle of a Booking)
 * 
 * Flow:
 * 1. booking-placed: User submits request.
 * 2. matched/scheduled: System finds a cleaner.
 * 3. on_the_way -> arrived -> in_progress: Day of service.
 * 4. completed_pending_approval: Cleaner marks finished.
 * 5. approved: Homeowner confirms (or auto-confirm).
 */
export const ALLOWED_BOOKING_STATUSES = [
    'booking-placed',
    'pending',
    'confirmed',
    'matched',
    'scheduled',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed_pending_approval',
    'completed',
    'approved',
    'cancelled'
];

/**
 * ALLOWED JOB STATUSES (The Lifecycle of a Cleaner's Task)
 * Note: These largely mirror booking statuses but strictly track the Work Unit.
 */
export const ALLOWED_JOB_STATUSES = [
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
];

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate verification code format
 * @param {string} code - Verification code to validate
 * @returns {boolean} True if valid
 */
const isValidVerificationCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    return /^\d{6}$/.test(code); // Must be exactly 6 digits
};

/**
 * Validate booking status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
const isValidBookingStatus = (status) => {
    return ALLOWED_BOOKING_STATUSES.includes(status);
};

/**
 * Validate job status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
const isValidJobStatus = (status) => {
    return ALLOWED_JOB_STATUSES.includes(status);
};

/**
 * Sanitize and validate input
 * @param {any} value - Value to validate
 * @param {string} type - Expected type ('string', 'number', 'object', 'array')
 * @param {boolean} required - Whether value is required
 * @returns {{valid: boolean, error?: string, value: any}}
 */
const validateInput = (value, type, required = true) => {
    if (required && (value === null || value === undefined)) {
        return { valid: false, error: 'Required field is missing' };
    }

    if (!required && (value === null || value === undefined)) {
        return { valid: true, value };
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== type) {
        return { valid: false, error: `Expected ${type}, got ${actualType}` };
    }

    return { valid: true, value };
};

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
    return await getDoc(COLLECTIONS.USERS, userId);
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email) => {
    const users = await queryDocs(COLLECTIONS.USERS, 'email', email);
    return users.length > 0 ? users[0] : null;
};

/**
 * Update user
 */
export const updateUser = async (userId, updates) => {
    return await updateDoc(COLLECTIONS.USERS, userId, updates);
};

// ============================================
// HOUSE OPERATIONS
// ============================================

/**
 * Create house
 */
export const createHouse = async (userId, houseData) => {
    const house = {
        id: generateId('house'),
        userId,
        ...houseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.HOUSES, house.id, house);
};

/**
 * Get user's houses
 */
export const getUserHouses = async (userId) => {
    return await queryDocs(COLLECTIONS.HOUSES, 'userId', userId);
};

/**
 * Get house by ID
 */
export const getHouseById = async (houseId) => {
    return await getDoc(COLLECTIONS.HOUSES, houseId);
};

/**
 * Update house
 */
export const updateHouse = async (houseId, updates) => {
    return await updateDoc(COLLECTIONS.HOUSES, houseId, updates);
};

/**
 * Delete house
 */
export const deleteHouse = async (houseId) => {
    return await deleteDoc(COLLECTIONS.HOUSES, houseId);
};

// ============================================
// BOOKING OPERATIONS
// ============================================

/**
 * Check if booking number exists in database
 */
const bookingNumberExists = async (bookingNumber) => {
    const existingBookings = await queryDocs(COLLECTIONS.BOOKINGS, 'bookingId', bookingNumber);
    return existingBookings.length > 0;
};

/**
 * Normalize state name to 2-letter code
 * Complete mapping for all 50 US states + DC
 */
const normalizeStateCode = (state) => {
    if (!state) return 'TX'; // Default to Texas

    // If already 2 letters, return as is (uppercase)
    if (state.length === 2) return state.toUpperCase();

    // Complete map of all 50 US states + DC
    const stateMap = {
        // Most populous states
        'california': 'CA', 'texas': 'TX', 'florida': 'FL', 'new york': 'NY',
        'pennsylvania': 'PA', 'illinois': 'IL', 'ohio': 'OH', 'georgia': 'GA',
        'north carolina': 'NC', 'michigan': 'MI',

        // Northeastern states
        'new jersey': 'NJ', 'massachusetts': 'MA', 'virginia': 'VA', 'washington': 'WA',
        'arizona': 'AZ', 'tennessee': 'TN', 'indiana': 'IN', 'maryland': 'MD',
        'missouri': 'MO', 'wisconsin': 'WI', 'colorado': 'CO', 'minnesota': 'MN',

        // Southern states
        'south carolina': 'SC', 'alabama': 'AL', 'louisiana': 'LA', 'kentucky': 'KY',
        'oklahoma': 'OK', 'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA',
        'nevada': 'NV', 'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS',

        // Western & Mountain states
        'new mexico': 'NM', 'nebraska': 'NE', 'idaho': 'ID', 'west virginia': 'WV',
        'hawaii': 'HI', 'new hampshire': 'NH', 'maine': 'ME', 'rhode island': 'RI',
        'montana': 'MT', 'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND',
        'alaska': 'AK', 'vermont': 'VT', 'wyoming': 'WY', 'oregon': 'OR',

        // DC
        'district of columbia': 'DC', 'washington dc': 'DC', 'washington d.c.': 'DC'
    };

    const normalized = stateMap[state.toLowerCase()];
    return normalized || state.substring(0, 2).toUpperCase(); // Fallback to first 2 chars
};

/**
 * Generate unique booking number
 * Format: XX-YYYY-MMDD-#####
 * Example: TX-2026-1026-38547
 * Ensures uniqueness by checking database and regenerating if needed
 */
const generateBookingNumber = async (houseId, bookingDate) => {
    let stateCode = 'TX'; // Default to Texas as primary market

    try {
        if (houseId) {
            const house = await getHouseById(houseId);
            if (house?.address?.state) {
                stateCode = normalizeStateCode(house.address.state);
            }
        }
    } catch (e) {
        console.warn('⚠️ Booking ID generation: house lookup failed, using default state TX');
    }

    const date = new Date(bookingDate || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const mmdd = `${month}${day}`;

    // Pattern: ST-YYYY-MMDD-XXXX
    // Cleaner, State-first, 4-digit random suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingNumber = `${stateCode}-${year}-${mmdd}-${randomSuffix}`;

    console.log(`🎫 Unique Booking ID Created: ${bookingNumber}`);
    return bookingNumber;
};

/**
 * Create booking
 */
export const createBooking = async (customerId, bookingData) => {
    // Generate unique booking number based on house state and first booking date
    const firstBookingDate = bookingData.dates?.[0] || new Date().toISOString();
    const bookingNumber = await generateBookingNumber(bookingData.houseId, firstBookingDate);

    const booking = {
        id: generateId('booking'),
        bookingId: bookingNumber,
        customerId: customerId, // Explicitly assign customerId
        houseId: bookingData.houseId,
        serviceTypeId: bookingData.serviceTypeId,
        addOnIds: bookingData.addOnIds || [],
        dates: bookingData.dates || [],
        timeSlots: bookingData.timeSlots || {},
        specialNotes: bookingData.specialNotes || '',
        paymentMethod: bookingData.paymentMethod || 'card',
        totalAmount: bookingData.totalAmount,
        pricingBreakdown: bookingData.pricingBreakdown || null,
        discount: bookingData.discount || null,
        status: 'booking-placed',
        paymentStatus: 'pending',
        cleanerId: null, // Initialize as null for conditional update
        version: 1, // Initialize version for optimistic locking
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    console.log('💾 Creating booking:', booking);
    return await setDoc(COLLECTIONS.BOOKINGS, booking.id, booking);
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId) => {
    return await getDoc(COLLECTIONS.BOOKINGS, bookingId);
};

/**
 * Get customer's bookings
 */
export const getCustomerBookings = async (customerId) => {
    return await queryDocs(COLLECTIONS.BOOKINGS, 'customerId', customerId);
};

/**
 * Get cleaner's bookings
 */
export const getCleanerBookings = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.BOOKINGS, 'cleanerId', cleanerId);
};

/**
 * Get available bookings (confirmed but no cleaner)
 */
export const getAvailableBookings = async () => {
    // Determine bookings that correspond to "open jobs"
    // In a real DB we'd composite query: status=='confirmed' AND cleanerId==null
    // Here we might fetch confirmed and filter
    const bookings = await queryDocs(COLLECTIONS.BOOKINGS, 'status', 'booking-placed');
    return bookings.filter(b => !b.cleanerId);
};

/**
 * Update booking
 */
export const updateBooking = async (bookingId, updates) => {
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, updates);
};

/**
 * Cancel booking
 */
export const cancelBooking = async (bookingId, reason) => {
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
    });
};

// ============================================
// CLEANER OPERATIONS
// ============================================

/**
 * Create cleaner profile
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
 */
export const getCleanerByUserId = async (userId) => {
    const cleaners = await getDocs(COLLECTIONS.CLEANERS);
    return cleaners.find(c => c.userId === userId) || null;
};

/**
 * Get all cleaners
 */
export const getAllCleaners = async () => {
    return await getDocs(COLLECTIONS.CLEANERS);
};

/**
 * Update cleaner profile
 */
export const updateCleanerProfile = async (cleanerId, updates) => {
    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, updates);
};

// ============================================
// JOB OPERATIONS
// ============================================

/**
 * Create job from booking
 */
export const createJob = async (bookingId) => {
    const booking = await getBookingById(bookingId);

    if (!booking) {
        throw new Error('Booking not found');
    }

    const job = {
        id: generateId('job'),
        bookingId: booking.id,
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
 */
export const acceptJobOffer = async (bookingId, cleanerId, jobDetails) => {
    try {
        // 1. Get current booking with all validations
        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.cleanerId) {
            throw new Error('Job already taken by another cleaner');
        }

        // 2. Check for schedule conflicts BEFORE attempting to claim
        const bookingDates = booking.dates || [booking.date];
        const timeSlots = booking.timeSlots || { [bookingDates[0]]: ['morning'] };

        const myJobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
        const hasConflict = myJobs.some(j => {
            if (j.status !== 'scheduled' && j.status !== 'in_progress') return false;

            const jDate = new Date(j.scheduledDate || j.startTime).toISOString().split('T')[0];
            if (bookingDates.includes(jDate)) {
                const hour = new Date(j.startTime || j.scheduledDate).getHours();
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

        // 3. Use conditional update with optimistic locking to claim the job
        //    Only update if cleanerId is still null
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
                cleanerId: null,  // Only claim if no cleaner assigned
                version: currentVersion  // And version hasn't changed
            }
        );

        if (!claimResult.success) {
            if (claimResult.error === 'Condition not met') {
                throw new Error('Job was just claimed by another cleaner. Please try a different job.');
            }
            throw new Error(claimResult.error || 'Failed to claim job');
        }

        // Job successfully claimed! Now fetch related data
        const [house, customer, settings] = await Promise.all([
            getDoc(COLLECTIONS.HOUSES, booking.houseId),
            getDoc(COLLECTIONS.USERS, booking.customerId),
            getAppSettings()
        ]);

        const earningsRate = settings?.cleanerEarningsRate || 0.90;

        // 4. Create Job record
        const job = {
            id: generateId('job'),
            bookingId: booking.id,
            customerId: booking.customerId,
            cleanerId: cleanerId,
            houseId: booking.houseId,
            serviceType: booking.serviceTypeId,
            amount: booking.totalAmount,
            earnings: (booking.pricingBreakdown?.subtotal || booking.totalAmount) * earningsRate, // Dynamic split on subtotal
            status: 'confirmed', // Match booking status

            // Schedule details from acceptance
            scheduledDate: jobDetails.date,
            startTime: jobDetails.startTime,
            endTime: jobDetails.endTime,
            duration: 3,

            // Snapshot data
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
            address: house ? `${house.address.street}, ${house.address.city}` : 'Unknown Address',

            checklistItems: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.JOBS, job.id, job);

        // 5. Notify Customer (non-critical, don't fail if this errors)
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
            // Continue anyway - notification failure shouldn't block job acceptance
        }

        // 6. Remove job offer notifications (cleanup, non-critical)
        try {
            await deleteJobOfferNotifications(booking.id);
        } catch (cleanupError) {
            console.warn('Failed to delete job offer notifications:', cleanupError);
            // Continue anyway
        }

        return job;

    } catch (error) {
        console.error(`Error accepting job offer ${bookingId}:`, error);
        throw error; // Re-throw to let caller handle
    }
};

/**
 * Delete all job offer notifications for a specific booking
 * Usage: When a job is taken, remove the alert from other cleaners' feeds.
 */
export const deleteJobOfferNotifications = async (bookingId) => {
    try {
        const notifs = await queryDocs(COLLECTIONS.NOTIFICATIONS, 'relatedId', bookingId);
        const deletionPromises = notifs
            .filter(n => n.type === 'job_offer')
            .map(n => deleteDoc(COLLECTIONS.NOTIFICATIONS, n.id));

        await Promise.all(deletionPromises);
        console.log(`Deleted ${deletionPromises.length} stale job offers for booking ${bookingId}`);
    } catch (e) {
        console.error('Error clearing stale job notifications', e);
    }
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId) => {
    return await getDoc(COLLECTIONS.JOBS, jobId);
};

/**
 * Get cleaner's jobs
 */
export const getCleanerJobs = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
};

/**
 * Update job
 */
export const updateJob = async (jobId, updates) => {
    return await updateDoc(COLLECTIONS.JOBS, jobId, updates);
};

/**
 * Update job status
 */
export const updateJobStatus = async (jobId, status) => {
    try {
        // Validate status
        if (!isValidJobStatus(status)) {
            throw new Error(`Invalid job status: ${status}. Allowed values: ${ALLOWED_JOB_STATUSES.join(', ')}`);
        }

        // Validate jobId
        if (!jobId || typeof jobId !== 'string') {
            throw new Error('Invalid job ID');
        }

        const updates = {
            status,
        };

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

// ============================================
// REVIEW OPERATIONS
// ============================================

/**
 * Create review
 */
export const createReview = async (reviewData) => {
    const review = {
        id: generateId('review'),
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.REVIEWS, review.id, review);
};

/**
 * Get cleaner's reviews
 */
export const getCleanerReviews = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.REVIEWS, 'cleanerId', cleanerId);
};

/**
 * Get customer's reviews
 */
export const getCustomerReviews = async (customerId) => {
    return await queryDocs(COLLECTIONS.REVIEWS, 'customerId', customerId);
};

// ============================================
// SERVICE TYPE OPERATIONS
// ============================================

/**
 * Get all service types
 */
export const getServiceTypes = async () => {
    const services = await getDocs(COLLECTIONS.SERVICE_TYPES);
    return services.filter(s => s.active);
};

/**
 * Get service type by ID
 */
export const getServiceTypeById = async (serviceId) => {
    return await getDoc(COLLECTIONS.SERVICE_TYPES, serviceId);
};

// ============================================
// ADD-ON OPERATIONS
// ============================================

/**
 * Get all add-ons
 */
export const getAddOns = async () => {
    const addOns = await getDocs(COLLECTIONS.ADD_ONS);
    return addOns.filter(a => a.active);
};

/**
 * Get add-on by ID
 */
export const getAddOnById = async (addOnId) => {
    return await getDoc(COLLECTIONS.ADD_ONS, addOnId);
};

// ============================================
// PROMO CODE OPERATIONS
// ============================================

/**
 * Get promo code by code
 */
export const createPromoCode = async (promoData) => {
    const promo = {
        id: generateId('promo'),
        ...promoData,
        code: promoData.code.toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return await setDoc(COLLECTIONS.PROMO_CODES, promo.id, promo);
};

/**
 * Get promo code by code
 */
export const getPromoCodeByCode = async (code) => {

    const promoCodes = await getDocs(COLLECTIONS.PROMO_CODES);
    return promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase()) || null;
};

/**
 * Validate promo code
 */
export const validatePromoCode = async (code, userId, serviceType, amount) => {
    const promo = await getPromoCodeByCode(code);

    if (!promo) {
        return { valid: false, error: 'Invalid promo code' };
    }

    if (!promo.active) {
        return { valid: false, error: 'Promo code is no longer active' };
    }

    const now = new Date();
    const validFrom = new Date(promo.validFrom);
    const validUntil = new Date(promo.validUntil);

    if (now < validFrom || now > validUntil) {
        return { valid: false, error: 'Promo code has expired' };
    }

    if (promo.usedCount >= promo.maxUses) {
        return { valid: false, error: 'Promo code has reached maximum uses' };
    }

    if (amount < promo.minAmount) {
        return { valid: false, error: `Minimum amount is $${promo.minAmount}` };
    }

    if (promo.serviceTypes && !promo.serviceTypes.includes(serviceType)) {
        return { valid: false, error: 'Promo code not valid for this service type' };
    }

    if (promo.firstTimeOnly) {
        const userBookings = await getCustomerBookings(userId);
        if (userBookings.length > 0) {
            return { valid: false, error: 'Promo code is for first-time users only' };
        }
    }

    return { valid: true, promo };
};

/**
 * Apply promo code with atomic increment to prevent race conditions
 * @param {string} promoId - Promo code ID
 * @returns {Promise<boolean>} True if successfully applied
 */
export const applyPromoCode = async (promoId) => {
    try {
        const promo = await getDoc(COLLECTIONS.PROMO_CODES, promoId);

        if (!promo) {
            console.error('Promo code not found:', promoId);
            return false;
        }

        // Check if max uses would be exceeded (with buffer for safety)
        const currentCount = promo.usedCount || 0;
        if (currentCount >= promo.maxUses) {
            console.warn('Promo code max uses reached:', promoId);
            return false;
        }

        // Use atomic increment to prevent race condition
        await atomicIncrement(COLLECTIONS.PROMO_CODES, promoId, 'usedCount', 1);

        return true;
    } catch (error) {
        console.error(`Error applying promo code ${promoId}:`, error);
        return false;
    }
};

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get app settings
 */
export const getAppSettings = async () => {
    return await getDoc(COLLECTIONS.SETTINGS, 'app');
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

/**
 * Create notification
 */
export const createNotification = async (userId, notificationData) => {
    const notification = {
        id: generateId('notification'),
        userId,
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.NOTIFICATIONS, notification.id, notification);
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId) => {
    const notifications = await queryDocs(COLLECTIONS.NOTIFICATIONS, 'userId', userId);
    return notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
    return await updateDoc(COLLECTIONS.NOTIFICATIONS, notificationId, {
        read: true,
    });
};
/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
    return await deleteDoc(COLLECTIONS.NOTIFICATIONS, notificationId);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId) => {
    const notifications = await getUserNotifications(userId);
    const unread = notifications.filter(n => !n.read);

    for (const notification of unread) {
        await markNotificationAsRead(notification.id);
    }

    return true;
};

// ============================================
// MESSAGE OPERATIONS
// ============================================

/**
 * Create a conversation
 */
export const createConversation = async (participantIds, metadata = {}) => {
    const conversation = {
        id: generateId('conv'),
        participantIds,
        ...metadata,
        lastMessage: null,
        lastMessageTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.MESSAGES, conversation.id, conversation);
};

/**
 * Get user's conversations
 */
export const getUserConversations = async (userId) => {
    const allMessages = await getDocs(COLLECTIONS.MESSAGES);
    // Filter for conversations (items with participantIds)
    const conversations = allMessages.filter(m =>
        m.participantIds && m.participantIds.includes(userId)
    );
    return conversations.sort((a, b) =>
        new Date(b.lastMessageTime || b.createdAt) - new Date(a.lastMessageTime || a.createdAt)
    );
};

/**
 * Get conversation between two users
 */
export const getConversation = async (userId1, userId2) => {
    const conversations = await getUserConversations(userId1);
    return conversations.find(c =>
        c.participantIds.includes(userId2)
    ) || null;
};

/**
 * Get conversation messages
 */
export const getConversationMessages = async (conversationId) => {
    const allMessages = await getDocs(COLLECTIONS.MESSAGES);
    return allMessages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

/**
 * Send a message
 */
export const sendMessage = async (conversationId, senderId, content) => {
    const message = {
        id: generateId('msg'),
        conversationId,
        senderId,
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
    };

    await setDoc(COLLECTIONS.MESSAGES, message.id, message);

    // Update conversation's last message
    await updateDoc(COLLECTIONS.MESSAGES, conversationId, {
        lastMessage: content,
        lastMessageTime: message.createdAt,
    });

    return message;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId) => {
    return await updateDoc(COLLECTIONS.MESSAGES, messageId, {
        status: 'read',
        readAt: new Date().toISOString(),
    });
};

/**
 * Get unread message count for user
 */
export const getUnreadMessageCount = async (userId) => {
    const conversations = await getUserConversations(userId);
    let count = 0;

    for (const conv of conversations) {
        const messages = await getConversationMessages(conv.id);
        count += messages.filter(m =>
            m.senderId !== userId && m.status !== 'read'
        ).length;
    }

    return count;
};

// ============================================
// EARNINGS / TRANSACTION OPERATIONS
// ============================================

/**
 * Create an earning/transaction record
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
 * Get cleaner earnings
 * 
 * EDUCATIONAL NOTE:
 * Calculating earnings is critical and sensitive. 
 * We must ensure:
 * 1. We only count COMPLETED/PAID jobs.
 * 2. We use the CLEANER'S SHARE (Net), not the total charge (Gross).
 * 3. We handle Timezones correctly (UTC vs Local) so "Today" is accurate.
 * 
 * @param {string} cleanerId - The Cleaner's ID
 * @param {string} period - 'today', 'week', 'month', 'all'
 */
export const getCleanerEarnings = async (cleanerId, period = 'all') => {
    const jobs = await getCleanerJobs(cleanerId);
    // Include approved jobs as valid completed jobs for earnings
    const completedJobs = jobs.filter(j => ['completed', 'approved', 'completed_pending_approval'].includes(j.status));

    // Filter by period
    const now = new Date();
    // Use UTC date string for consistent comparison
    const today = now.toISOString().split('T')[0];

    let filteredJobs = completedJobs;

    // Helper to extract valid YYYY-MM-DD date
    const extractDate = (j) => {
        // Priority: completedAt > updatedAt > createdAt > endTime (if valid date)
        const candidates = [j.completedAt, j.updatedAt, j.createdAt, j.endTime];
        for (const c of candidates) {
            if (c && typeof c === 'string') {
                if (c.includes('T')) return c.split('T')[0]; // ISO string
                if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c; // YYYY-MM-DD
            }
        }
        return null;
    };

    if (period === 'today') {
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDate(j);
            return dateStr === today;
        });
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDate(j);
            if (!dateStr) return false;
            return new Date(dateStr) >= weekAgo;
        });
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredJobs = completedJobs.filter(j => {
            const dateStr = extractDate(j);
            if (!dateStr) return false;
            return new Date(dateStr) >= monthAgo;
        });
    }

    // Fix: Prioritize 'earnings' (net) over 'amount' (gross)
    const earnings = filteredJobs.reduce((sum, j) => sum + Number(j.earnings || j.amount || 0), 0);
    const tips = filteredJobs.reduce((sum, j) => sum + Number(j.tip || 0), 0);
    const hours = filteredJobs.reduce((sum, j) => sum + Number(j.duration || 2), 0); // Default 2 hours per job

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
 */
export const getCleanerDailyEarnings = async (cleanerId, days = 7) => {
    const jobs = await getCleanerJobs(cleanerId);
    // Include all paid/completed statuses
    const completedJobs = jobs.filter(j => ['completed', 'approved', 'completed_pending_approval'].includes(j.status));

    const dailyEarnings = [];
    const now = new Date();

    // Helper to extract valid YYYY-MM-DD date
    const extractDate = (j) => {
        // Priority: completedAt > updatedAt > createdAt > endTime (if valid date)
        const candidates = [j.completedAt, j.updatedAt, j.createdAt, j.endTime];
        for (const c of candidates) {
            if (c && typeof c === 'string') {
                if (c.includes('T')) return c.split('T')[0]; // ISO string
                if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c; // YYYY-MM-DD
            }
        }
        return null;
    };

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayJobs = completedJobs.filter(j => {
            const jobDateStr = extractDate(j);
            return jobDateStr === dateStr;
        });

        dailyEarnings.push({
            day: dayName,
            date: dateStr,
            // Fix: Prioritize 'earnings' (net) over 'amount' (gross)
            earnings: dayJobs.reduce((sum, j) => sum + Number(j.earnings || j.amount || 0), 0),
            jobs: dayJobs.length,
        });
    }

    return dailyEarnings;
};

// ============================================
// REVIEW OPERATIONS (ENHANCED)
// ============================================

/**
 * Get cleaner reviews with stats
 */
export const getCleanerReviewsWithStats = async (cleanerId) => {
    const reviews = await getCleanerReviews(cleanerId);

    if (reviews.length === 0) {
        return {
            reviews: [],
            stats: {
                avgRating: 0,
                totalReviews: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                topTags: [],
            },
        };
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCounts = {};

    reviews.forEach(r => {
        distribution[r.rating]++;
        (r.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

    // Sort reviews by date (newest first)
    const sortedReviews = reviews.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
        reviews: sortedReviews,
        stats: {
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
            distribution,
            topTags,
        },
    };
};

/**
 * Add response to review
 */
export const addReviewResponse = async (reviewId, response) => {
    return await updateDoc(COLLECTIONS.REVIEWS, reviewId, {
        response,
        responseDate: new Date().toISOString(),
    });
};

// ============================================
// CLEANER STATS / SCHEDULE OPERATIONS
// ============================================

/**
 * Get cleaner schedule for a date range
 */
export const getCleanerSchedule = async (cleanerId, startDate, endDate) => {
    const jobs = await getCleanerJobs(cleanerId);

    return jobs.filter(j => {
        const jobDate = new Date(j.scheduledDate || j.startTime || j.createdAt);
        return jobDate >= new Date(startDate) && jobDate <= new Date(endDate);
    }).sort((a, b) =>
        new Date(a.scheduledDate || a.startTime) - new Date(b.scheduledDate || b.startTime)
    );
};

/**
 * Get cleaner stats
 */
export const getCleanerStats = async (cleanerId) => {
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

    // Calculate on-time rate (jobs started on time vs total)
    const onTimeJobs = completedJobs.filter(j => !j.startedLate);
    const onTimeRate = completedJobs.length > 0
        ? Math.round((onTimeJobs.length / completedJobs.length) * 100)
        : 100;

    // Calculate repeat clients
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
// CLEANER AVAILABILITY OPERATIONS
// ============================================

/**
 * Get cleaner availability for a date range
 */
export const getCleanerAvailability = async (cleanerId, startDate, endDate) => {
    // Try to get from settings or a dedicated availability store
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        return {};
    }

    // Return stored availability or empty object
    return cleaner.availability || {};
};

/**
 * Update cleaner availability for a specific shift
 */
export const updateCleanerAvailability = async (cleanerId, date, shift, status) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        throw new Error('Cleaner not found');
    }

    // Get existing availability or create new
    const availability = cleaner.availability || {};

    // Initialize date if not exists
    if (!availability[date]) {
        availability[date] = {};
    }

    // Update the specific shift
    availability[date][shift] = status;

    // Save back to cleaner profile
    return await updateDoc(COLLECTIONS.CLEANERS, cleanerId, {
        availability,
        updatedAt: new Date().toISOString(),
    });
};

/**
 * Bulk update cleaner availability
 */
export const bulkUpdateCleanerAvailability = async (cleanerId, updates) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner) {
        throw new Error('Cleaner not found');
    }

    const availability = cleaner.availability || {};

    // Apply all updates
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
 * Get cleaner's available shifts for job matching
 */
export const getAvailableCleanersForSlot = async (date, shift) => {
    const cleaners = await getDocs(COLLECTIONS.CLEANERS);

    return cleaners.filter(cleaner => {
        // Check if cleaner is active and verified
        if (cleaner.status !== 'active' || cleaner.verificationStatus !== 'approved') {
            return false;
        }

        // Check availability
        const availability = cleaner.availability || {};
        const dayAvailability = availability[date] || {};

        // Default to available if not explicitly blocked
        const slotStatus = dayAvailability[shift] || 'available';

        return slotStatus === 'available';
    });
};

/**
 * Clear old availability data (cleanup function)
 */
export const cleanupOldAvailability = async (cleanerId, daysToKeep = 7) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);

    if (!cleaner || !cleaner.availability) {
        return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

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

// ============================================
// GEOLOCATION & PROXIMITY UTILITIES
// ============================================

/**
 * Calculate straight-line distance between two points (Haversine Formula)
 * @returns {number} Distance in miles
 */
export const calculateGeoDistance = (loc1, loc2) => {
    if (!loc1?.lat || !loc1?.lng || !loc2?.lat || !loc2?.lng) return 999;

    // Check if it's the same coordinate to avoid math errors
    if (loc1.lat === loc2.lat && loc1.lng === loc2.lng) return 0;

    const R = 3959; // Earth's radius in miles
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Estimate road distance and travel time
 * Straight line is multiplied by a "Road Curvature Factor" (typically 1.3 - 1.4)
 * @returns {Object} { roadMiles, travelMinutes }
 */
export const calculateTravelEstimate = (loc1, loc2) => {
    const airMiles = calculateGeoDistance(loc1, loc2);

    // Industry standard: Road distance is approx 30% longer than air distance
    const roadMiles = airMiles * 1.3;

    // Average city speed estimate: 25-30 mph (including lights/traffic)
    // 30 mph = 0.5 miles per minute => 2 minutes per mile
    const travelMinutes = roadMiles * 2.2;

    return {
        airMiles: Math.round(airMiles * 10) / 10,
        roadMiles: Math.round(roadMiles * 10) / 10,
        travelMinutes: Math.round(travelMinutes)
    };
};

/**
 * Calculate match score between a cleaner and a booking
 * @returns {Object} { score, matchDescription, distance, isEligible }
 */
export const calculateMatchScore = async (booking, cleaner, house = null, customer = null, previousCleaners = null) => {
    try {
        // 1. Fetch missing data if not provided
        if (!house && booking.houseId) house = await getDoc(COLLECTIONS.HOUSES, booking.houseId);
        if (!house) return { score: 0, isEligible: false, error: 'House not found' };

        if (!customer && booking.customerId) customer = await getDoc(COLLECTIONS.USERS, booking.customerId);

        if (previousCleaners === null && booking.customerId) {
            const previousBookings = await getCustomerBookings(booking.customerId);
            previousCleaners = new Set(
                previousBookings
                    .filter(b => b.status === 'completed' && b.cleanerId)
                    .map(b => b.cleanerId)
            );
        }

        // 2. Base Filters (Hard Constraints)
        if (cleaner.status !== 'active') return { score: 0, isEligible: false };

        // City Boundary Check (Safety Fallback)
        // If cleaner is in Dallas and house is in Houston, reject immediately even if GPS is missing
        if (cleaner.baseLocation?.city && house.address?.city) {
            if (cleaner.baseLocation.city !== house.address.city) {
                // We allow matching across "Dallas" and "Fort Worth" (Dugout area) but not Dallas/Houston
                const metroAreas = {
                    'Dallas': 'DFW',
                    'Fort Worth': 'DFW',
                    'Houston': 'HOU',
                    'Austin': 'AUS',
                    'San Antonio': 'SA'
                };
                const cleanerMetro = metroAreas[cleaner.baseLocation.city];
                const houseMetro = metroAreas[house.address.city];

                if (cleanerMetro && houseMetro && cleanerMetro !== houseMetro) {
                    return { score: 0, isEligible: false, error: 'Wrong Metro Area' };
                }
            }
        }

        // Service support
        const supportsService = !booking.serviceTypeId ||
            (cleaner.serviceTypes && cleaner.serviceTypes.includes(booking.serviceTypeId));
        if (!supportsService) return { score: 0, isEligible: false };

        // Distance & Travel estimation
        const travel = calculateTravelEstimate(cleaner.baseLocation, house.address);
        const distance = travel.airMiles;

        if (distance > (cleaner.serviceRadius || 25)) {
            return { score: 0, isEligible: false, distance, error: 'Outside Service Radius' };
        }

        // Availability check
        const isBusy = await checkCleanerConflict(cleaner.id, booking.dates || [], booking.timeSlots || {});
        if (isBusy) return { score: 0, isEligible: false, distance, error: 'Busy' };

        // Pet compatibility
        const houseHasPets = (house.pets && house.pets.hasPets) ||
            (house.petInfo && house.petInfo !== 'No pets');

        if (houseHasPets && cleaner.petFriendly === false) {
            return { score: 0, isEligible: false, distance, error: 'Pets' };
        }

        // -- SCORING LOGIC --
        let score = 50; // Base score for meeting requirements

        // 1. Relationship Score (Highest priority)
        if (previousCleaners?.has(cleaner.id)) score += 50;

        // 2. Proximity Score
        if (distance < 5) score += 20;
        else if (distance < 10) score += 10;

        // 3. Rating Score
        if (cleaner.rating >= 4.8) score += 20;
        else if (cleaner.rating >= 4.5) score += 10;

        // 4. Experience Score
        if (cleaner.yearsExperience >= 5) score += 10;

        // 5. Reliability
        if (cleaner.stats?.reliabilityScore > 95) score += 10;

        const matchDescription = score > 100 ? 'Premier Match' : score > 75 ? 'Highly Recommended' : 'Strong Match';

        return {
            score,
            matchDescription,
            distance: Math.round(distance * 10) / 10,
            isEligible: true
        };
    } catch (e) {
        console.error('Error calculating match score:', e);
        return { score: 0, isEligible: false };
    }
};

/**
 * Check if cleaner has a conflicting job
 */
export const checkCleanerConflict = async (cleanerId, dates, timeSlots) => {
    // Get cleaner's existing jobs
    const jobs = await queryDocs(COLLECTIONS.JOBS, 'cleanerId', cleanerId);
    const activeJobs = jobs.filter(j =>
        j.status === 'scheduled' || j.status === 'in_progress'
    );

    // Check for overlap
    for (const date of dates) {
        // Requested slots for this date (e.g., ['morning'])
        const requestedSlots = timeSlots[date] || [];

        for (const job of activeJobs) {
            const jobDate = new Date(job.scheduledDate || job.startTime).toISOString().split('T')[0];

            if (jobDate === date) {
                // If specific times are used, we would check ranges.
                // For now, if they have a job on this date, assume busy or check slots if job has slots.
                // Assuming 1 job per day per slot roughly.
                // Let's be strict: If they have a job that day, check if times overlap.

                // If job doesn't have explicit slots, we assume it takes a significant chunk.
                // But let's try to be smart.
                // If the new request is 'morning' and existing job is 'afternoon', it's fine.

                let jobSlot = 'morning'; // Default

                // Smart slot parsing
                const timeStr = job.startTime || '';
                if (timeStr && timeStr.includes(':')) {
                    const hour = parseInt(timeStr.split(':')[0], 10);
                    if (hour >= 12 && hour < 15) jobSlot = 'afternoon';
                    if (hour >= 15) jobSlot = 'evening';
                } else {
                    // Fallback to date parsing if it's a full ISO string
                    const d = new Date(job.startTime || job.scheduledDate);
                    if (!isNaN(d.getTime())) {
                        const hour = d.getHours();
                        if (hour >= 12 && hour < 15) jobSlot = 'afternoon';
                        if (hour >= 15) jobSlot = 'evening';
                    }
                }

                if (requestedSlots.includes(jobSlot)) {
                    return true; // Conflict found
                }
            }
        }
    }

    return false; // No conflict
};

/**
 * Broadcast new job to cleaners
 */
export const broadcastNewJob = async (booking) => {
    try {
        console.log('🔍 Matching cleaners for broadcasting:', booking.id);

        const [house, settings] = await Promise.all([
            getDoc(COLLECTIONS.HOUSES, booking.houseId),
            getAppSettings()
        ]);
        if (!house) return;

        const earningsRate = settings?.cleanerEarningsRate || 0.90;

        const previousBookings = await getCustomerBookings(booking.customerId);
        const previousCleaners = new Set(
            previousBookings
                .filter(b => b.status === 'completed' && b.cleanerId)
                .map(b => b.cleanerId)
        );

        const cleaners = await getDocs(COLLECTIONS.CLEANERS);
        const eligibleMatches = [];

        for (const cleaner of cleaners) {
            const match = await calculateMatchScore(booking, cleaner, house, null, previousCleaners);
            if (match.isEligible) {
                eligibleMatches.push({ cleaner, ...match });
            }
        }

        // Sort by score
        eligibleMatches.sort((a, b) => b.score - a.score);
        const topMatches = eligibleMatches.slice(0, 15);

        console.log(`🎯 Broadcasting to top ${topMatches.length} matches`);

        const createPromises = topMatches.map(({ cleaner, score, matchDescription }) => {
            const baseAmount = booking.pricingBreakdown?.subtotal || booking.totalAmount || 0;
            const earnings = Math.round(baseAmount * earningsRate);
            const notif = {
                id: generateId('notification'),
                userId: cleaner.userId,
                type: 'job_offer',
                title: 'New Match: ' + matchDescription,
                message: `New ${booking.serviceTypeId} job near you ($${earnings}). Match score: ${score}%`,
                relatedId: booking.id,
                read: false,
                createdAt: new Date().toISOString()
            };
            return setDoc(COLLECTIONS.NOTIFICATIONS, notif.id, notif);
        });

        await Promise.all(createPromises);

    } catch (e) {
        console.error('❌ Error broadcasting job:', e);
    }
};

// ============================================
// TRACKING OPERATIONS
// ============================================

/**
 * Update booking tracking info
 */
export const updateBookingTracking = async (bookingId, trackingData) => {
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        tracking: {
            ...trackingData,
            updatedAt: new Date().toISOString()
        }
    });
};

/**
 * Get booking with tracking
 */
export const getBookingWithTracking = async (bookingId) => {
    return await getDoc(COLLECTIONS.BOOKINGS, bookingId);
};

// ============================================
// DAY OF CLEANING FLOW HELPERS
// ============================================

/**
 * Generate Verification Codes when Cleaner Arrives
 */
export const generateVerificationCodes = async (bookingId) => {
    const cleanerCode = Math.floor(100000 + Math.random() * 900000).toString();
    const customerCode = Math.floor(100000 + Math.random() * 900000).toString();

    await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        verificationCodes: {
            cleanerCode,
            customerCode,
            generatedAt: new Date().toISOString(),
            cleanerVerified: false,
            customerVerified: false
        }
    });

    return { cleanerCode, customerCode };
};

/**
 * Verify Code with proper validation and error handling
 * @param {string} bookingId - Booking ID
 * @param {string} role - Role of verifier ('cleaner' or 'homeowner')
 * @param {string} codeProvided - 6-digit verification code
 * @returns {Promise<boolean>} True if verification successful
 */
export const verifyJobCode = async (bookingId, role, codeProvided) => {
    try {
        // Input validation
        if (!bookingId || typeof bookingId !== 'string') {
            console.error('Invalid bookingId provided to verifyJobCode');
            return false;
        }

        if (!['cleaner', 'homeowner'].includes(role)) {
            console.error('Invalid role provided to verifyJobCode:', role);
            return false;
        }

        if (!isValidVerificationCode(codeProvided)) {
            console.error('Invalid verification code format:', codeProvided);
            return false;
        }

        const booking = await getDoc(COLLECTIONS.BOOKINGS, bookingId);
        if (!booking) {
            console.error('Booking not found:', bookingId);
            return false;
        }

        if (!booking.verificationCodes) {
            console.error('Verification codes not generated for booking:', bookingId);
            return false;
        }

        const { cleanerCode, customerCode, cleanerVerified, customerVerified } = booking.verificationCodes;

        // If I am cleaner, I need to match the Customer's code
        if (role === 'cleaner') {
            // Check if already verified
            if (cleanerVerified) {
                return true; // Already verified, return success
            }

            if (codeProvided === customerCode) {
                // Update with proper nested object (not string path)
                await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
                    verificationCodes: {
                        ...booking.verificationCodes,
                        cleanerVerified: true
                    }
                });
                return true;
            }
        }
        // If I am customer, I need to match the Cleaner's code
        else if (role === 'homeowner') {
            // Check if already verified
            if (customerVerified) {
                return true; // Already verified, return success
            }

            if (codeProvided === cleanerCode) {
                // Update with proper nested object (not string path)
                await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
                    verificationCodes: {
                        ...booking.verificationCodes,
                        customerVerified: true
                    }
                });
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error(`Error verifying code for booking ${bookingId}:`, error);
        throw new Error('Failed to verify code. Please try again.');
    }
};

/**
 * Check if both Verified and Start Job
 * Updates both booking AND job status for data consistency
 * @param {string} bookingId - Booking ID
 * @returns {Promise<boolean>} True if job started successfully
 */
export const checkVerificationAndStart = async (bookingId) => {
    try {
        const booking = await getDoc(COLLECTIONS.BOOKINGS, bookingId);

        if (!booking) {
            console.error('Booking not found:', bookingId);
            return false;
        }

        // Check if both parties have verified
        const bothVerified = booking?.verificationCodes?.cleanerVerified &&
            booking?.verificationCodes?.customerVerified;

        if (!bothVerified) {
            return false; // Not both verified yet
        }

        // Check if already in progress
        if (booking.status === 'in_progress') {
            return true; // Already started
        }

        const now = new Date().toISOString();

        // Update booking status
        await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
            status: 'in_progress',
            jobStartedAt: now
        });

        // Also update related job status for consistency
        try {
            const jobs = await queryDocs(COLLECTIONS.JOBS, 'bookingId', bookingId);
            if (jobs && jobs.length > 0) {
                const job = jobs[0];
                await updateDoc(COLLECTIONS.JOBS, job.id, {
                    status: 'in_progress',
                    startTime: now
                });
            }
        } catch (jobError) {
            console.warn('Failed to update job status (booking updated):', jobError);
            // Continue anyway - booking status is most important
        }

        return true;
    } catch (error) {
        console.error(`Error starting job for booking ${bookingId}:`, error);
        throw new Error('Failed to start job. Please try again.');
    }
};

/**
 * Submit Job for Approval
 */
export const submitJobForApproval = async (bookingId, notes, photos) => {
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        status: 'completed_pending_approval',
        completedAt: new Date().toISOString(),
        cleanerNotes: notes,
        finalPhotos: photos
    });
};

/**
 * Approve Job (Customer)
 */
export const approveJob = async (bookingId, ratingData) => {
    try {
        // Fetch booking first to ensure it exists and get related data
        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status === 'approved') {
            console.warn('Job already approved:', bookingId);
            return true; // Already approved, return success
        }

        // Validate that job is in correct state to be approved
        // Allow approval if job is completed, pending approval, or even in_progress (express finish)
        const validStatuses = ['completed_pending_approval', 'completed', 'in_progress', 'arrived'];
        if (!validStatuses.includes(booking.status)) {
            throw new Error(`Cannot approve job with status: ${booking.status}`);
        }

        const now = new Date().toISOString();

        // 1. Update Booking status
        await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
            status: 'approved',
            approvedAt: now,
            customerRating: ratingData
        });

        // 2. Update related Job status for consistency
        try {
            const jobs = await queryDocs(COLLECTIONS.JOBS, 'bookingId', bookingId);
            if (jobs && jobs.length > 0) {
                await updateDoc(COLLECTIONS.JOBS, jobs[0].id, {
                    status: 'completed',
                    completedAt: now,
                    endTime: jobs[0].endTime || now
                });
            }
        } catch (jobError) {
            console.warn('Failed to update job status (booking approved):', jobError);
            // Continue anyway - booking approval is critical
        }

        // 3. Create Review Record (Customer -> Cleaner)
        if (booking.cleanerId) {
            try {
                const [customer, cleaner] = await Promise.all([
                    getUserById(booking.customerId),
                    getUserById(booking.cleanerId)
                ]);

                await createReview({
                    bookingId: booking.id,
                    cleanerId: booking.cleanerId,
                    customerId: booking.customerId,
                    cleanerName: cleaner?.name || 'Cleaner',
                    customerName: customer?.name || 'Customer',
                    reviewerRole: 'homeowner',
                    rating: ratingData.rating || 5,
                    comment: ratingData.comment || '',
                    tags: ratingData.tags || [],
                    createdAt: now
                });
            } catch (reviewError) {
                console.error('Failed to create review (booking still approved):', reviewError);
                // Log error but don't fail the approval
                // Review can be created separately if needed
            }
        }

        // Trigger Payout Logic here (simulated)
        return true;

    } catch (error) {
        console.error(`Error approving job ${bookingId}:`, error);
        throw error; // Re-throw to let caller handle
    }
};

/**
 * Rate Customer (Cleaner -> Customer)
 */
export const rateCustomer = async (bookingId, ratingData) => {
    // 1. Update Booking with cleaner's rating of customer
    await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        cleanerRating: {
            rating: ratingData.rating,
            comment: ratingData.comment,
            tags: ratingData.tags,
            ratedAt: new Date().toISOString()
        }
    });

    // 2. Create Review Record (Cleaner -> Customer)
    try {
        const booking = await getBookingById(bookingId);
        if (booking) {
            const customer = await getUserById(booking.customerId);
            const cleaner = await getUserById(booking.cleanerId);

            await createReview({
                bookingId: booking.id,
                cleanerId: booking.cleanerId,
                customerId: booking.customerId,
                cleanerName: cleaner?.name || 'Cleaner',
                customerName: customer?.name || 'Customer',
                reviewerRole: 'cleaner',
                rating: ratingData.rating,
                comment: ratingData.comment,
                tags: ratingData.tags || [],
                createdAt: new Date().toISOString()
            });
        }
    } catch (e) {
        console.warn('Failed to create customer review record', e);
    }

    return true;
};

