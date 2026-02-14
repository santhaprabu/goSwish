/**
 * ============================================================================
 * PROMO CODE OPERATIONS
 * ============================================================================
 *
 * Handles promo code creation, validation, and usage tracking.
 *
 * @module storage/helpers/promoHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, getDocs, generateId } from '../db.js';

// Lazy import to avoid circular dependency
let getCustomerBookings;
const loadDependencies = async () => {
    if (!getCustomerBookings) {
        const bookingHelpers = await import('./bookingHelpers.js');
        getCustomerBookings = bookingHelpers.getCustomerBookings;
    }
};

/**
 * Create a new promo code
 * @param {Object} promoData - Promo code details (code, type, value, etc.)
 * @returns {Promise<Object>} Created promo code object
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
 * Get promo code by code string
 * @param {string} code - Promo code string
 * @returns {Promise<Object|null>} Promo code object or null
 */
export const getPromoCodeByCode = async (code) => {
    const promoCodes = await getDocs(COLLECTIONS.PROMO_CODES);
    return promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase()) || null;
};

/**
 * Validate promo code with comprehensive checks
 * @param {string} code - Promo code to validate
 * @param {string} userId - User ID applying the code
 * @param {string} serviceType - Service type for the booking
 * @param {number} amount - Order subtotal amount
 * @returns {Promise<{valid: boolean, error?: string, promo?: object, discount?: number}>}
 */
export const validatePromoCode = async (code, userId, serviceType, amount) => {
    await loadDependencies();

    const promo = await getPromoCodeByCode(code);

    if (!promo) {
        return { valid: false, error: 'Invalid promo code' };
    }

    if (!promo.active) {
        return { valid: false, error: 'This promo code is no longer active' };
    }

    const now = new Date();

    // Check start date
    if (promo.validFrom) {
        const validFrom = new Date(promo.validFrom);
        if (now < validFrom) {
            return { valid: false, error: 'This promo code is not yet active' };
        }
    }

    // Check end date (null = no expiry)
    if (promo.validUntil) {
        const validUntil = new Date(promo.validUntil);
        if (now > validUntil) {
            return { valid: false, error: 'This promo code has expired' };
        }
    }

    // Check total usage limit
    const currentUses = promo.usedCount || promo.currentUses || 0;
    if (currentUses >= promo.maxUses) {
        return { valid: false, error: 'This promo code has reached its maximum uses' };
    }

    // Check per-user usage limit
    if (userId && promo.maxUsesPerUser && promo.usageByUser) {
        const userUsage = promo.usageByUser[userId];
        const userUseCount = typeof userUsage === 'object' ? userUsage.count : (userUsage || 0);
        if (userUseCount >= promo.maxUsesPerUser) {
            return { valid: false, error: 'You have already used this promo code the maximum number of times' };
        }
    }

    // Check minimum order amount
    const minAmount = promo.minOrderAmount || promo.minAmount || 0;
    if (amount < minAmount) {
        return { valid: false, error: `Minimum order amount is $${minAmount.toFixed(2)}` };
    }

    // Check service type restrictions
    if (promo.serviceTypes && promo.serviceTypes.length > 0 && serviceType) {
        if (!promo.serviceTypes.includes(serviceType)) {
            return { valid: false, error: 'This promo code is not valid for this service type' };
        }
    }

    // Check first-time user restriction
    if (promo.firstTimeOnly && userId) {
        const userBookings = await getCustomerBookings(userId);
        const completedBookings = userBookings.filter(b => b.status === 'completed');
        if (completedBookings.length > 0) {
            return { valid: false, error: 'This promo code is only valid for your first order' };
        }
    }

    // Check new users only restriction (accounts created in last 7 days)
    if (promo.newUsersOnly && userId) {
        const user = await getDoc(COLLECTIONS.USERS, userId);
        if (user && user.createdAt) {
            const accountAge = (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
            if (accountAge > 7) {
                return { valid: false, error: 'This promo code is only valid for new users' };
            }
        }
    }

    // Calculate discount amount
    let discount = 0;
    const discountValue = promo.value || promo.discount || 0;

    if (promo.type === 'percentage') {
        discount = (amount * discountValue) / 100;
        if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
        }
    } else {
        discount = discountValue;
    }

    discount = Math.min(discount, amount);
    discount = Math.round(discount * 100) / 100;

    return { valid: true, promo, discount };
};

/**
 * Apply promo code with comprehensive usage tracking
 * @param {string} promoId - Promo code ID
 * @param {string} userId - User ID who used the code
 * @param {number} discountAmount - Discount amount applied
 * @param {string} bookingId - Booking ID for reference
 * @returns {Promise<boolean>} True if successfully applied
 */
export const applyPromoCode = async (promoId, userId = null, discountAmount = 0, bookingId = null) => {
    try {
        const promo = await getDoc(COLLECTIONS.PROMO_CODES, promoId);

        if (!promo) {
            console.error('Promo code not found:', promoId);
            return false;
        }

        const currentCount = promo.usedCount || promo.currentUses || 0;
        if (currentCount >= promo.maxUses) {
            console.warn('Promo code max uses reached:', promoId);
            return false;
        }

        const updates = {
            usedCount: (promo.usedCount || 0) + 1,
            currentUses: (promo.currentUses || 0) + 1,
            totalDiscountGiven: (promo.totalDiscountGiven || 0) + discountAmount,
            lastUsedAt: new Date().toISOString(),
        };

        if (userId) {
            const usageByUser = promo.usageByUser || {};
            const existingUserUsage = usageByUser[userId];

            if (typeof existingUserUsage === 'object') {
                usageByUser[userId] = {
                    count: (existingUserUsage.count || 0) + 1,
                    totalDiscount: (existingUserUsage.totalDiscount || 0) + discountAmount,
                    lastUsed: new Date().toISOString(),
                    bookings: [...(existingUserUsage.bookings || []), bookingId].filter(Boolean),
                };
            } else {
                usageByUser[userId] = {
                    count: (existingUserUsage || 0) + 1,
                    totalDiscount: discountAmount,
                    lastUsed: new Date().toISOString(),
                    bookings: bookingId ? [bookingId] : [],
                };
            }

            updates.usageByUser = usageByUser;
        }

        await updateDoc(COLLECTIONS.PROMO_CODES, promoId, updates);
        console.log(`Promo code ${promo.code} applied successfully. Total uses: ${updates.usedCount}`);
        return true;
    } catch (error) {
        console.error(`Error applying promo code ${promoId}:`, error);
        return false;
    }
};
