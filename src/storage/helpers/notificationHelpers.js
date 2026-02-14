/**
 * ============================================================================
 * NOTIFICATION OPERATIONS
 * ============================================================================
 *
 * Handles user notification management including creation, reading, and cleanup.
 *
 * @module storage/helpers/notificationHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, deleteDoc, queryDocs, generateId } from '../db.js';

/**
 * Create a notification for a user
 * @param {string} userId - Recipient's user ID
 * @param {Object} notificationData - Notification details (type, title, message, etc.)
 * @returns {Promise<Object>} Created notification object
 */
export const createNotification = async (userId, notificationData) => {
    const notification = {
        id: generateId('notification'),
        userId,
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.NOTIFICATIONS, notification.id, notification);
};

/**
 * Get all notifications for a user, sorted by newest first
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} Array of notification objects
 */
export const getUserNotifications = async (userId) => {
    const notifications = await queryDocs(COLLECTIONS.NOTIFICATIONS, 'userId', userId);
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification's unique identifier
 * @returns {Promise<Object>} Updated notification object
 */
export const markNotificationAsRead = async (notificationId) => {
    return await updateDoc(COLLECTIONS.NOTIFICATIONS, notificationId, {
        read: true,
    });
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification's unique identifier
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteNotification = async (notificationId) => {
    return await deleteDoc(COLLECTIONS.NOTIFICATIONS, notificationId);
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User's ID
 * @returns {Promise<boolean>} True when complete
 */
export const markAllNotificationsAsRead = async (userId) => {
    const notifications = await getUserNotifications(userId);
    const unread = notifications.filter(n => !n.read);

    for (const notification of unread) {
        await markNotificationAsRead(notification.id);
    }

    return true;
};

/**
 * Delete all job offer notifications for a specific booking.
 * Used when a job is taken to remove alerts from other cleaners' feeds.
 * @param {string} bookingId - Booking's unique identifier
 * @returns {Promise<void>}
 */
export const deleteJobOfferNotifications = async (bookingId) => {
    try {
        const notifs = await queryDocs(COLLECTIONS.NOTIFICATIONS, 'relatedId', bookingId);
        const deletionPromises = notifs
            .filter(n => n.type === 'job_offer')
            .map(n => deleteDoc(COLLECTIONS.NOTIFICATIONS, n.id));

        await Promise.all(deletionPromises);
        console.log(`Deleted ${deletionPromises.length} stale job offers for booking ${bookingId}`);
    } catch (e) {
        console.error('Error clearing stale job notifications', e);
    }
};
