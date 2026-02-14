/**
 * ============================================================================
 * USER OPERATIONS
 * ============================================================================
 *
 * Handles user account operations including fetching, updating, and querying users.
 *
 * @module storage/helpers/userHelpers
 */

import { COLLECTIONS, getDoc, updateDoc, queryDocs } from '../db.js';

/**
 * Get user by ID
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getUserById = async (userId) => {
    return await getDoc(COLLECTIONS.USERS, userId);
};

/**
 * Get user by email address
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getUserByEmail = async (email) => {
    const users = await queryDocs(COLLECTIONS.USERS, 'email', email);
    return users.length > 0 ? users[0] : null;
};

/**
 * Update user profile
 * @param {string} userId - User's unique identifier
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (userId, updates) => {
    return await updateDoc(COLLECTIONS.USERS, userId, updates);
};
