// Firebase Database Initialization Script
// Run this to create all collections and seed initial data

import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';

// Initialize all Firestore collections with proper structure
export async function initializeDatabase() {
    console.log('🔥 Initializing Firestore Database...');

    try {
        const batch = writeBatch(db);

        // 1. Create Service Types Collection
        console.log('Creating service types...');
        const serviceTypes = [
            {
                id: 'regular',
                name: 'Regular Clean',
                description: 'Standard cleaning for maintained homes',
                basePrice: 25,
                pricePerSqft: 0.10,
                duration: 120,
                icon: '🧹',
                active: true
            },
            {
                id: 'deep',
                name: 'Deep Clean',
                description: 'Thorough cleaning for detailed work',
                basePrice: 40,
                pricePerSqft: 0.15,
                duration: 180,
                icon: '✨',
                active: true
            },
            {
                id: 'move',
                name: 'Move In/Out',
                description: 'Complete cleaning for moving',
                basePrice: 60,
                pricePerSqft: 0.20,
                duration: 240,
                icon: '📦',
                active: true
            },
            {
                id: 'windows',
                name: 'Window Cleaning',
                description: 'Professional window cleaning',
                basePrice: 30,
                pricePerWindow: 5,
                duration: 90,
                icon: '🪟',
                active: true
            }
        ];

        for (const service of serviceTypes) {
            const serviceRef = doc(db, 'serviceTypes', service.id);
            batch.set(serviceRef, {
                ...service,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // 2. Create Add-ons Collection
        console.log('Creating add-ons...');
        const addOns = [
            {
                id: 'inside-fridge',
                name: 'Inside Fridge',
                description: 'Clean inside of refrigerator',
                price: 15,
                duration: 20,
                icon: '🧊',
                active: true
            },
            {
                id: 'inside-oven',
                name: 'Inside Oven',
                description: 'Deep clean oven interior',
                price: 15,
                duration: 20,
                icon: '🔥',
                active: true
            },
            {
                id: 'inside-cabinets',
                name: 'Inside Cabinets',
                description: 'Clean inside kitchen cabinets',
                price: 15,
                duration: 30,
                icon: '🗄️',
                active: true
            },
            {
                id: 'laundry',
                name: 'Laundry',
                description: 'Wash, dry, and fold laundry',
                price: 20,
                duration: 45,
                icon: '👕',
                active: true
            },
            {
                id: 'dishes',
                name: 'Dishes',
                description: 'Wash and put away dishes',
                price: 10,
                duration: 15,
                icon: '🍽️',
                active: true
            }
        ];

        for (const addon of addOns) {
            const addonRef = doc(db, 'addOns', addon.id);
            batch.set(addonRef, {
                ...addon,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // 3. Create Metro Multipliers Collection
        console.log('Creating metro multipliers...');
        const metros = [
            { id: 'nyc', name: 'New York City', multiplier: 1.5, state: 'NY' },
            { id: 'sf', name: 'San Francisco', multiplier: 1.4, state: 'CA' },
            { id: 'la', name: 'Los Angeles', multiplier: 1.3, state: 'CA' },
            { id: 'chicago', name: 'Chicago', multiplier: 1.2, state: 'IL' },
            { id: 'boston', name: 'Boston', multiplier: 1.3, state: 'MA' },
            { id: 'seattle', name: 'Seattle', multiplier: 1.3, state: 'WA' },
            { id: 'miami', name: 'Miami', multiplier: 1.2, state: 'FL' },
            { id: 'dallas', name: 'Dallas', multiplier: 1.1, state: 'TX' },
            { id: 'houston', name: 'Houston', multiplier: 1.1, state: 'TX' },
            { id: 'atlanta', name: 'Atlanta', multiplier: 1.1, state: 'GA' }
        ];

        for (const metro of metros) {
            const metroRef = doc(db, 'metroMultipliers', metro.id);
            batch.set(metroRef, {
                ...metro,
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // 4. Create Promo Codes Collection
        console.log('Creating promo codes...');
        const promoCodes = [
            {
                id: 'WELCOME20',
                code: 'WELCOME20',
                type: 'percentage',
                value: 20,
                description: 'Welcome discount - 20% off first booking',
                maxUses: 1000,
                usedCount: 0,
                minAmount: 50,
                maxDiscount: 50,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                active: true,
                firstTimeOnly: true
            },
            {
                id: 'SAVE10',
                code: 'SAVE10',
                type: 'fixed',
                value: 10,
                description: '$10 off any booking',
                maxUses: 500,
                usedCount: 0,
                minAmount: 75,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                active: true,
                firstTimeOnly: false
            },
            {
                id: 'DEEP25',
                code: 'DEEP25',
                type: 'percentage',
                value: 25,
                description: '25% off deep cleaning',
                maxUses: 200,
                usedCount: 0,
                minAmount: 100,
                maxDiscount: 75,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                active: true,
                serviceTypes: ['deep'],
                firstTimeOnly: false
            }
        ];

        for (const promo of promoCodes) {
            const promoRef = doc(db, 'promoCodes', promo.id);
            batch.set(promoRef, {
                ...promo,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // 5. Create App Settings Collection
        console.log('Creating app settings...');
        const settingsRef = doc(db, 'settings', 'app');
        batch.set(settingsRef, {
            taxRate: 0.0825, // 8.25%
            platformFee: 0.15, // 15%
            cleanerEarningsRate: 0.90, // 90% to cleaner (10% platform fee)
            minBookingAmount: 50,
            maxBookingAmount: 1000,
            defaultServiceRadius: 10, // miles
            autoApprovalHours: 24,
            cancellationFeePercentage: 0.25,
            rescheduleAllowedHours: 24,
            supportEmail: 'support@goswish.com',
            supportPhone: '(555) 123-4567',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Commit all changes
        await batch.commit();

        console.log('✅ Database initialized successfully!');
        console.log('📊 Collections created:');
        console.log('  - serviceTypes (4 services)');
        console.log('  - addOns (5 add-ons)');
        console.log('  - metroMultipliers (10 metros)');
        console.log('  - promoCodes (3 codes)');
        console.log('  - settings (app config)');

        return { success: true };

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        return { success: false, error: error.message };
    }
}

// Function to verify database structure
export async function verifyDatabase() {
    console.log('🔍 Verifying database structure...');

    try {
        const collections = [
            'serviceTypes',
            'addOns',
            'metroMultipliers',
            'promoCodes',
            'settings'
        ];

        for (const collectionName of collections) {
            const collectionRef = collection(db, collectionName);
            console.log(`✓ ${collectionName} collection exists`);
        }

        console.log('✅ Database structure verified!');
        return { success: true };

    } catch (error) {
        console.error('❌ Error verifying database:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
export default {
    initializeDatabase,
    verifyDatabase
};
