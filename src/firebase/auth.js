// Firebase Authentication Service
// Handles all authentication operations

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up with email and password
export const signUpWithEmail = async (email, password, userData) => {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: userData.role || 'homeowner',
            emailVerified: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active',
            profile: {
                name: userData.name || '',
                phone: userData.phone || ''
            },
            notificationPreferences: {
                bookingUpdates: true,
                jobOffers: true,
                earnings: true,
                messages: true,
                reviews: true,
                promotions: false,
                quietHours: {
                    enabled: false,
                    start: '22:00',
                    end: '08:00'
                }
            }
        });

        // If cleaner, create cleaner profile
        if (userData.role === 'cleaner') {
            await setDoc(doc(db, 'cleaners', user.uid), {
                userId: user.uid,
                name: userData.name || '',
                headline: '',
                bio: '',
                yearsExperience: 0,
                specialties: [],
                languages: ['English'],
                photoURL: '',
                baseLocation: null,
                serviceRadius: 10,
                serviceTypes: [],
                availability: {},
                verificationStatus: 'pending',
                backgroundCheck: {
                    status: 'pending',
                    result: null
                },
                payments: {
                    stripeAccountId: null,
                    bankStatus: 'not_connected'
                },
                onboardingStatus: {
                    profileComplete: false,
                    photoUploaded: false,
                    locationSet: false,
                    availabilitySet: false,
                    backgroundCheckComplete: false,
                    bankConnected: false
                },
                stats: {
                    completedJobs: 0,
                    totalCancellations: 0,
                    rating: 0,
                    totalReviews: 0,
                    acceptanceRate: 0,
                    cancellationRate: 0,
                    completionRate: 0,
                    responseTime: 0,
                    reliabilityScore: 100
                },
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                ...userData
            }
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                ...userData
            }
        };
    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
};

// Sign in with Google
export const signInWithGoogle = async (role = 'homeowner') => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create new user document
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                role: role,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'active',
                profile: {
                    name: user.displayName || '',
                    phone: ''
                },
                notificationPreferences: {
                    bookingUpdates: true,
                    jobOffers: true,
                    earnings: true,
                    messages: true,
                    reviews: true,
                    promotions: false,
                    quietHours: {
                        enabled: false,
                        start: '22:00',
                        end: '08:00'
                    }
                }
            });

            // Create cleaner profile if needed
            if (role === 'cleaner') {
                await setDoc(doc(db, 'cleaners', user.uid), {
                    userId: user.uid,
                    name: user.displayName || '',
                    headline: '',
                    bio: '',
                    yearsExperience: 0,
                    specialties: [],
                    languages: ['English'],
                    photoURL: user.photoURL || '',
                    baseLocation: null,
                    serviceRadius: 10,
                    serviceTypes: [],
                    availability: {},
                    verificationStatus: 'pending',
                    backgroundCheck: {
                        status: 'pending',
                        result: null
                    },
                    payments: {
                        stripeAccountId: null,
                        bankStatus: 'not_connected'
                    },
                    onboardingStatus: {
                        profileComplete: false,
                        photoUploaded: true,
                        locationSet: false,
                        availabilitySet: false,
                        backgroundCheckComplete: false,
                        bankConnected: false
                    },
                    stats: {
                        completedJobs: 0,
                        totalCancellations: 0,
                        rating: 0,
                        totalReviews: 0,
                        acceptanceRate: 0,
                        cancellationRate: 0,
                        completionRate: 0,
                        responseTime: 0,
                        reliabilityScore: 100
                    },
                    status: 'active',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        }

        const userData = userDoc.exists() ? userDoc.data() : { role };

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL,
                ...userData
            }
        };
    } catch (error) {
        console.error('Google sign in error:', error);
        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
};

// Sign out
export const signOutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return {
            success: false,
            error: 'Failed to sign out'
        };
    }
};

// Send password reset email
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Password reset email sent'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: getAuthErrorMessage(error.code)
        };
    }
};

// Update user profile
export const updateUserProfile = async (updates) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user signed in');

        // Update Firebase Auth profile
        if (updates.displayName || updates.photoURL) {
            await updateProfile(user, {
                displayName: updates.displayName,
                photoURL: updates.photoURL
            });
        }

        // Update Firestore user document
        await setDoc(doc(db, 'users', user.uid), {
            ...updates,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return {
            success: false,
            error: 'Failed to update profile'
        };
    }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            callback({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL,
                ...userData
            });
        } else {
            callback(null);
        }
    });
};

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode) => {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Operation not allowed',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/popup-closed-by-user': 'Sign in cancelled',
        'auth/cancelled-popup-request': 'Sign in cancelled'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
};

export default {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOutUser,
    resetPassword,
    updateUserProfile,
    onAuthStateChange
};
