/**
 * Local Authentication System
 * Provides user authentication with persistent sessions
 */

import { COLLECTIONS, addDoc, setDoc, updateDoc, getDoc, getDocs, queryDocs, generateId } from './db.js';

const CURRENT_USER_KEY = 'goswish_current_user';
const SESSION_KEY = 'goswish_session';

/**
 * Hash password (simple implementation - use bcrypt in production)
 */
const hashPassword = async (password) => {
    // For demo purposes - in production, use proper hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'goswish_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify password
 */
const verifyPassword = async (password, hashedPassword) => {
    const hash = await hashPassword(password);
    return hash === hashedPassword;
};

/**
 * Get current user from session
 */
export const getCurrentUser = () => {
    try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);

        // Check if session is expired (24 hours)
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxAge) {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
        }

        return session.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Generate and send OTP (simulated)
 */
export const sendOtp = async (email) => {
    try {
        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);
        if (users.length === 0) {
            // For security, behave as if sent, or error if we want strict flow
            // But for this app flow, we assume the user exists if they are in 'login' mode?
            // Actually, standard practice is strict if we know they are logging in.
            return { success: false, error: 'User not found' };
        }

        const user = users[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
        const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins

        // Update user with OTP
        const updatedUser = {
            ...user,
            otp,
            otpExpiry: expiry
        };

        await setDoc(COLLECTIONS.USERS, user.id, updatedUser);

        // Simulate sending email
        console.log(`[DEV] OTP for ${email}: ${otp}`);

        return { success: true, message: 'OTP sent to email' };
    } catch (error) {
        console.error('Send OTP error:', error);
        return { success: false, error: 'Failed to send OTP' };
    }
};

/**
 * Sign in with OTP
 */
export const signInWithOtp = async (email, otp) => {
    try {
        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);
        if (users.length === 0) {
            return { success: false, error: 'Invalid email or OTP' };
        }

        const user = users[0];

        // Check OTP
        if (!user.otp || user.otp !== otp) {
            return { success: false, error: 'Invalid OTP' };
        }

        // Check Expiry
        if (new Date() > new Date(user.otpExpiry)) {
            return { success: false, error: 'OTP expired. Please request a new one.' };
        }

        // OTP is valid - clear it and login
        const { otp: _, otpExpiry: __, password: ___, ...userClean } = user;

        // Remove OTP fields from DB
        const userToSave = { ...user };
        delete userToSave.otp;
        delete userToSave.otpExpiry;
        await setDoc(COLLECTIONS.USERS, user.id, userToSave);

        setCurrentUser(userClean);

        return { success: true, user: userClean };

    } catch (error) {
        console.error('Sign in with OTP error:', error);
        return { success: false, error: 'Failed to verify OTP' };
    }
};

/**
 * Set current user session
 */
const setCurrentUser = (user) => {
    const session = {
        user,
        createdAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

/**
 * Clear current user session
 */
const clearCurrentUser = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, userData = {}) => {
    try {
        // Check if user already exists
        const existingUsers = await queryDocs(COLLECTIONS.USERS, 'email', email);

        if (existingUsers.length > 0) {
            return {
                success: false,
                error: 'Email already registered',
            };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userId = generateId('user');
        const user = {
            id: userId,
            uid: userId,
            email,
            password: hashedPassword,
            emailVerified: false,
            role: userData.role || 'customer',
            status: 'active',
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            photoURL: userData.photoURL || '',
            phone: userData.phone || '',
            profile: {
                name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                photoURL: userData.photoURL || '',
            },
            notificationPreferences: {
                bookingUpdates: true,
                jobOffers: true,
                earnings: true,
                messages: true,
                reviews: true,
                promotions: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.USERS, userId, user);

        // Remove password from user object before storing in session
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);

        return {
            success: true,
            user: userWithoutPassword,
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sign up',
        };
    }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
    try {
        // Find user by email
        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);

        if (users.length === 0) {
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        const user = users[0];

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        // Check if user is active
        if (user.status !== 'active') {
            return {
                success: false,
                error: 'Account is suspended',
            };
        }

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);

        return {
            success: true,
            user: userWithoutPassword,
        };
    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sign in',
        };
    }
};

/**
 * Sign out
 */
export const signOut = async () => {
    try {
        clearCurrentUser();
        return {
            success: true,
        };
    } catch (error) {
        console.error('Sign out error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sign out',
        };
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const user = await getDoc(COLLECTIONS.USERS, userId);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                ...updates,
            },
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.USERS, userId, updatedUser);

        // Update session if it's the current user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.uid === userId) {
            const { password: _, ...userWithoutPassword } = updatedUser;
            setCurrentUser(userWithoutPassword);
        }

        return {
            success: true,
            user: updatedUser,
        };
    } catch (error) {
        console.error('Update profile error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update profile',
        };
    }
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await getDoc(COLLECTIONS.USERS, userId);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.password);

        if (!isValid) {
            return {
                success: false,
                error: 'Current password is incorrect',
            };
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        const updatedUser = {
            ...user,
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.USERS, userId, updatedUser);

        return {
            success: true,
        };
    } catch (error) {
        console.error('Change password error:', error);
        return {
            success: false,
            error: error.message || 'Failed to change password',
        };
    }
};

/**
 * Send password reset email (simulated)
 */
export const sendPasswordResetEmail = async (email) => {
    try {
        // Check if user exists
        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);

        if (users.length === 0) {
            // Don't reveal if email exists for security
            return {
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            };
        }

        // In production, send actual email
        console.log('Password reset email would be sent to:', email);

        return {
            success: true,
            message: 'Password reset link has been sent to your email.',
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send reset email',
        };
    }
};

/**
 * Verify email (simulated)
 */
export const verifyEmail = async (userId) => {
    try {
        const user = await getDoc(COLLECTIONS.USERS, userId);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        const updatedUser = {
            ...user,
            emailVerified: true,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(COLLECTIONS.USERS, userId, updatedUser);

        // Update session
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.uid === userId) {
            const { password: _, ...userWithoutPassword } = updatedUser;
            setCurrentUser(userWithoutPassword);
        }

        return {
            success: true,
        };
    } catch (error) {
        console.error('Verify email error:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify email',
        };
    }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (userId, password) => {
    try {
        const user = await getDoc(COLLECTIONS.USERS, userId);

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return {
                success: false,
                error: 'Password is incorrect',
            };
        }

        // In production, you might want to soft delete or archive
        user.status = 'deleted';
        user.deletedAt = new Date().toISOString();
        await setDoc(COLLECTIONS.USERS, userId, user);

        // Clear session
        clearCurrentUser();

        return {
            success: true,
        };
    } catch (error) {
        console.error('Delete account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete account',
        };
    }
};

/**
 * Force reset all cleaner passwords (Maintenance Tool)
 */
export const forceResetCleanerPasswords = async () => {
    try {
        console.log("🔄 FORCE RESET: Updating all cleaner passwords...");
        const users = await getDocs(COLLECTIONS.USERS);
        const cleaners = users.filter(u => u.role === 'cleaner');

        if (cleaners.length === 0) {
            console.log("⚠️ No cleaners found to reset.");
            return { success: true, count: 0 };
        }

        const newHash = await hashPassword('Cleaner123!');
        let count = 0;

        for (const cleaner of cleaners) {
            await updateDoc(COLLECTIONS.USERS, cleaner.id, {
                password: newHash
            });
            count++;
        }

        console.log(`✅ SUCCESS: Reset passwords for ${count} cleaners to 'Cleaner123!'`);
        return { success: true, count };
    } catch (error) {
        console.error("❌ Failed to reset passwords:", error);
        return { success: false, error: error.message };
    }
};
