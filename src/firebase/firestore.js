// Firebase Firestore Database Service
// Handles all database operations

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    addDoc,
    onSnapshot
} from 'firebase/firestore';
import { db, auth } from './config';

// ===== AUTHORIZATION HELPERS =====

/**
 * Check if user is authenticated
 */
const checkAuth = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Authentication required');
    }
    return currentUser;
};

/**
 * Check if user owns the resource
 */
const checkOwnership = (resourceUserId) => {
    const currentUser = checkAuth();
    if (currentUser.uid !== resourceUserId) {
        throw new Error('Unauthorized: You can only access your own data');
    }
    return currentUser;
};

// ===== USERS =====

export const getUser = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        console.error('Get user error:', error);
        return { success: false, error: error.message };
    }
};

export const updateUser = async (uid, updates) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: error.message };
    }
};

// ===== HOUSES =====

export const addHouse = async (userId, houseData) => {
    try {
        // SECURITY: Verify user owns this resource
        checkOwnership(userId);

        const houseRef = doc(collection(db, 'users', userId, 'houses'));
        await setDoc(houseRef, {
            ...houseData,
            createdAt: serverTimestamp()
        });
        return { success: true, id: houseRef.id };
    } catch (error) {
        console.error('Add house error:', error);
        return { success: false, error: error.message };
    }
};

export const getUserHouses = async (userId) => {
    try {
        // SECURITY: Verify user owns this resource
        checkOwnership(userId);

        const housesSnapshot = await getDocs(collection(db, 'users', userId, 'houses'));
        const houses = housesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: houses };
    } catch (error) {
        console.error('Get houses error:', error);
        return { success: false, error: error.message };
    }
};

export const updateHouse = async (userId, houseId, updates) => {
    try {
        // SECURITY: Verify user owns this resource
        checkOwnership(userId);

        await updateDoc(doc(db, 'users', userId, 'houses', houseId), updates);
        return { success: true };
    } catch (error) {
        console.error('Update house error:', error);
        return { success: false, error: error.message };
    }
};

export const deleteHouse = async (userId, houseId) => {
    try {
        // SECURITY: Verify user owns this resource
        checkOwnership(userId);

        await deleteDoc(doc(db, 'users', userId, 'houses', houseId));
        return { success: true };
    } catch (error) {
        console.error('Delete house error:', error);
        return { success: false, error: error.message };
    }
};

// ===== BOOKINGS =====

export const createBooking = async (bookingData) => {
    try {
        const bookingRef = doc(collection(db, 'bookings'));
        const bookingId = `GS-${new Date().getFullYear()}-${bookingRef.id.slice(0, 6).toUpperCase()}`;

        await setDoc(bookingRef, {
            ...bookingData,
            bookingId,
            status: 'confirmed',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return { success: true, id: bookingRef.id, bookingId };
    } catch (error) {
        console.error('Create booking error:', error);
        return { success: false, error: error.message };
    }
};

export const getBooking = async (bookingId) => {
    try {
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingDoc.exists()) {
            return { success: true, data: { id: bookingDoc.id, ...bookingDoc.data() } };
        }
        return { success: false, error: 'Booking not found' };
    } catch (error) {
        console.error('Get booking error:', error);
        return { success: false, error: error.message };
    }
};

export const getUserBookings = async (userId, role = 'homeowner') => {
    try {
        const fieldName = role === 'homeowner' ? 'customerId' : 'cleanerId';
        const q = query(
            collection(db, 'bookings'),
            where(fieldName, '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const bookingsSnapshot = await getDocs(q);
        const bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: bookings };
    } catch (error) {
        console.error('Get user bookings error:', error);
        return { success: false, error: error.message };
    }
};

export const updateBooking = async (bookingId, updates) => {
    try {
        await updateDoc(doc(db, 'bookings', bookingId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update booking error:', error);
        return { success: false, error: error.message };
    }
};

// ===== CLEANERS =====

export const getCleaner = async (cleanerId) => {
    try {
        const cleanerDoc = await getDoc(doc(db, 'cleaners', cleanerId));
        if (cleanerDoc.exists()) {
            return { success: true, data: { id: cleanerDoc.id, ...cleanerDoc.data() } };
        }
        return { success: false, error: 'Cleaner not found' };
    } catch (error) {
        console.error('Get cleaner error:', error);
        return { success: false, error: error.message };
    }
};

export const updateCleaner = async (cleanerId, updates) => {
    try {
        await updateDoc(doc(db, 'cleaners', cleanerId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update cleaner error:', error);
        return { success: false, error: error.message };
    }
};

export const getEligibleCleaners = async (location, serviceType, radius = 10) => {
    try {
        // Note: For production, use geohash queries for location-based search
        // This is a simplified version
        const q = query(
            collection(db, 'cleaners'),
            where('status', '==', 'active'),
            where('verificationStatus', '==', 'approved'),
            where('serviceTypes', 'array-contains', serviceType),
            limit(20)
        );

        const cleanersSnapshot = await getDocs(q);
        const cleaners = cleanersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: cleaners };
    } catch (error) {
        console.error('Get eligible cleaners error:', error);
        return { success: false, error: error.message };
    }
};

// ===== JOB OFFERS =====

export const createJobOffer = async (offerData) => {
    try {
        const offerRef = doc(collection(db, 'jobOffers'));
        await setDoc(offerRef, {
            ...offerData,
            status: 'sent',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });
        return { success: true, id: offerRef.id };
    } catch (error) {
        console.error('Create job offer error:', error);
        return { success: false, error: error.message };
    }
};

export const getCleanerJobOffers = async (cleanerId) => {
    try {
        const q = query(
            collection(db, 'jobOffers'),
            where('cleanerId', '==', cleanerId),
            where('status', 'in', ['sent', 'viewed']),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const offersSnapshot = await getDocs(q);
        const offers = offersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: offers };
    } catch (error) {
        console.error('Get job offers error:', error);
        return { success: false, error: error.message };
    }
};

export const updateJobOffer = async (offerId, updates) => {
    try {
        await updateDoc(doc(db, 'jobOffers', offerId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update job offer error:', error);
        return { success: false, error: error.message };
    }
};

// ===== JOBS =====

export const createJob = async (jobData) => {
    try {
        const jobRef = doc(collection(db, 'jobs'));
        await setDoc(jobRef, {
            ...jobData,
            status: 'scheduled',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: jobRef.id };
    } catch (error) {
        console.error('Create job error:', error);
        return { success: false, error: error.message };
    }
};

export const getJob = async (jobId) => {
    try {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (jobDoc.exists()) {
            return { success: true, data: { id: jobDoc.id, ...jobDoc.data() } };
        }
        return { success: false, error: 'Job not found' };
    } catch (error) {
        console.error('Get job error:', error);
        return { success: false, error: error.message };
    }
};

export const updateJob = async (jobId, updates) => {
    try {
        await updateDoc(doc(db, 'jobs', jobId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update job error:', error);
        return { success: false, error: error.message };
    }
};

// ===== REAL-TIME LISTENERS =====

export const subscribeToBooking = (bookingId, callback) => {
    return onSnapshot(doc(db, 'bookings', bookingId), (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    });
};

export const subscribeToJob = (jobId, callback) => {
    return onSnapshot(doc(db, 'jobs', jobId), (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    });
};

export const subscribeToJobOffers = (cleanerId, callback) => {
    const q = query(
        collection(db, 'jobOffers'),
        where('cleanerId', '==', cleanerId),
        where('status', 'in', ['sent', 'viewed']),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const offers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(offers);
    });
};

// ===== REVIEWS =====

export const createReview = async (reviewData) => {
    try {
        const reviewRef = doc(collection(db, 'reviews'));
        await setDoc(reviewRef, {
            ...reviewData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: reviewRef.id };
    } catch (error) {
        console.error('Create review error:', error);
        return { success: false, error: error.message };
    }
};

export const getCleanerReviews = async (cleanerId) => {
    try {
        const q = query(
            collection(db, 'reviews'),
            where('cleanerId', '==', cleanerId),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const reviewsSnapshot = await getDocs(q);
        const reviews = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: reviews };
    } catch (error) {
        console.error('Get reviews error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    // Users
    getUser,
    updateUser,

    // Houses
    addHouse,
    getUserHouses,
    updateHouse,
    deleteHouse,

    // Bookings
    createBooking,
    getBooking,
    getUserBookings,
    updateBooking,

    // Cleaners
    getCleaner,
    updateCleaner,
    getEligibleCleaners,

    // Job Offers
    createJobOffer,
    getCleanerJobOffers,
    updateJobOffer,

    // Jobs
    createJob,
    getJob,
    updateJob,

    // Real-time
    subscribeToBooking,
    subscribeToJob,
    subscribeToJobOffers,

    // Reviews
    createReview,
    getCleanerReviews
};
