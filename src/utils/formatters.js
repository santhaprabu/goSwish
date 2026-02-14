/**
 * Formatting Utilities for GoSwish
 * 
 * Contains functions to format IDs, dates, and other display values
 * 
 * IMPORTANT: Always use local timezone for date operations!
 * All date functions now use the centralized dateUtils module for consistency.
 */

// Re-export centralized date utilities for backward compatibility
import {
    toLocalDateString,
    getTodayString as getTodayDateString,
    formatDisplayDate,
    parseLocalDate
} from './dateUtils';

// Re-export for components still importing from formatters
export { toLocalDateString, getTodayDateString, formatDisplayDate, parseLocalDate };

/**
 * Format a booking ID for display
 * 
 * GoSwish uses the format: XX-YYYY-MMDD-#### (e.g., TX-2026-0202-4483)
 * - XX: 2-letter state code
 * - YYYY: Year
 * - MMDD: Month and day
 * - ####: 4-digit random suffix
 * 
 * This function:
 * 1. Returns the formatted bookingId if it already matches the expected format
 * 2. Falls back to generating a display ID from raw ID if needed
 * 
 * @param {string} idOrBookingId - Either a formatted bookingId or raw id
 * @param {string} bookingIdField - Optional explicit bookingId field (the formatted one)
 * @returns {string} Formatted booking ID for display
 */
export const formatBookingId = (idOrBookingId, bookingIdField = null) => {
    // If bookingIdField is provided and valid, use it (this is the formatted ID)
    if (bookingIdField && typeof bookingIdField === 'string' && bookingIdField.length > 3) {
        return bookingIdField.toUpperCase();
    }

    if (!idOrBookingId) return 'N/A';

    // Check if it already matches the GoSwish format: XX-YYYY-MMDD-#####
    // Format: 2-letter state, 4-digit year, 4-digit MMDD, 4-5 digit suffix
    // Examples: TX-2026-0202-44831, CA-2026-1226-91832
    if (/^[A-Z]{2}-\d{4}-\d{4}-\d{4,5}$/i.test(idOrBookingId)) {
        return idOrBookingId.toUpperCase();
    }

    // Also accept legacy format with just year and suffix
    // Examples: TX-2026-4483
    if (/^[A-Z]{2}-\d{4}-\d{4,5}$/i.test(idOrBookingId)) {
        return idOrBookingId.toUpperCase();
    }

    // If it's a raw document ID like "booking-1770091897037-fkl75so6w"
    // Generate a fallback display format
    const parts = idOrBookingId.split('-');

    if (parts.length >= 3 && parts[0] === 'booking') {
        // Extract timestamp for date parts
        const timestamp = parts[1] || '';
        if (timestamp.length >= 13) {
            try {
                const date = new Date(parseInt(timestamp));
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const random = parts[2] || '';
                    // Use first 5 chars of random as suffix (matching generateBookingNumber)
                    const suffix = (random.slice(0, 5) || '00000').toUpperCase();
                    // Remove letters, keep only digits, pad to 5
                    const numericSuffix = suffix.replace(/[^0-9]/g, '').padStart(5, '0').slice(0, 5);
                    return `TX-${year}-${month}${day}-${numericSuffix || '00000'}`;
                }
            } catch (e) {
                // Fall through to fallback
            }
        }
    }

    // Final fallback: Return as-is if it looks like a booking ID, otherwise format it
    // This ensures we don't mangle valid IDs
    if (idOrBookingId.includes('-') && idOrBookingId.length > 10) {
        return idOrBookingId.toUpperCase();
    }

    return `ID-${idOrBookingId.slice(-8).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
};

/**
 * Format a job ID for display
 * Similar to booking ID but with different prefix
 * 
 * @param {string} jobId - The raw job ID
 * @param {string} state - Optional state code (default: 'TX')
 * @returns {string} Formatted job ID for display
 */
export const formatJobId = (jobId, state = 'TX') => {
    if (!jobId) return 'N/A';

    // Same logic as booking ID
    return formatBookingId(jobId, state).replace(/^[A-Z]{2}-/, `${state}J-`);
};

/**
 * Format a conversation ID for display
 * 
 * @param {string} convId - The raw conversation ID
 * @returns {string} Formatted conversation ID
 */
export const formatConversationId = (convId) => {
    if (!convId) return 'N/A';

    // Just use last 6 characters
    return `MSG-${convId.slice(-6).toUpperCase()}`;
};

/**
 * Format currency amount
 * 
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * Format a date for display
 * 
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    const defaultOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    };

    return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format time for display
 * 
 * @param {string|Date} time - The time to format
 * @returns {string} Formatted time string (e.g., "9:00 AM")
 */
export const formatTime = (time) => {
    if (!time) return 'N/A';

    const dateObj = typeof time === 'string' ? new Date(time) : time;

    if (isNaN(dateObj.getTime())) return 'Invalid Time';

    return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};
