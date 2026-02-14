/**
 * ============================================================================
 * SERVICE TYPE & ADD-ON OPERATIONS
 * ============================================================================
 *
 * Handles service type and add-on catalog operations.
 *
 * @module storage/helpers/serviceHelpers
 */

import { COLLECTIONS, getDoc, getDocs } from '../db.js';

/**
 * Get all active service types
 * @returns {Promise<Array>} Array of active service type objects
 */
export const getServiceTypes = async () => {
    const services = await getDocs(COLLECTIONS.SERVICE_TYPES);
    return services.filter(s => s.active);
};

/**
 * Get service type by ID
 * @param {string} serviceId - Service type's unique identifier
 * @returns {Promise<Object|null>} Service type object or null
 */
export const getServiceTypeById = async (serviceId) => {
    return await getDoc(COLLECTIONS.SERVICE_TYPES, serviceId);
};

/**
 * Get all active add-ons
 * @returns {Promise<Array>} Array of active add-on objects
 */
export const getAddOns = async () => {
    const addOns = await getDocs(COLLECTIONS.ADD_ONS);
    return addOns.filter(a => a.active);
};

/**
 * Get add-on by ID
 * @param {string} addOnId - Add-on's unique identifier
 * @returns {Promise<Object|null>} Add-on object or null
 */
export const getAddOnById = async (addOnId) => {
    return await getDoc(COLLECTIONS.ADD_ONS, addOnId);
};

/**
 * Get app settings
 * @returns {Promise<Object|null>} App settings object
 */
export const getAppSettings = async () => {
    return await getDoc(COLLECTIONS.SETTINGS, 'app');
};
