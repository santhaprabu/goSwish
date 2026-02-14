/**
 * ============================================================================
 * REVIEW OPERATIONS
 * ============================================================================
 *
 * Handles customer and cleaner review management.
 *
 * @module storage/helpers/reviewHelpers
 */

import { COLLECTIONS, setDoc, updateDoc, queryDocs, generateId } from '../db.js';

/**
 * Create a review
 * @param {Object} reviewData - Review details (rating, comment, tags, etc.)
 * @returns {Promise<Object>} Created review object
 */
export const createReview = async (reviewData) => {
    const review = {
        id: generateId('review'),
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return await setDoc(COLLECTIONS.REVIEWS, review.id, review);
};

/**
 * Get all reviews for a cleaner
 * @param {string} cleanerId - Cleaner's ID
 * @returns {Promise<Array>} Array of review objects
 */
export const getCleanerReviews = async (cleanerId) => {
    return await queryDocs(COLLECTIONS.REVIEWS, 'cleanerId', cleanerId);
};

/**
 * Get all reviews from a customer
 * @param {string} customerId - Customer's ID
 * @returns {Promise<Array>} Array of review objects
 */
export const getCustomerReviews = async (customerId) => {
    return await queryDocs(COLLECTIONS.REVIEWS, 'customerId', customerId);
};

/**
 * Get cleaner reviews with comprehensive statistics
 * @param {string} cleanerId - Cleaner's ID
 * @returns {Promise<Object>} Object with reviews array and stats
 */
export const getCleanerReviewsWithStats = async (cleanerId) => {
    const reviews = await getCleanerReviews(cleanerId);

    if (reviews.length === 0) {
        return {
            reviews: [],
            stats: {
                avgRating: 0,
                totalReviews: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                topTags: [],
            },
        };
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCounts = {};

    reviews.forEach(r => {
        distribution[r.rating]++;
        (r.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

    const sortedReviews = reviews.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
        reviews: sortedReviews,
        stats: {
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
            distribution,
            topTags,
        },
    };
};

/**
 * Add a response to a review
 * @param {string} reviewId - Review's unique identifier
 * @param {string} response - Response text
 * @returns {Promise<Object>} Updated review object
 */
export const addReviewResponse = async (reviewId, response) => {
    return await updateDoc(COLLECTIONS.REVIEWS, reviewId, {
        response,
        responseDate: new Date().toISOString(),
    });
};
