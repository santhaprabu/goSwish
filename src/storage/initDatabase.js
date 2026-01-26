/**
 * Initialize Database with Default Data
 */

import { COLLECTIONS, setDoc, getDocs, clearCollection } from './db.js';

/**
 * Initialize service types
 */
const initServiceTypes = async () => {
    const serviceTypes = [
        {
            id: 'regular',
            name: 'Regular Clean',
            description: 'Standard cleaning for maintaining a tidy home',
            basePrice: 25,
            pricePerSqft: 0.10,
            duration: 120,
            icon: 'Sparkles',
            active: true,
            features: [
                'Dusting all surfaces',
                'Vacuum & mop floors',
                'Clean bathrooms',
                'Kitchen cleaning',
                'Trash removal',
            ],
        },
        {
            id: 'deep',
            name: 'Deep Clean',
            description: 'Thorough cleaning for a spotless home',
            basePrice: 40,
            pricePerSqft: 0.15,
            duration: 180,
            icon: 'Zap',
            active: true,
            features: [
                'Everything in Regular Clean',
                'Baseboards & trim',
                'Light fixtures',
                'Window sills',
                'Behind appliances',
                'Detailed scrubbing',
            ],
        },
        {
            id: 'move',
            name: 'Move In/Out',
            description: 'Complete cleaning for moving',
            basePrice: 60,
            pricePerSqft: 0.20,
            duration: 240,
            icon: 'Home',
            active: true,
            features: [
                'Everything in Deep Clean',
                'Inside cabinets',
                'Inside appliances',
                'Walls & ceilings',
                'Closets',
                'Garage (if applicable)',
            ],
        },
        {
            id: 'windows',
            name: 'Window Cleaning',
            description: 'Professional window cleaning',
            basePrice: 30,
            pricePerSqft: 0.08,
            duration: 90,
            icon: 'Square',
            active: true,
            features: [
                'Interior windows',
                'Exterior windows',
                'Window tracks',
                'Screens',
                'Streak-free finish',
            ],
        },
    ];

    for (const service of serviceTypes) {
        await setDoc(COLLECTIONS.SERVICE_TYPES, service.id, service);
    }

    console.log('✅ Service types initialized');
};

/**
 * Initialize add-ons
 */
const initAddOns = async () => {
    const addOns = [
        {
            id: 'inside-fridge',
            name: 'Inside Fridge',
            description: 'Deep clean inside refrigerator',
            price: 15,
            duration: 20,
            icon: 'Refrigerator',
            active: true,
        },
        {
            id: 'inside-oven',
            name: 'Inside Oven',
            description: 'Deep clean inside oven',
            price: 15,
            duration: 20,
            icon: 'Flame',
            active: true,
        },
        {
            id: 'inside-cabinets',
            name: 'Inside Cabinets',
            description: 'Clean inside kitchen cabinets',
            price: 15,
            duration: 30,
            icon: 'Box',
            active: true,
        },
        {
            id: 'laundry',
            name: 'Laundry',
            description: 'Wash, dry, and fold laundry',
            price: 20,
            duration: 45,
            icon: 'Shirt',
            active: true,
        },
        {
            id: 'dishes',
            name: 'Dishes',
            description: 'Wash and put away dishes',
            price: 10,
            duration: 15,
            icon: 'UtensilsCrossed',
            active: true,
        },
    ];

    for (const addOn of addOns) {
        await setDoc(COLLECTIONS.ADD_ONS, addOn.id, addOn);
    }

    console.log('✅ Add-ons initialized');
};

/**
 * Initialize promo codes
 */
const initPromoCodes = async () => {
    const promoCodes = [
        {
            id: 'welcome20',
            code: 'WELCOME20',
            type: 'percentage',
            value: 20,
            description: '20% off your first booking',
            maxUses: 1000,
            usedCount: 0,
            minAmount: 50,
            maxDiscount: 50,
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            active: true,
            firstTimeOnly: true,
        },
        {
            id: 'save10',
            code: 'SAVE10',
            type: 'fixed',
            value: 10,
            description: '$10 off any booking',
            maxUses: 500,
            usedCount: 0,
            minAmount: 75,
            maxDiscount: 10,
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
            active: true,
            firstTimeOnly: false,
        },
        {
            id: 'deep25',
            code: 'DEEP25',
            type: 'percentage',
            value: 25,
            description: '25% off deep cleaning',
            maxUses: 200,
            usedCount: 0,
            minAmount: 100,
            maxDiscount: 75,
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            active: true,
            firstTimeOnly: false,
            serviceTypes: ['deep'],
        },
    ];

    for (const promo of promoCodes) {
        await setDoc(COLLECTIONS.PROMO_CODES, promo.id, promo);
    }

    console.log('✅ Promo codes initialized');
};

/**
 * Initialize app settings
 */
const initSettings = async () => {
    const settings = {
        id: 'app',
        taxRate: 0.0825, // 8.25%
        platformFee: 0.15, // 15%
        cleanerEarningsRate: 0.70, // 70%
        minBookingAmount: 50,
        maxBookingAmount: 1000,
        cancellationFee: 25,
        cancellationWindow: 24, // hours
        serviceRadius: 25, // miles
        currency: 'USD',
        supportEmail: 'support@goswish.com',
        supportPhone: '1-800-GOSWISH',
        features: {
            instantBooking: true,
            chatMessaging: true,
            photoUpload: true,
            reviews: true,
            promoCode: true,
            referrals: true,
        },
        maintenance: {
            enabled: false,
            message: '',
        },
    };

    await setDoc(COLLECTIONS.SETTINGS, settings.id, settings);

    console.log('✅ Settings initialized');
};

/**
 * Initialize database with all default data
 */
export const initializeDatabase = async () => {
    try {
        console.log('🚀 Initializing database...');

        await initServiceTypes();
        await initAddOns();
        await initPromoCodes();
        await initSettings();

        console.log('✅ Database initialization complete!');

        return {
            success: true,
            message: 'Database initialized successfully',
        };
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        return {
            success: false,
            error: error.message || 'Failed to initialize database',
        };
    }
};

/**
 * Verify database structure
 */
export const verifyDatabase = async () => {
    try {
        console.log('🔍 Verifying database...');

        const serviceTypes = await getDocs(COLLECTIONS.SERVICE_TYPES);
        const addOns = await getDocs(COLLECTIONS.ADD_ONS);
        const promoCodes = await getDocs(COLLECTIONS.PROMO_CODES);
        const settings = await getDocs(COLLECTIONS.SETTINGS);

        console.log(`✅ Service Types: ${serviceTypes.length}`);
        console.log(`✅ Add-ons: ${addOns.length}`);
        console.log(`✅ Promo Codes: ${promoCodes.length}`);
        console.log(`✅ Settings: ${settings.length}`);

        const isValid =
            serviceTypes.length === 4 &&
            addOns.length === 5 &&
            promoCodes.length === 3 &&
            settings.length === 1;

        if (isValid) {
            console.log('✅ Database verification passed!');
        } else {
            console.warn('⚠️ Database verification failed - some data is missing');
        }

        return {
            success: isValid,
            counts: {
                serviceTypes: serviceTypes.length,
                addOns: addOns.length,
                promoCodes: promoCodes.length,
                settings: settings.length,
            },
        };
    } catch (error) {
        console.error('❌ Database verification error:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify database',
        };
    }
};

/**
 * Reset database (clear all data and reinitialize)
 */
export const resetDatabase = async () => {
    try {
        console.log('🔄 Resetting database...');

        // Clear all collections
        await clearCollection(COLLECTIONS.SERVICE_TYPES);
        await clearCollection(COLLECTIONS.ADD_ONS);
        await clearCollection(COLLECTIONS.PROMO_CODES);
        await clearCollection(COLLECTIONS.SETTINGS);

        // Reinitialize
        await initializeDatabase();

        console.log('✅ Database reset complete!');

        return {
            success: true,
            message: 'Database reset successfully',
        };
    } catch (error) {
        console.error('❌ Database reset error:', error);
        return {
            success: false,
            error: error.message || 'Failed to reset database',
        };
    }
};
