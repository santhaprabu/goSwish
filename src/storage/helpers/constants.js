/**
 * ============================================================================
 * STORAGE CONSTANTS & VALIDATION HELPERS
 * ============================================================================
 *
 * Shared constants and validation utilities used across all helper modules.
 *
 * @module storage/helpers/constants
 */

import { toLocalDateString } from '../../utils/dateUtils.js';

// ============================================
// BOOKING STATUS CONSTANTS
// ============================================

/**
 * Allowed booking statuses representing the lifecycle of a booking.
 *
 * Flow:
 * 1. booking-placed: User submits request
 * 2. matched/scheduled: System finds a cleaner
 * 3. on_the_way -> arrived -> in_progress: Day of service
 * 4. completed_pending_approval: Cleaner marks finished
 * 5. approved: Homeowner confirms (or auto-confirm)
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
 * Allowed job statuses representing the lifecycle of a cleaner's task.
 * These largely mirror booking statuses but track the Work Unit.
 */
export const ALLOWED_JOB_STATUSES = [
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
];

/**
 * Active booking statuses that allow messaging.
 */
export const ACTIVE_BOOKING_STATUSES_FOR_MESSAGING = [
    'booking-placed',
    'pending',
    'confirmed',
    'matched',
    'scheduled',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed_pending_approval'
];

/**
 * Statuses that lock the conversation.
 */
export const LOCKED_BOOKING_STATUSES = [
    'completed',
    'approved',
    'cancelled',
    'declined'
];

/**
 * Time slot start hours for validation.
 */
export const SLOT_START_HOURS = {
    morning: 9,
    afternoon: 12,
    evening: 15
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate verification code format
 * @param {string} code - Verification code to validate
 * @returns {boolean} True if valid (exactly 6 digits)
 */
export const isValidVerificationCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    return /^\d{6}$/.test(code);
};

/**
 * Validate booking status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
export const isValidBookingStatus = (status) => {
    return ALLOWED_BOOKING_STATUSES.includes(status);
};

/**
 * Validate job status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
export const isValidJobStatus = (status) => {
    return ALLOWED_JOB_STATUSES.includes(status);
};

/**
 * Check if a booking status allows messaging
 * @param {string} status - Booking status
 * @returns {boolean} True if messaging is allowed
 */
export const canMessageForBookingStatus = (status) => {
    return ACTIVE_BOOKING_STATUSES_FOR_MESSAGING.includes(status);
};

/**
 * Check if a booking status locks the conversation
 * @param {string} status - Booking status
 * @returns {boolean} True if conversation is locked
 */
export const isConversationLocked = (status) => {
    return LOCKED_BOOKING_STATUSES.includes(status);
};

/**
 * Sanitize and validate input
 * @param {any} value - Value to validate
 * @param {string} type - Expected type ('string', 'number', 'object', 'array')
 * @param {boolean} required - Whether value is required
 * @returns {{valid: boolean, error?: string, value: any}}
 */
export const validateInput = (value, type, required = true) => {
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
// DATE UTILITIES
// ============================================

/**
 * Convert date to local date string (YYYY-MM-DD format).
 * Uses centralized utility to avoid UTC timezone shift issues.
 * @param {Date|string} date - Date to convert
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const toLocalDateStr = (date) => {
    const result = toLocalDateString(date);
    return result || '';
};

/**
 * Extract valid YYYY-MM-DD date from job/booking object.
 * Priority: completedAt > updatedAt > createdAt > endTime
 * @param {Object} obj - Object with date fields
 * @returns {string|null} Date string or null
 */
export const extractDateFromObject = (obj) => {
    const candidates = [obj.completedAt, obj.updatedAt, obj.createdAt, obj.endTime];
    for (const c of candidates) {
        if (c && typeof c === 'string') {
            if (c.includes('T')) return c.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
        }
    }
    return null;
};

// ============================================
// STATE CODE UTILITIES
// ============================================

/**
 * Complete mapping of all 50 US states + DC to 2-letter codes.
 */
const STATE_MAP = {
    'california': 'CA', 'texas': 'TX', 'florida': 'FL', 'new york': 'NY',
    'pennsylvania': 'PA', 'illinois': 'IL', 'ohio': 'OH', 'georgia': 'GA',
    'north carolina': 'NC', 'michigan': 'MI', 'new jersey': 'NJ',
    'massachusetts': 'MA', 'virginia': 'VA', 'washington': 'WA',
    'arizona': 'AZ', 'tennessee': 'TN', 'indiana': 'IN', 'maryland': 'MD',
    'missouri': 'MO', 'wisconsin': 'WI', 'colorado': 'CO', 'minnesota': 'MN',
    'south carolina': 'SC', 'alabama': 'AL', 'louisiana': 'LA', 'kentucky': 'KY',
    'oklahoma': 'OK', 'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA',
    'nevada': 'NV', 'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS',
    'new mexico': 'NM', 'nebraska': 'NE', 'idaho': 'ID', 'west virginia': 'WV',
    'hawaii': 'HI', 'new hampshire': 'NH', 'maine': 'ME', 'rhode island': 'RI',
    'montana': 'MT', 'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND',
    'alaska': 'AK', 'vermont': 'VT', 'wyoming': 'WY', 'oregon': 'OR',
    'district of columbia': 'DC', 'washington dc': 'DC', 'washington d.c.': 'DC'
};

/**
 * Normalize state name to 2-letter code.
 * @param {string} state - State name or code
 * @returns {string} 2-letter state code (defaults to 'TX')
 */
export const normalizeStateCode = (state) => {
    if (!state) return 'TX';
    if (state.length === 2) return state.toUpperCase();

    const normalized = STATE_MAP[state.toLowerCase()];
    return normalized || state.substring(0, 2).toUpperCase();
};

/**
 * Metro area mappings for city matching.
 */
export const METRO_AREAS = {
    'Dallas': 'DFW',
    'Fort Worth': 'DFW',
    'Houston': 'HOU',
    'Austin': 'AUS',
    'San Antonio': 'SA'
};
