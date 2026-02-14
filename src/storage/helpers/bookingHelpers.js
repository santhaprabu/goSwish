/**
 * ============================================================================
 * BOOKING OPERATIONS
 * ============================================================================
 *
 * Handles booking lifecycle operations for customers.
 * Bookings represent the homeowner's request (the "Demand" side).
 *
 * @module storage/helpers/bookingHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, queryDocs, generateId } from '../db.js';
import { toLocalDateStr, normalizeStateCode, SLOT_START_HOURS } from './constants.js';
import { parseLocalDate } from '../../utils/dateUtils.js';

// Lazy imports to avoid circular dependencies
let getHouseById, lockConversationForBooking, createReview, getUserById;
const loadDependencies = async () => {
    if (!getHouseById) {
        const houseHelpers = await import('./houseHelpers.js');
        getHouseById = houseHelpers.getHouseById;
    }
    if (!lockConversationForBooking) {
        const messageHelpers = await import('./messageHelpers.js');
        lockConversationForBooking = messageHelpers.lockConversationForBooking;
    }
    if (!createReview) {
        const reviewHelpers = await import('./reviewHelpers.js');
        createReview = reviewHelpers.createReview;
    }
    if (!getUserById) {
        const userHelpers = await import('./userHelpers.js');
        getUserById = userHelpers.getUserById;
    }
};

/**
 * Check if booking number exists in database
 * @param {string} bookingNumber - Booking number to check
 * @returns {Promise<boolean>} True if exists
 */
const bookingNumberExists = async (bookingNumber) => {
    const existingBookings = await queryDocs(COLLECTIONS.BOOKINGS, 'bookingId', bookingNumber);
    return existingBookings.length > 0;
};

/**
 * Resolves a booking document ID from either an internal document ID (booking-...)
 * or a formatted booking number (ST-YYYY-MMDD-NNNNN).
 * @param {string} idOrNumber - ID or booking number
 * @returns {Promise<string|null>} Resolved document ID
 */
export const resolveBookingDocId = async (idOrNumber) => {
    if (!idOrNumber) return null;

    if (typeof idOrNumber === 'string' && idOrNumber.startsWith('booking-')) {
        return idOrNumber;
    }

    try {
        const bookings = await queryDocs(COLLECTIONS.BOOKINGS, 'bookingId', idOrNumber);
        if (bookings && bookings.length > 0) {
            return bookings[0].id;
        }
    } catch (e) {
        console.warn('Error resolving booking ID:', e);
    }

    return idOrNumber;
};

/**
 * Generate unique booking number with collision check
 * Format: XX-YYYY-MMDD-##### (e.g., TX-2026-1026-38547)
 * @param {string} houseId - House ID for state code
 * @param {string} bookingDate - Booking date
 * @returns {Promise<string>} Unique booking number
 */
const generateBookingNumber = async (houseId, bookingDate) => {
    await loadDependencies();

    let stateCode = 'TX';

    try {
        if (houseId) {
            const house = await getHouseById(houseId);
            if (house?.address?.state) {
                stateCode = normalizeStateCode(house.address.state);
            }
        }
    } catch (e) {
        console.warn('Booking ID generation: house lookup failed, using default state TX');
    }

    const date = parseLocalDate(bookingDate || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const mmdd = `${month}${day}`;

    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const bookingNumber = `${stateCode}-${year}-${mmdd}-${randomSuffix}`;

        const exists = await bookingNumberExists(bookingNumber);
        if (!exists) {
            console.log(`Unique Booking ID Created: ${bookingNumber} (attempt ${attempt + 1})`);
            return bookingNumber;
        }
        console.warn(`Booking ID collision detected: ${bookingNumber}, retrying...`);
    }

    const timestampSuffix = Date.now().toString().slice(-6);
    const fallbackNumber = `${stateCode}-${year}-${mmdd}-${timestampSuffix}`;
    console.warn(`Using timestamp fallback for booking ID: ${fallbackNumber}`);
    return fallbackNumber;
};

/**
 * Create booking with server-side validation
 *
 * SECURITY: Validates:
 * - All booking dates are in the future
 * - Same-day bookings have valid time slots
 * - Required fields are present
 *
 * @param {string} customerId - Customer's user ID
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} Created booking object
 * @throws {Error} If validation fails
 */
export const createBooking = async (customerId, bookingData) => {
    const todayStr = toLocalDateStr(new Date());
    const currentHour = new Date().getHours();

    // Normalize data formats
    let dates = bookingData.dates || [];
    let timeSlots = bookingData.timeSlots || {};

    if (bookingData.dateOptions && Array.isArray(bookingData.dateOptions)) {
        dates = bookingData.dateOptions.map(d => d.date);
        timeSlots = {};
        for (const opt of bookingData.dateOptions) {
            timeSlots[opt.date] = opt.slots || [];
        }
    }

    // Validate dates
    for (const dateStr of dates) {
        if (dateStr < todayStr) {
            throw new Error(`Cannot book for past date: ${dateStr}`);
        }

        if (dateStr === todayStr) {
            const slots = timeSlots[dateStr] || bookingData.dateOptions?.find(d => d.date === dateStr)?.slots || [];
            for (const slotId of slots) {
                const slotStartHour = SLOT_START_HOURS[slotId];
                if (slotStartHour !== undefined && currentHour >= slotStartHour) {
                    throw new Error(`Time slot "${slotId}" for today has already passed`);
                }
            }
        }
    }

    // Validate required fields
    if (!customerId) throw new Error('Customer ID is required');
    if (!bookingData.houseId) throw new Error('House ID is required');
    if (!bookingData.serviceTypeId && !bookingData.serviceType) throw new Error('Service type is required');
    if (dates.length === 0) throw new Error('At least one booking date is required');

    const firstBookingDate = dates[0] || new Date().toISOString();
    const bookingNumber = await generateBookingNumber(bookingData.houseId, firstBookingDate);

    // Normalize addOns
    let addOnIds = bookingData.addOnIds || [];
    let addOnDetails = null;
    if (bookingData.addOns && Array.isArray(bookingData.addOns)) {
        if (bookingData.addOns.length > 0 && typeof bookingData.addOns[0] === 'object') {
            addOnIds = bookingData.addOns.map(a => a.id);
            addOnDetails = bookingData.addOns;
        } else {
            addOnIds = bookingData.addOns;
        }
    }

    const pricingBreakdown = bookingData.pricingBreakdown || bookingData.pricing || null;
    const totalAmount = bookingData.totalAmount || pricingBreakdown?.total || 0;

    const booking = {
        id: generateId('booking'),
        bookingId: bookingNumber,
        customerId: customerId,
        houseId: bookingData.houseId,
        serviceTypeId: bookingData.serviceTypeId || bookingData.serviceType,
        addOnIds: addOnIds,
        addOnDetails: addOnDetails,
        dates: dates,
        timeSlots: timeSlots,
        specialNotes: bookingData.specialNotes || '',
        paymentMethod: bookingData.paymentMethod || 'card',
        totalAmount: totalAmount,
        pricingBreakdown: pricingBreakdown,
        discount: bookingData.discount || bookingData.promoCode || null,
        status: 'booking-placed',
        paymentStatus: 'pending',
        cleanerId: null,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    console.log('Creating booking:', booking);
    return await setDoc(COLLECTIONS.BOOKINGS, booking.id, booking);
};

/**
 * Get booking by ID (supports document ID or booking number)
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @returns {Promise<Object|null>} Booking object or null
 */
export const getBookingById = async (bookingIdOrNumber) => {
    const bookingId = await resolveBookingDocId(bookingIdOrNumber);
    return await getDoc(COLLECTIONS.BOOKINGS, bookingId);
};

/**
 * Get customer's bookings
 * @param {string} customerId - Customer's user ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getCustomerBookings = async (customerId) => {
    return await queryDocs(COLLECTIONS.BOOKINGS, 'customerId', customerId);
};

/**
 * Get cleaner's bookings
 * @param {string} cleanerId - Cleaner's ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getCleanerBookings = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.BOOKINGS, 'cleanerId', cleanerId);
};

/**
 * Get available bookings (confirmed but no cleaner)
 * @returns {Promise<Array>} Array of available booking objects
 */
export const getAvailableBookings = async () => {
    const bookings = await queryDocs(COLLECTIONS.BOOKINGS, 'status', 'booking-placed');
    return bookings.filter(b => !b.cleanerId);
};

/**
 * Update booking
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated booking object
 */
export const updateBooking = async (bookingIdOrNumber, updates) => {
    const bookingId = await resolveBookingDocId(bookingIdOrNumber);
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, updates);
};

/**
 * Cancel booking - also locks any associated conversation
 * @param {string} bookingId - Booking's ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated booking object
 */
export const cancelBooking = async (bookingId, reason) => {
    await loadDependencies();

    const result = await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
    });

    try {
        await lockConversationForBooking(bookingId);
    } catch (lockError) {
        console.warn('Failed to lock conversation on cancellation:', lockError);
    }

    return result;
};

// ============================================
// TRACKING OPERATIONS
// ============================================

/**
 * Update booking tracking info
 * @param {string} bookingId - Booking's ID
 * @param {Object} trackingData - Tracking information
 * @returns {Promise<Object>} Updated booking object
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
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @returns {Promise<Object|null>} Booking object with tracking
 */
export const getBookingWithTracking = async (bookingIdOrNumber) => {
    const bookingId = await resolveBookingDocId(bookingIdOrNumber);
    return await getDoc(COLLECTIONS.BOOKINGS, bookingId);
};

// ============================================
// DAY OF CLEANING FLOW
// ============================================

/**
 * Generate verification codes when cleaner arrives
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @returns {Promise<Object>} Object with cleanerCode and customerCode
 */
export const generateVerificationCodes = async (bookingIdOrNumber) => {
    const bookingId = await resolveBookingDocId(bookingIdOrNumber);
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
 * Verify job code with proper validation
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @param {string} role - Role of verifier ('cleaner' or 'homeowner')
 * @param {string} codeProvided - 6-digit verification code
 * @returns {Promise<boolean>} True if verification successful
 */
export const verifyJobCode = async (bookingIdOrNumber, role, codeProvided) => {
    try {
        const bookingId = await resolveBookingDocId(bookingIdOrNumber);

        if (!bookingId || typeof bookingId !== 'string') {
            console.error('Invalid bookingId provided to verifyJobCode');
            return false;
        }

        if (!['cleaner', 'homeowner'].includes(role)) {
            console.error('Invalid role provided to verifyJobCode:', role);
            return false;
        }

        if (!codeProvided || typeof codeProvided !== 'string' || !/^\d{6}$/.test(codeProvided)) {
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

        if (role === 'cleaner') {
            if (cleanerVerified) return true;

            if (codeProvided === customerCode) {
                await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
                    verificationCodes: {
                        ...booking.verificationCodes,
                        cleanerVerified: true
                    }
                });
                return true;
            }
        } else if (role === 'homeowner') {
            if (customerVerified) return true;

            if (codeProvided === cleanerCode) {
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
        console.error(`Error verifying code for booking:`, error);
        throw new Error('Failed to verify code. Please try again.');
    }
};

/**
 * Check if both parties verified and start the job
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @returns {Promise<boolean>} True if job started successfully
 */
export const checkVerificationAndStart = async (bookingIdOrNumber) => {
    try {
        const bookingId = await resolveBookingDocId(bookingIdOrNumber);
        const booking = await getDoc(COLLECTIONS.BOOKINGS, bookingId);

        if (!booking) {
            console.error('Booking not found:', bookingId);
            return false;
        }

        const bothVerified = booking?.verificationCodes?.cleanerVerified &&
            booking?.verificationCodes?.customerVerified;

        if (!bothVerified) {
            return false;
        }

        if (booking.status === 'in_progress') {
            return true;
        }

        const now = new Date().toISOString();

        await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
            status: 'in_progress',
            jobStartedAt: now
        });

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
        }

        return true;
    } catch (error) {
        console.error(`Error starting job for booking:`, error);
        throw new Error('Failed to start job. Please try again.');
    }
};

/**
 * Submit job for approval
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @param {string} notes - Cleaner's notes
 * @param {Array} photos - Final photos
 * @returns {Promise<Object>} Updated booking object
 */
export const submitJobForApproval = async (bookingIdOrNumber, notes, photos) => {
    const bookingId = await resolveBookingDocId(bookingIdOrNumber);
    return await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        status: 'completed_pending_approval',
        completedAt: new Date().toISOString(),
        cleanerNotes: notes,
        finalPhotos: photos
    });
};

/**
 * Approve job (Customer action)
 * @param {string} bookingIdOrNumber - Booking ID or formatted number
 * @param {Object} ratingData - Customer's rating data
 * @returns {Promise<boolean>} True if approved successfully
 */
export const approveJob = async (bookingIdOrNumber, ratingData) => {
    await loadDependencies();

    try {
        const bookingId = await resolveBookingDocId(bookingIdOrNumber);
        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status === 'approved') {
            console.warn('Job already approved:', bookingId);
            return true;
        }

        const validStatuses = ['completed_pending_approval', 'completed', 'in_progress', 'arrived'];
        if (!validStatuses.includes(booking.status)) {
            throw new Error(`Cannot approve job with status: ${booking.status}`);
        }

        const now = new Date().toISOString();

        await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
            status: 'approved',
            approvedAt: now,
            customerRating: ratingData
        });

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
        }

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
            }
        }

        try {
            await lockConversationForBooking(bookingId);
        } catch (lockError) {
            console.warn('Failed to lock conversation (booking still approved):', lockError);
        }

        return true;

    } catch (error) {
        console.error(`Error approving job:`, error);
        throw error;
    }
};

/**
 * Rate customer (Cleaner action)
 * @param {string} bookingId - Booking's ID
 * @param {Object} ratingData - Cleaner's rating of customer
 * @returns {Promise<boolean>} True if rated successfully
 */
export const rateCustomer = async (bookingId, ratingData) => {
    await loadDependencies();

    await updateDoc(COLLECTIONS.BOOKINGS, bookingId, {
        cleanerRating: {
            rating: ratingData.rating,
            comment: ratingData.comment,
            tags: ratingData.tags,
            ratedAt: new Date().toISOString()
        }
    });

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
