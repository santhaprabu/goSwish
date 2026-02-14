/**
 * ============================================================================
 * HOUSE OPERATIONS
 * ============================================================================
 *
 * Handles property/house management operations for homeowners.
 *
 * @module storage/helpers/houseHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, deleteDoc, queryDocs, generateId } from '../db.js';

/**
 * Create a new house/property
 * @param {string} userId - Owner's user ID
 * @param {Object} houseData - House details (address, sqft, etc.)
 * @returns {Promise<Object>} Created house object
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
 * Get all houses belonging to a user
 * @param {string} userId - Owner's user ID
 * @returns {Promise<Array>} Array of house objects
 */
export const getUserHouses = async (userId) => {
    return await queryDocs(COLLECTIONS.HOUSES, 'userId', userId);
};

/**
 * Get house by ID
 * @param {string} houseId - House's unique identifier
 * @returns {Promise<Object|null>} House object or null
 */
export const getHouseById = async (houseId) => {
    return await getDoc(COLLECTIONS.HOUSES, houseId);
};

/**
 * Update house details
 * @param {string} houseId - House's unique identifier
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated house object
 */
export const updateHouse = async (houseId, updates) => {
    return await updateDoc(COLLECTIONS.HOUSES, houseId, updates);
};

/**
 * Delete a house
 * @param {string} houseId - House's unique identifier
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteHouse = async (houseId) => {
    return await deleteDoc(COLLECTIONS.HOUSES, houseId);
};
