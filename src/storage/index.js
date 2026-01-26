/**
 * GoSwish Local Storage System
 * 
 * A complete persistent storage solution using IndexedDB
 * Works offline-first with no external dependencies
 */

// Database core
export {
    initDB,
    generateId,
    addDoc,
    setDoc,
    updateDoc,
    getDoc,
    getDocs,
    queryDocs,
    deleteDoc,
    clearCollection,
    clearDatabase,
    exportDatabase,
    importDatabase,
    COLLECTIONS,
} from './db.js';

// Authentication
export {
    getCurrentUser,
    signUpWithEmail,
    signInWithEmail,
    sendOtp,
    signInWithOtp,
    signOut,
    updateUserProfile,
    changePassword,
    sendPasswordResetEmail,
    verifyEmail,
    deleteUserAccount,
} from './auth.js';

// Database initialization
export {
    initializeDatabase,
    verifyDatabase,
    resetDatabase,
} from './initDatabase.js';

// Helper functions
export {
    // Users
    getUserById,
    getUserByEmail,
    updateUser,

    // Houses
    createHouse,
    getUserHouses,
    getHouseById,
    updateHouse,
    deleteHouse,

    // Bookings
    createBooking,
    getBookingById,
    getAvailableBookings,
    getCustomerBookings,
    getCleanerBookings,
    updateBooking,
    cancelBooking,

    // Cleaners
    createCleanerProfile,
    getCleanerByUserId,
    getAllCleaners,
    updateCleanerProfile,

    // Jobs
    createJob,
    acceptJobOffer,
    getJobById,
    getCleanerJobs,
    updateJob,
    updateJobStatus,

    // Reviews
    createReview,
    getCleanerReviews,
    getCustomerReviews,
    getCleanerReviewsWithStats,
    addReviewResponse,

    // Service Types
    getServiceTypes,
    getServiceTypeById,

    // Add-ons
    getAddOns,
    getAddOnById,

    // Promo Codes
    getPromoCodeByCode,
    validatePromoCode,
    applyPromoCode,

    // Settings
    getAppSettings,

    // Notifications
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Messages
    createConversation,
    getUserConversations,
    getConversation,
    getConversationMessages,
    sendMessage,
    markMessageAsRead,
    getUnreadMessageCount,

    // Earnings
    createTransaction,
    getCleanerEarnings,
    getCleanerDailyEarnings,

    // Cleaner Stats & Schedule
    getCleanerSchedule,
    getCleanerStats,

    // Cleaner Availability
    getCleanerAvailability,
    updateCleanerAvailability,
    bulkUpdateCleanerAvailability,
    getAvailableCleanersForSlot,
    cleanupOldAvailability,
} from './helpers.js';

// Aliases for consistency
export { getPromoCodeByCode as getPromoCode, getCustomerBookings as getUserBookings } from './helpers.js';

// Seed Data (for testing)
export {
    seedAllData,
    createCustomerProfiles,
    createCleanerProfiles,
    getSeedingStats,
} from './seedData.js';
