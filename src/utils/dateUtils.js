/**
 * ============================================================================
 * CENTRALIZED DATE UTILITIES - TIMEZONE-SAFE DATE HANDLING
 * ============================================================================
 * 
 * This module provides consistent, timezone-safe date handling across the
 * entire GoSwish application.
 * 
 * THE PROBLEM:
 * JavaScript's `new Date("2026-02-04")` interprets date-only strings as UTC
 * midnight. In Central Time (UTC-6), this becomes "2026-02-03 18:00:00",
 * causing dates to appear one day earlier than expected.
 * 
 * THE SOLUTION:
 * 1. Always parse date-only strings (YYYY-MM-DD) as LOCAL time
 * 2. Always extract dates from ISO strings by taking the date portion BEFORE
 *    any timezone conversion
 * 3. Use these utility functions EVERYWHERE instead of raw `new Date()`
 * 
 * USAGE:
 * import { parseLocalDate, toLocalDateString, formatDisplayDate } from '../utils/dateUtils';
 */

/**
 * Parse a date string into a Date object in LOCAL timezone.
 * This is the ONLY function that should be used to convert strings to Date objects.
 * 
 * @param {string|Date|number|null} dateInput - The date to parse
 * @returns {Date} A Date object in local timezone
 * 
 * @example
 * parseLocalDate("2026-02-04")           // Feb 4, 2026 00:00:00 LOCAL
 * parseLocalDate("2026-02-04T10:30:00Z") // Uses date portion: Feb 4, 2026
 * parseLocalDate(new Date())             // Returns the same Date
 */
export const parseLocalDate = (dateInput) => {
    if (!dateInput) return new Date();

    // Already a Date object - return as-is
    if (dateInput instanceof Date) {
        return dateInput;
    }

    // Timestamp number
    if (typeof dateInput === 'number') {
        return new Date(dateInput);
    }

    // String handling
    if (typeof dateInput === 'string') {
        // Date-only string (YYYY-MM-DD) - parse as LOCAL time
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            const [year, month, day] = dateInput.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        // ISO string with time component - extract date portion and parse locally
        // This prevents UTC interpretation from shifting the date
        if (dateInput.includes('T')) {
            const datePart = dateInput.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            // Also extract time if present, but keep in local timezone
            const timePart = dateInput.split('T')[1];
            if (timePart) {
                const timeMatch = timePart.match(/^(\d{2}):(\d{2}):?(\d{2})?/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const seconds = parseInt(timeMatch[3] || '0', 10);
                    return new Date(year, month - 1, day, hours, minutes, seconds);
                }
            }
            return new Date(year, month - 1, day);
        }

        // Other formats - try standard parsing but be cautious
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    // Object with date property (common in booking data)
    if (typeof dateInput === 'object' && dateInput.date) {
        return parseLocalDate(dateInput.date);
    }

    // Fallback
    return new Date();
};

/**
 * Convert a date to YYYY-MM-DD string in LOCAL timezone.
 * This is the ONLY function that should be used to convert Date objects to date strings.
 * 
 * @param {string|Date|number|null} dateInput - The date to convert
 * @returns {string} Date string in YYYY-MM-DD format
 * 
 * @example
 * toLocalDateString(new Date()) // "2026-02-04"
 * toLocalDateString("2026-02-04T10:30:00Z") // "2026-02-04" (not "2026-02-03"!)
 */
export const toLocalDateString = (dateInput) => {
    if (!dateInput) return null;

    // If it's already a YYYY-MM-DD string, return as-is
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }

    // If it's an ISO string, extract the date portion directly
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
        return dateInput.split('T')[0];
    }

    // Object with date property
    if (typeof dateInput === 'object' && dateInput !== null && !(dateInput instanceof Date) && dateInput.date) {
        return toLocalDateString(dateInput.date);
    }

    // Parse to Date and format
    const date = parseLocalDate(dateInput);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD string in LOCAL timezone.
 * 
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Check if a date is today's date.
 * 
 * @param {string|Date|number|null} dateInput - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (dateInput) => {
    if (!dateInput) return false;
    const dateStr = toLocalDateString(dateInput);
    return dateStr === getTodayString();
};

/**
 * Check if a date is in the past (before today).
 * 
 * @param {string|Date|number|null} dateInput - The date to check
 * @returns {boolean} True if the date is before today
 */
export const isPast = (dateInput) => {
    if (!dateInput) return false;
    const dateStr = toLocalDateString(dateInput);
    return dateStr < getTodayString();
};

/**
 * Check if a date is in the future (after today).
 * 
 * @param {string|Date|number|null} dateInput - The date to check
 * @returns {boolean} True if the date is after today
 */
export const isFuture = (dateInput) => {
    if (!dateInput) return false;
    const dateStr = toLocalDateString(dateInput);
    return dateStr > getTodayString();
};

/**
 * Format a date for user-friendly display.
 * 
 * @param {string|Date|number|null} dateInput - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDisplayDate("2026-02-04") // "Feb 4"
 * formatDisplayDate("2026-02-04", { weekday: 'short' }) // "Wed, Feb 4"
 */
export const formatDisplayDate = (dateInput, options = { month: 'short', day: 'numeric' }) => {
    if (!dateInput) return 'TBA';

    const date = parseLocalDate(dateInput);
    if (isNaN(date.getTime())) return 'TBA';

    return date.toLocaleDateString('en-US', options);
};

/**
 * Format a date with full details.
 * 
 * @param {string|Date|number|null} dateInput - The date to format
 * @returns {string} Full formatted date string (e.g., "Wednesday, February 4, 2026")
 */
export const formatFullDate = (dateInput) => {
    return formatDisplayDate(dateInput, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Format time from hours (0-24) to 12-hour format with AM/PM.
 * 
 * @param {number} hours - Hours in 24-hour format (0-24+)
 * @returns {string} Time in 12-hour format (e.g., "9:00 AM")
 */
export const formatHourTo12 = (hours) => {
    if (typeof hours !== 'number' || isNaN(hours)) return '--:--';

    // Handle hours > 24 (next day)
    const normalizedHour = Math.floor(hours) % 24;
    const period = normalizedHour >= 12 ? 'PM' : 'AM';
    let hour12 = normalizedHour % 12;
    if (hour12 === 0) hour12 = 12;

    return `${hour12}:00 ${period}`;
};

/**
 * Convert a time string to 12-hour format if needed.
 * 
 * @param {string} timeStr - Time string (e.g., "14:00" or "2:00 PM")
 * @returns {string} Time in 12-hour format
 */
export const ensureAmPmFormat = (timeStr) => {
    if (!timeStr) return null;

    // Already has AM/PM - return as-is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
        return timeStr;
    }

    // Handle 24-hour format like "12:00" or "15:00"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = hours >= 12 ? 'PM' : 'AM';
        let hour12 = hours % 12;
        if (hour12 === 0) hour12 = 12;
        return `${hour12}:${minutes} ${period}`;
    }

    return timeStr;
};

/**
 * Extract hours from various date/time formats.
 * 
 * @param {string|Date|null} dateTimeInput - Date/time input
 * @returns {number} Hours (0-23), defaults to 9 if cannot be determined
 */
export const extractHours = (dateTimeInput) => {
    if (!dateTimeInput) return 9;

    // If it's a time string like "9:00 AM" or "14:00"
    if (typeof dateTimeInput === 'string') {
        // Check for AM/PM format
        const amPmMatch = dateTimeInput.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (amPmMatch) {
            let hours = parseInt(amPmMatch[1], 10);
            const period = amPmMatch[3].toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours;
        }

        // Check for 24-hour format
        const timeMatch = dateTimeInput.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            return parseInt(timeMatch[1], 10);
        }

        // Try parsing as date
        const date = parseLocalDate(dateTimeInput);
        if (!isNaN(date.getTime())) {
            return date.getHours();
        }
    }

    // Date object
    if (dateTimeInput instanceof Date) {
        return dateTimeInput.getHours();
    }

    return 9; // Default to morning
};

/**
 * Compare two dates (only the date part, ignoring time).
 * 
 * @param {string|Date|number|null} date1 - First date
 * @param {string|Date|number|null} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
    const str1 = toLocalDateString(date1) || '';
    const str2 = toLocalDateString(date2) || '';
    return str1.localeCompare(str2);
};

/**
 * Check if two dates are the same day.
 * 
 * @param {string|Date|number|null} date1 - First date
 * @param {string|Date|number|null} date2 - Second date
 * @returns {boolean} True if both dates are the same day
 */
export const isSameDay = (date1, date2) => {
    return toLocalDateString(date1) === toLocalDateString(date2);
};

/**
 * Get a date that is N days from today.
 * 
 * @param {number} days - Number of days from today (negative for past)
 * @returns {Date} The resulting date
 */
export const daysFromToday = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * Format a date key for use in grouping/indexing (YYYY-MM-DD).
 * Alias for toLocalDateString.
 * 
 * @param {string|Date|number|null} dateInput - The date
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const formatDateKey = toLocalDateString;

// Default export with all utilities
export default {
    parseLocalDate,
    toLocalDateString,
    getTodayString,
    isToday,
    isPast,
    isFuture,
    formatDisplayDate,
    formatFullDate,
    formatHourTo12,
    ensureAmPmFormat,
    extractHours,
    compareDates,
    isSameDay,
    daysFromToday,
    formatDateKey
};
