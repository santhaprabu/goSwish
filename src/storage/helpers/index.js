/**
 * ============================================================================
 * STORAGE HELPERS - UNIFIED EXPORT
 * ============================================================================
 *
 * This module re-exports all helper functions for backwards compatibility.
 * Import from individual modules for tree-shaking benefits.
 *
 * Example usage:
 * - Full import: import { createBooking, getCleanerJobs } from './storage/helpers'
 * - Selective: import { createBooking } from './storage/helpers/bookingHelpers'
 *
 * @module storage/helpers
 */

// Constants and validation helpers
export {
    ALLOWED_BOOKING_STATUSES,
    ALLOWED_JOB_STATUSES,
    ACTIVE_BOOKING_STATUSES_FOR_MESSAGING,
    LOCKED_BOOKING_STATUSES,
    SLOT_START_HOURS,
    METRO_AREAS,
    isValidVerificationCode,
    isValidBookingStatus,
    isValidJobStatus,
    canMessageForBookingStatus,
    isConversationLocked,
    validateInput,
    toLocalDateStr,
    extractDateFromObject,
    normalizeStateCode,
} from './constants.js';

// User operations
export {
    getUserById,
    getUserByEmail,
    updateUser,
} from './userHelpers.js';

// House operations
export {
    createHouse,
    getUserHouses,
    getHouseById,
    updateHouse,
    deleteHouse,
} from './houseHelpers.js';

// Booking operations
export {
    resolveBookingDocId,
    createBooking,
    getBookingById,
    getCustomerBookings,
    getCleanerBookings,
    getAvailableBookings,
    updateBooking,
    cancelBooking,
    updateBookingTracking,
    getBookingWithTracking,
    generateVerificationCodes,
    verifyJobCode,
    checkVerificationAndStart,
    submitJobForApproval,
    approveJob,
    rateCustomer,
} from './bookingHelpers.js';

// Cleaner operations
export {
    createCleanerProfile,
    getCleanerByUserId,
    getAllCleaners,
    updateCleanerProfile,
    getCleanerSchedule,
    getCleanerStats,
    getCleanerAvailability,
    updateCleanerAvailability,
    bulkUpdateCleanerAvailability,
    getAvailableCleanersForSlot,
    cleanupOldAvailability,
    checkCleanerConflict,
} from './cleanerHelpers.js';

// Job operations
export {
    createJob,
    acceptJobOffer,
    getJobById,
    getCleanerJobs,
    updateJob,
    updateJobStatus,
} from './jobHelpers.js';

// Review operations
export {
    createReview,
    getCleanerReviews,
    getCustomerReviews,
    getCleanerReviewsWithStats,
    addReviewResponse,
} from './reviewHelpers.js';

// Service type and add-on operations
export {
    getServiceTypes,
    getServiceTypeById,
    getAddOns,
    getAddOnById,
    getAppSettings,
} from './serviceHelpers.js';

// Promo code operations
export {
    createPromoCode,
    getPromoCodeByCode,
    validatePromoCode,
    applyPromoCode,
} from './promoHelpers.js';

// Notification operations
export {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    deleteJobOfferNotifications,
} from './notificationHelpers.js';

// Message operations
export {
    createConversation,
    getUserConversations,
    getConversationForBooking,
    getConversation,
    getOrCreateConversationForBooking,
    getConversationMessages,
    sendMessage,
    lockConversationForBooking,
    markMessageAsRead,
    getUnreadMessageCount,
} from './messageHelpers.js';

// Earnings operations
export {
    createTransaction,
    getCleanerEarnings,
    getCleanerDailyEarnings,
} from './earningsHelpers.js';

// Geolocation operations
export {
    calculateGeoDistance,
    calculateTravelEstimate,
} from './geoHelpers.js';

// Matching operations
export {
    calculateMatchScore,
    broadcastNewJob,
} from './matchingHelpers.js';
