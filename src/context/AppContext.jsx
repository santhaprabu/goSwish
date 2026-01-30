import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Initial state - UI state only, all data comes from IndexedDB
const initialState = {
    // User authentication
    user: null,
    isAuthenticated: false,
    selectedRole: null, // 'homeowner' | 'cleaner'

    // UI State
    loading: false,
    error: null,

    // Current booking flow
    currentBooking: null,

    // Static configuration data (not user-specific)
    serviceTypes: [
        {
            id: 'regular',
            name: 'Regular Clean',
            description: 'Standard cleaning for maintained homes',
            rate: 0.10,
            icon: 'Sparkles',
            includes: ['Dusting', 'Vacuuming', 'Mopping', 'Bathroom cleaning', 'Kitchen cleaning', 'Trash removal'],
        },
        {
            id: 'deep',
            name: 'Deep Clean',
            description: 'Thorough cleaning including hard-to-reach areas',
            rate: 0.15,
            icon: 'SprayCan',
            includes: ['Everything in Regular', 'Baseboards', 'Inside cabinets', 'Appliance cleaning', 'Light fixtures', 'Window sills'],
        },
        {
            id: 'move',
            name: 'Move-in/Move-out',
            description: 'Complete transition cleaning for moves',
            rate: 0.18,
            icon: 'Home',
            includes: ['Everything in Deep Clean', 'Inside closets', 'Inside oven', 'Inside refrigerator', 'Garage sweeping'],
        },
        {
            id: 'windows',
            name: 'Windows Only',
            description: 'Professional window cleaning inside & out',
            rate: 0.08,
            icon: 'Grid3X3',
            includes: ['Interior windows', 'Exterior windows', 'Window sills', 'Window tracks', 'Screen cleaning'],
        },
    ],

    addOns: [
        { id: 'oven', name: 'Inside Oven Deep Clean', price: 25, icon: 'Flame' },
        { id: 'fridge', name: 'Inside Refrigerator', price: 20, icon: 'Refrigerator' },
        { id: 'windows', name: 'Interior Windows', price: 30, rate: 0.02, icon: 'Square' },
        { id: 'laundry', name: 'Laundry Wash & Fold', price: 15, icon: 'Shirt' },
        { id: 'baseboards', name: 'Baseboards Wiping', price: 20, rate: 0.01, icon: 'Minus' },
    ],

    metroMultipliers: {
        'Dallas': 1.0,
        'Fort Worth': 1.0,
        'Austin': 1.1,
        'San Antonio': 1.05,
        'Houston': 1.05,
        'New York': 1.3,
        'Los Angeles': 1.25,
        'San Francisco': 1.35,
        'Chicago': 1.15,
        'Miami': 1.2,
    },
};

// Action types
const ActionTypes = {
    SET_USER: 'SET_USER',
    SET_ROLE: 'SET_ROLE',
    LOGOUT: 'LOGOUT',
    SET_CURRENT_BOOKING: 'SET_CURRENT_BOOKING',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                selectedRole: action.payload?.primaryRole || action.payload?.role || state.selectedRole,
            };

        case ActionTypes.SET_ROLE:
            return {
                ...state,
                selectedRole: action.payload,
                user: state.user ? { ...state.user, primaryRole: action.payload } : null,
            };

        case ActionTypes.LOGOUT:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                selectedRole: null,
                currentBooking: null,
            };

        case ActionTypes.SET_CURRENT_BOOKING:
            return {
                ...state,
                currentBooking: action.payload,
            };

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };

        case ActionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
            };

        default:
            return state;
    }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                // Check for existing session
                const { getCurrentUser } = await import('../storage/index.js');
                const currentUser = getCurrentUser();

                if (currentUser) {
                    dispatch({ type: ActionTypes.SET_USER, payload: currentUser });
                }

                // SECURITY: Dangerous admin functions removed
                // Password reset functions should only be accessible to admins
                // through secure admin panel with proper authentication

            } catch (error) {
                console.error('Initialization error:', error);
            }
        };
        init();
    }, []);


    // Auth actions
    const login = useCallback(async (email, password) => {
        try {
            const { signInWithEmail } = await import('../storage/index.js');
            const result = await signInWithEmail(email, password);

            if (!result.success) {
                return { success: false, error: result.error || 'Invalid email or password' };
            }

            dispatch({ type: ActionTypes.SET_USER, payload: result.user });
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }, []);

    const signup = useCallback(async (userData) => {
        try {
            const { signUpWithEmail } = await import('../storage/index.js');
            const result = await signUpWithEmail(
                userData.email,
                userData.password,
                {
                    name: userData.name,
                    role: userData.role || userData.primaryRole,
                    phone: userData.phone,
                }
            );

            if (!result.success) {
                return { success: false, error: result.error || 'Signup failed' };
            }

            dispatch({ type: ActionTypes.SET_USER, payload: result.user });
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Signup failed. Please try again.' };
        }
    }, []);

    const requestOtp = useCallback(async (email) => {
        try {
            const { sendOtp } = await import('../storage/index.js');
            return await sendOtp(email);
        } catch (error) {
            console.error('Request OTP error:', error);
            return { success: false, error: 'Failed to request OTP' };
        }
    }, []);

    const loginWithOtp = useCallback(async (email, otp) => {
        try {
            const { signInWithOtp } = await import('../storage/index.js');
            const result = await signInWithOtp(email, otp);

            if (!result.success) {
                return { success: false, error: result.error || 'Invalid OTP' };
            }

            dispatch({ type: ActionTypes.SET_USER, payload: result.user });
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login with OTP error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }, []);

    const checkUser = useCallback(async (email) => {
        try {
            const { getUserByEmail } = await import('../storage/index.js');
            const user = await getUserByEmail(email);
            return { exists: !!user, name: user?.profile?.name || user?.name || '' };
        } catch (error) {
            console.error('Check user error:', error);
            return { exists: false, name: '' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Force clear session storage immediately
            sessionStorage.removeItem('goswish_session');
            sessionStorage.removeItem('goswish_current_user');
            // Also clear local storage just in case of old sessions
            localStorage.removeItem('goswish_session');
            localStorage.removeItem('goswish_current_user');

            const { signOut } = await import('../storage/index.js');
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        dispatch({ type: ActionTypes.LOGOUT });
    }, []);

    const setRole = useCallback((role) => {
        dispatch({ type: ActionTypes.SET_ROLE, payload: role });
    }, []);

    const verifyEmail = useCallback(async (uid) => {
        try {
            const { updateUser } = await import('../storage/index.js');
            await updateUser(uid, { emailVerified: true });

            // Update local user state if it's the current user
            if (state.user?.uid === uid) {
                dispatch({ type: ActionTypes.SET_USER, payload: { ...state.user, emailVerified: true } });
            }
        } catch (error) {
            console.error('Error verifying email:', error);
        }
    }, [state.user]);

    const updateUser = useCallback(async (userData) => {
        try {
            const { updateUser: updateUserInDB } = await import('../storage/index.js');
            await updateUserInDB(state.user?.uid, userData);

            // Update local user state
            if (state.user) {
                dispatch({ type: ActionTypes.SET_USER, payload: { ...state.user, ...userData } });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }, [state.user]);

    const startChat = useCallback(async (targetUserId, metadata = {}) => {
        if (!state.user?.uid) return null;
        try {
            const { getConversation, createConversation, getUserById } = await import('../storage/index.js');

            // Check if exists
            let conversation = await getConversation(state.user.uid, targetUserId);

            if (!conversation) {
                // Get names
                let targetName = 'User';
                try {
                    const targetUser = await getUserById(targetUserId);
                    if (targetUser) targetName = `${targetUser.firstName} ${targetUser.lastName}`;
                } catch (e) {
                    console.warn('Failed to fetch target user name', e);
                }

                const myName = state.user.name || 'User';
                const isCustomer = state.selectedRole === 'homeowner' || state.user.role === 'homeowner';

                conversation = await createConversation([state.user.uid, targetUserId], {
                    ...metadata,
                    customerName: isCustomer ? myName : targetName,
                    cleanerName: isCustomer ? targetName : myName,
                    startedBy: state.user.uid
                });
            }

            return conversation;
        } catch (error) {
            console.error('Error starting chat:', error);
            throw error;
        }
    }, [state.user, state.selectedRole]);

    // House actions - all use IndexedDB directly
    const addHouse = useCallback(async (houseData) => {
        try {
            if (!state.user?.uid) {
                throw new Error('User not authenticated');
            }

            const { createHouse } = await import('../storage/index.js');
            const newHouse = await createHouse(state.user.uid, houseData);
            return newHouse;
        } catch (error) {
            console.error('Error adding house:', error);
            throw error;
        }
    }, [state.user]);

    const updateHouse = useCallback(async (houseId, houseData) => {
        try {
            const { updateHouse: updateHouseInDB } = await import('../storage/index.js');
            await updateHouseInDB(houseId, houseData);
        } catch (error) {
            console.error('Error updating house:', error);
            throw error;
        }
    }, []);

    const deleteHouse = useCallback(async (houseId) => {
        try {
            const { deleteDoc, COLLECTIONS } = await import('../storage/db.js');
            await deleteDoc(COLLECTIONS.HOUSES, houseId);
        } catch (error) {
            console.error('Error deleting house:', error);
            throw error;
        }
    }, []);

    const setDefaultHouse = useCallback(async (houseId) => {
        try {
            if (!state.user?.uid) return;

            const { getUserHouses, updateHouse: updateHouseInDB } = await import('../storage/index.js');
            const houses = await getUserHouses(state.user.uid);

            // Update all houses - set isDefault to false except for the selected one
            for (const house of houses) {
                await updateHouseInDB(house.id, { isDefault: house.id === houseId });
            }
        } catch (error) {
            console.error('Error setting default house:', error);
            throw error;
        }
    }, [state.user]);

    const getUserHouses = useCallback(async () => {
        try {
            if (!state.user?.uid) return [];

            const { getUserHouses: getHousesFromDB } = await import('../storage/index.js');
            const houses = await getHousesFromDB(state.user.uid);
            return houses || [];
        } catch (error) {
            console.error('Error fetching houses:', error);
            return [];
        }
    }, [state.user]);

    // Booking actions - all use IndexedDB directly
    const createBooking = useCallback(async (bookingData) => {
        try {
            if (!state.user?.uid) {
                throw new Error('User not authenticated');
            }

            const { createBooking: createBookingInDB, broadcastNewJob } = await import('../storage/index.js');
            const newBooking = await createBookingInDB(state.user.uid, bookingData);

            // Broadcast notification to relevant cleaners
            broadcastNewJob(newBooking).catch(console.error);

            return newBooking;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }, [state.user]);

    const updateBooking = useCallback(async (bookingId, bookingData) => {
        try {
            const { updateBooking: updateBookingInDB } = await import('../storage/index.js');
            await updateBookingInDB(bookingId, bookingData);
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    }, []);

    const setCurrentBooking = useCallback((booking) => {
        dispatch({ type: ActionTypes.SET_CURRENT_BOOKING, payload: booking });
    }, []);

    const getUserBookings = useCallback(async () => {
        try {
            if (!state.user?.uid) return [];

            const { getUserBookings: getBookingsFromDB } = await import('../storage/index.js');
            const bookings = await getBookingsFromDB(state.user.uid);
            return bookings || [];
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    }, [state.user]);

    const acceptJobOffer = useCallback(async (bookingId, cleanerId, jobDetails) => {
        try {
            const { acceptJobOffer: acceptOfferInDB } = await import('../storage/index.js');
            const newJob = await acceptOfferInDB(bookingId, cleanerId, jobDetails);
            return newJob;
        } catch (error) {
            console.error('Error accepting job offer:', error);
            throw error;
        }
    }, []);

    // Promo code validation (can stay in-memory or move to DB later)
    const validatePromoCode = useCallback(async (code) => {
        try {
            const { getPromoCode } = await import('../storage/index.js');
            const promo = await getPromoCode(code);

            if (!promo) {
                return { valid: false, error: 'Invalid promo code' };
            }

            const now = new Date();
            const expiry = new Date(promo.expiresAt);

            if (now > expiry) {
                return { valid: false, error: 'This promo code has expired' };
            }

            if (promo.currentUses >= promo.maxUses) {
                return { valid: false, error: 'This promo code has reached its maximum uses' };
            }

            return { valid: true, promo };
        } catch (error) {
            console.error('Error validating promo code:', error);
            return { valid: false, error: 'Failed to validate promo code' };
        }
    }, []);

    // Pricing calculation - needs house data from DB
    const calculatePrice = useCallback(async (houseId, serviceTypeId, selectedAddOns = [], promoCode = null) => {
        console.log('💰 calculatePrice called with:', { houseId, serviceTypeId, selectedAddOns, promoCode });
        try {
            const { getDoc, COLLECTIONS } = await import('../storage/db.js');
            const house = await getDoc(COLLECTIONS.HOUSES, houseId);
            const serviceType = state.serviceTypes.find(s => s.id === serviceTypeId);

            console.log('🏠 Found house:', house);
            console.log('✨ Found serviceType:', serviceType);

            if (!house || !serviceType) {
                console.warn('❌ House or ServiceType not found', { houseFound: !!house, serviceFound: !!serviceType });
                return null;
            }

            // Ensure sqft determines size
            const size = Number(house.sqft || house.size || 0);
            const rate = Number(serviceType.rate || 0);

            console.log(`📊 Calculating: Size ${size} * Rate ${rate}`);

            // Base price
            let basePrice = size * rate;

            // Metro multiplier
            const metro = state.metroMultipliers[house.address.city] || 1.0;
            basePrice *= metro;

            // Pet surcharge
            if (house.petInfo && house.petInfo !== 'No pets') {
                basePrice += 10; // Flat pet fee
            }

            console.log(`💵 Base Price (raw): ${basePrice}`);

            // Apply rounding rule: Round UP to nearest 10
            basePrice = Math.ceil(basePrice / 10) * 10;
            console.log(`💵 Base Price (rounded): ${basePrice}`);

            // Add-ons
            const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
                const addon = state.addOns.find(a => a.id === addonId);
                if (!addon) return sum;
                let price = 0;
                if (addon.rate) {
                    price = size * addon.rate;
                } else {
                    price = addon.price || 0;
                }
                // Round UP to nearest 10
                return sum + (Math.ceil(price / 10) * 10);
            }, 0);

            // Subtotal
            const subtotal = basePrice + addOnsTotal;

            // Tax
            const taxRate = 0.08;
            const taxes = subtotal * taxRate;

            // Promo discount
            let promoDiscount = 0;
            let promoDetails = null;

            if (promoCode) {
                const validation = await validatePromoCode(promoCode);
                if (validation.valid) {
                    promoDetails = validation.promo;
                    if (subtotal >= (validation.promo.minOrder || 0)) {
                        if (validation.promo.type === 'percentage') {
                            promoDiscount = subtotal * (validation.promo.value / 100);
                        } else {
                            promoDiscount = validation.promo.value;
                        }
                    }
                }
            }

            // Total
            const total = subtotal + taxes - promoDiscount;

            // Estimated duration (based on sqft)
            const baseDuration = Math.ceil(size / 500); // hours
            const serviceMultiplier = serviceTypeId === 'regular' ? 1 : serviceTypeId === 'deep' ? 1.5 : serviceTypeId === 'move' ? 2 : 0.5;
            const estimatedDuration = Math.ceil(baseDuration * serviceMultiplier);

            const result = {
                base: Math.round(basePrice * 100) / 100,
                addOns: addOnsTotal,
                subtotal: Math.round(subtotal * 100) / 100,
                taxes: Math.round(taxes * 100) / 100,
                promoDiscount: Math.round(promoDiscount * 100) / 100,
                promoDetails,
                total: Math.round(total * 100) / 100,
                estimatedDuration,
                metro,
            };

            console.log('✅ Final Calculation Result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error calculating price:', error);
            return null;
        }
    }, [state.serviceTypes, state.addOns, state.metroMultipliers, validatePromoCode]);

    // Find eligible cleaners
    const findEligibleCleaners = useCallback(async (houseId, serviceTypeId) => {
        try {
            const { getDoc, getDocs, COLLECTIONS } = await import('../storage/db.js');
            const house = await getDoc(COLLECTIONS.HOUSES, houseId);

            if (!house) return [];

            const cleaners = await getDocs(COLLECTIONS.CLEANERS);
            const users = await getDocs(COLLECTIONS.USERS);

            const eligibleCleaners = cleaners.filter(cleaner => {
                const user = users.find(u => u.uid === cleaner.userId);

                if (!user || user.role !== 'cleaner') return false;
                if (cleaner.status !== 'active') return false;
                if (!cleaner.serviceTypes?.includes(serviceTypeId)) return false;

                // Calculate distance using Haversine formula
                if (cleaner.baseLocation && house.address) {
                    const R = 3959; // Earth's radius in miles
                    const lat1 = house.address.lat * Math.PI / 180;
                    const lat2 = cleaner.baseLocation.lat * Math.PI / 180;
                    const dLat = (cleaner.baseLocation.lat - house.address.lat) * Math.PI / 180;
                    const dLng = (cleaner.baseLocation.lng - house.address.lng) * Math.PI / 180;

                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;

                    if (distance > (cleaner.serviceRadius || 25)) return false;

                    cleaner.distance = Math.round(distance * 10) / 10;
                }

                return true;
            });

            return eligibleCleaners.sort((a, b) => (a.distance || 0) - (b.distance || 0)).slice(0, 50);
        } catch (error) {
            console.error('Error finding eligible cleaners:', error);
            return [];
        }
    }, []);

    // Set loading
    const setLoading = useCallback((loading) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    }, []);

    // Set error
    const setError = useCallback((error) => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    }, []);

    const value = {
        // State
        ...state,

        // Auth actions
        login,
        signup,
        requestOtp,
        loginWithOtp,
        checkUser,
        logout,
        setRole,
        verifyEmail,
        updateUser,

        // House actions
        addHouse,
        updateHouse,
        deleteHouse,
        setDefaultHouse,
        getUserHouses,

        // Booking actions
        createBooking,
        updateBooking,
        setCurrentBooking,
        getUserBookings,
        acceptJobOffer, // Add this

        // Promo & Pricing
        validatePromoCode,
        calculatePrice,

        // Cleaner matching
        findEligibleCleaners,
        startChat,

        // UI actions
        setLoading,
        setError,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
