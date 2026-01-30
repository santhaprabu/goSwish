/**
 * Seed Data Generator
 * Creates 30 customers and 30 cleaners with realistic Texas data
 */

import { signUpWithEmail, forceResetUserPassword } from './auth.js';
import {
    createCleanerProfile, createHouse, createPromoCode,
    createReview, createNotification, createConversation, sendMessage,
    getCleanerByUserId, createTransaction
} from './helpers.js';
import { COLLECTIONS, setDoc, generateId } from './db.js';

// Texas cities data
const TEXAS_CITIES = {
    Dallas: {
        state: 'TX',
        zip: ['75201', '75202', '75203', '75204', '75205', '75206'],
        neighborhoods: ['Downtown', 'Uptown', 'Oak Lawn', 'Deep Ellum', 'Bishop Arts', 'Highland Park'],
        lat: 32.7767,
        lng: -96.7970,
    },
    'Fort Worth': {
        state: 'TX',
        zip: ['76101', '76102', '76103', '76104', '76105', '76106'],
        neighborhoods: ['Downtown', 'Sundance Square', 'Cultural District', 'Near Southside', 'West 7th', 'TCU'],
        lat: 32.7555,
        lng: -97.3308,
    },
    Austin: {
        state: 'TX',
        zip: ['78701', '78702', '78703', '78704', '78705', '78731'],
        neighborhoods: ['Downtown', 'South Congress', 'East Austin', 'West Lake Hills', 'Hyde Park', 'Zilker'],
        lat: 30.2672,
        lng: -97.7431,
    },
    'San Antonio': {
        state: 'TX',
        zip: ['78201', '78202', '78203', '78204', '78205', '78209'],
        neighborhoods: ['Downtown', 'Alamo Heights', 'Stone Oak', 'The Dominion', 'Southtown', 'King William'],
        lat: 29.4241,
        lng: -98.4936,
    },
    Houston: {
        state: 'TX',
        zip: ['77001', '77002', '77003', '77004', '77005', '77006'],
        neighborhoods: ['Downtown', 'Montrose', 'The Heights', 'Midtown', 'River Oaks', 'Memorial'],
        lat: 29.7604,
        lng: -95.3698,
    },
};

// Customer names
const CUSTOMER_NAMES = [
    'James Wilson', 'Mary Johnson', 'Robert Brown', 'Patricia Davis', 'Michael Miller',
    'Jennifer Garcia', 'William Rodriguez', 'Linda Martinez', 'David Anderson', 'Barbara Taylor',
    'Richard Thomas', 'Susan Jackson', 'Joseph White', 'Jessica Harris', 'Thomas Martin',
    'Sarah Thompson', 'Charles Moore', 'Karen Lee', 'Christopher Walker', 'Nancy Hall',
    'Daniel Allen', 'Lisa Young', 'Matthew King', 'Betty Wright', 'Anthony Lopez',
    'Margaret Hill', 'Mark Scott', 'Sandra Green', 'Donald Adams', 'Ashley Baker',
];

// Cleaner names
const CLEANER_NAMES = [
    'Maria Gonzalez', 'Carlos Hernandez', 'Ana Lopez', 'Juan Martinez', 'Sofia Ramirez',
    'Miguel Torres', 'Isabella Flores', 'Luis Rivera', 'Camila Gomez', 'Diego Diaz',
    'Valentina Cruz', 'Alejandro Reyes', 'Lucia Morales', 'Fernando Jimenez', 'Gabriela Ruiz',
    'Roberto Sanchez', 'Carmen Ortiz', 'Eduardo Vargas', 'Rosa Castillo', 'Antonio Mendoza',
    'Elena Herrera', 'Francisco Medina', 'Paula Aguilar', 'Javier Ramos', 'Daniela Castro',
    'Ricardo Moreno', 'Adriana Romero', 'Sergio Gutierrez', 'Natalia Alvarez', 'Pablo Chavez',
];

// Cleaner specialties
const SPECIALTIES = [
    ['Deep Cleaning', 'Move In/Out'],
    ['Regular Cleaning', 'Window Cleaning'],
    ['Deep Cleaning', 'Regular Cleaning'],
    ['Move In/Out', 'Window Cleaning'],
    ['Regular Cleaning', 'Deep Cleaning', 'Window Cleaning'],
    ['Deep Cleaning'],
    ['Regular Cleaning'],
    ['Move In/Out', 'Deep Cleaning'],
];

// Languages
const LANGUAGES = [
    ['English', 'Spanish'],
    ['English'],
    ['Spanish'],
    ['English', 'Spanish', 'Portuguese'],
];

// Property types
const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse'];

// Street names
const STREET_NAMES = [
    'Main St', 'Oak Ave', 'Maple Dr', 'Pine Ln', 'Cedar Blvd',
    'Elm St', 'Park Ave', 'Lake Dr', 'Hill Rd', 'Valley Way',
    'River Rd', 'Forest Ln', 'Meadow Dr', 'Spring St', 'Summer Ave',
];

// Photo Assets
const FEMALE_PHOTOS = Array.from({ length: 50 }, (_, i) => `https://xsgames.co/randomusers/assets/avatars/female/${i}.jpg`);
const MALE_PHOTOS = Array.from({ length: 50 }, (_, i) => `https://xsgames.co/randomusers/assets/avatars/male/${i}.jpg`);

const getGenderPhoto = (role, index) => {
    // Customers: 1:M, 2:F, 3:M, 4:F...
    // Cleaners: 1:F, 2:M, 3:F, 4:M...
    const isMale = role === 'homeowner' ? (index % 2 !== 0) : (index % 2 === 0);
    const photoList = isMale ? MALE_PHOTOS : FEMALE_PHOTOS;
    return photoList[Math.floor(index / 2) % photoList.length];
};

/**
 * Get random item from array
 */
const getRandom = (array) => array[Math.floor(Math.random() * array.length)];

/**
 * Get random number between min and max
 */
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate random phone number
 */
const generatePhone = () => {
    const area = getRandomNumber(200, 999);
    const prefix = getRandomNumber(200, 999);
    const line = getRandomNumber(1000, 9999);
    return `${area}-${prefix}-${line}`;
};

/**
 * Generate random address in a Texas city
 */
const generateAddress = (city) => {
    const cityData = TEXAS_CITIES[city];
    const streetNumber = getRandomNumber(100, 9999);
    const street = getRandom(STREET_NAMES);
    const zip = getRandom(cityData.zip);
    const neighborhood = getRandom(cityData.neighborhoods);

    // Add a small random offset to the city coordinates (approx 0.05 degrees ~ 3-5 miles)
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;

    return {
        street: `${streetNumber} ${street}`,
        city,
        state: cityData.state,
        zip,
        zipcode: zip,
        neighborhood,
        lat: cityData.lat + latOffset,
        lng: cityData.lng + lngOffset,
    };
};

/**
 * Create 30 customer profiles
 */
export const createCustomerProfiles = async () => {
    console.log('🚀 Creating 30 customer profiles...');

    const customers = [];
    const cities = Object.keys(TEXAS_CITIES);

    for (let i = 1; i <= 30; i++) {
        try {
            const email = `homeowner${i}@goswish.com`;
            const password = 'HomeOwner123!';
            const name = CUSTOMER_NAMES[i - 1]; // Keep variable name for now
            const city = cities[(i - 1) % cities.length]; // Distribute across cities
            const phone = generatePhone();

            console.log(`Creating homeowner ${i}/30: ${name} (${email})`);

            // Create user account
            const result = await signUpWithEmail(email, password, {
                name,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' '),
                role: 'homeowner',
                phone,
                photoURL: getGenderPhoto('homeowner', i),
                location: generateAddress(city),
            });

            if (result.success) {
                customers.push(result.user);

                // Create 2-4 houses for each customer
                const numHouses = getRandomNumber(2, 4);

                const houseNicknames = [
                    'Home',
                    'Vacation Home',
                    'Rental Property',
                    'Beach House',
                    'Downtown Apartment',
                    'Family House',
                ];

                for (let h = 0; h < numHouses; h++) {
                    const address = generateAddress(city);
                    const nickname = houseNicknames[h] || `Property ${h + 1}`;
                    const propertyType = getRandom(PROPERTY_TYPES);

                    // Vary sizes based on property type
                    let sqft, bedrooms, bathrooms;
                    if (propertyType === 'apartment') {
                        sqft = getRandomNumber(600, 1500);
                        bedrooms = getRandomNumber(1, 3);
                        bathrooms = getRandomNumber(1, 2);
                    } else if (propertyType === 'condo') {
                        sqft = getRandomNumber(800, 2000);
                        bedrooms = getRandomNumber(1, 3);
                        bathrooms = getRandomNumber(1, 2);
                    } else if (propertyType === 'townhouse') {
                        sqft = getRandomNumber(1200, 2500);
                        bedrooms = getRandomNumber(2, 4);
                        bathrooms = getRandomNumber(2, 3);
                    } else { // house
                        sqft = getRandomNumber(1500, 4000);
                        bedrooms = getRandomNumber(2, 5);
                        bathrooms = getRandomNumber(2, 4);
                    }

                    const hasPets = Math.random() > 0.6;
                    const petNotes = hasPets ? getRandom([
                        'One friendly dog',
                        'Two cats',
                        'Small dog',
                        'Large dog - friendly',
                        'Cat - shy',
                    ]) : 'No pets';

                    await createHouse(result.user.uid, {
                        nickname,
                        address,
                        sqft,
                        bedrooms,
                        bathrooms,
                        propertyType,
                        accessInstructions: getRandom([
                            'Ring doorbell',
                            'Key under mat',
                            'Use code 1234',
                            'Call upon arrival',
                            'Gate code: 5678',
                        ]),
                        parkingInfo: getRandom([
                            'Driveway available',
                            'Street parking',
                            'Garage parking',
                            'Visitor parking in lot',
                            'No parking restrictions',
                        ]),
                        pets: {
                            hasPets,
                            notes: petNotes
                        },
                        hasPets,
                        petInfo: petNotes,
                    });
                }

                console.log(`✅ Customer ${i} created: ${name} with ${numHouses} house(s) in ${city}`);
            } else {
                console.error(`❌ Failed to create customer ${i}: ${result.error}`);
            }
        } catch (error) {
            console.error(`❌ Error creating customer ${i}:`, error);
        }
    }

    console.log(`✅ Created ${customers.length} customers`);
    return customers;
};

/**
 * Create 30 cleaner profiles
 */
export const createCleanerProfiles = async () => {
    console.log('🚀 Creating 30 cleaner profiles...');

    const cleaners = [];
    const cities = Object.keys(TEXAS_CITIES);

    for (let i = 1; i <= 30; i++) {
        try {
            const email = `cleaner${i}@goswish.com`;
            const password = 'Cleaner123!';
            const name = CLEANER_NAMES[i - 1];
            const city = cities[(i - 1) % cities.length]; // Distribute across cities
            const phone = generatePhone();

            console.log(`Creating cleaner ${i}/30: ${name} (${email})`);

            // Create user account
            const result = await signUpWithEmail(email, password, {
                name,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' '),
                role: 'cleaner',
                phone,
                photoURL: getGenderPhoto('cleaner', i),
                location: generateAddress(city),
            });

            if (result.success) {
                cleaners.push(result.user);

                // Create cleaner profile
                const address = generateAddress(city);
                const yearsExperience = getRandomNumber(1, 15);
                const specialties = getRandom(SPECIALTIES);
                const languages = getRandom(LANGUAGES);

                // Generate bio
                const bios = [
                    `Professional cleaner with ${yearsExperience} years of experience. I take pride in making homes sparkle!`,
                    `Experienced cleaning specialist serving ${city}. Your satisfaction is my priority!`,
                    `Detail-oriented cleaner with a passion for creating clean, comfortable spaces.`,
                    `Reliable and thorough cleaning professional. I treat every home like my own!`,
                    `Certified cleaning expert with ${yearsExperience} years in the industry. Quality guaranteed!`,
                ];

                const headlines = [
                    'Professional & Reliable Cleaner',
                    'Your Home Deserves the Best',
                    'Quality Cleaning You Can Trust',
                    'Making Homes Shine Since ' + (2026 - yearsExperience),
                    'Expert Cleaning Services',
                ];

                await createCleanerProfile(result.user.uid, {
                    name,
                    headline: getRandom(headlines),
                    bio: getRandom(bios),
                    yearsExperience,
                    specialties,
                    languages,
                    petFriendly: Math.random() > 0.2, // 80% are pet friendly
                    photoURL: getGenderPhoto('cleaner', i),
                    location: result.user.location,
                    baseLocation: result.user.location,
                    serviceRadius: getRandomNumber(15, 30),
                    serviceTypes: ['regular', 'deep', 'move', 'windows'].slice(0, getRandomNumber(2, 4)),
                    availability: {
                        monday: ['9:00 AM', '5:00 PM'],
                        tuesday: ['9:00 AM', '5:00 PM'],
                        wednesday: ['9:00 AM', '5:00 PM'],
                        thursday: ['9:00 AM', '5:00 PM'],
                        friday: ['9:00 AM', '5:00 PM'],
                        saturday: ['10:00 AM', '4:00 PM'],
                        sunday: Math.random() > 0.5 ? ['10:00 AM', '2:00 PM'] : null,
                    },
                    hourlyRate: getRandomNumber(25, 45),
                    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), // 4.0 - 5.0
                    totalReviews: getRandomNumber(10, 150),
                    completedJobs: getRandomNumber(50, 500),
                });

                console.log(`✅ Cleaner ${i} created: ${name} in ${city}`);
            } else {
                console.error(`❌ Failed to create cleaner ${i}: ${result.error}`);
            }
        } catch (error) {
            console.error(`❌ Error creating cleaner ${i}:`, error);
        }
    }

    console.log(`✅ Created ${cleaners.length} cleaners`);
    return cleaners;
};

/**
 * Seed promo codes
 */
const seedPromoCodes = async () => {
    console.log('🚀 Creating promo codes...');
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 0, 1);

    const promos = [
        {
            code: 'SAVE10',
            type: 'percent',
            value: 10,
            description: '10% off your booking',
            minAmount: 0,
            active: true,
            validFrom: new Date().toISOString(),
            validUntil: nextYear.toISOString(),
            maxUses: 1000,
            usedCount: 124,
            firstTimeOnly: false
        },
        {
            code: 'MINUS20',
            type: 'fixed',
            value: 20,
            description: '$20 off your booking',
            minAmount: 50,
            active: true,
            validFrom: new Date().toISOString(),
            validUntil: nextYear.toISOString(),
            maxUses: 500,
            usedCount: 42,
            firstTimeOnly: false
        },
        {
            code: 'FIRSTTIME',
            type: 'fixed',
            value: 25,
            description: '$25 off first booking',
            minAmount: 0,
            active: true,
            validFrom: new Date().toISOString(),
            validUntil: nextYear.toISOString(),
            maxUses: 1000,
            usedCount: 0,
            firstTimeOnly: true
        }
    ];

    for (const p of promos) {
        await createPromoCode(p);
    }
    console.log(`✅ Created ${promos.length} promo codes`);
    return promos;
};

// Review comments and tags
const REVIEW_COMMENTS = [
    'Amazing work! My house has never looked cleaner.',
    'Very professional and thorough. Highly recommend!',
    'Great attention to detail. Will book again.',
    'On time, friendly, and did an excellent job.',
    'Exceeded my expectations. The bathroom sparkles!',
    'Reliable and hardworking. Worth every penny.',
    'Did a fantastic job with my move-out cleaning.',
    'Very careful with my belongings and so thorough.',
    'Love how they organized while cleaning!',
    'Perfect deep clean for spring cleaning.',
];

const REVIEW_TAGS = [
    'Professional', 'Thorough', 'On Time', 'Great Value',
    'Detail Oriented', 'Friendly', 'Reliable', 'Organized',
    'Pet Friendly', 'Great Communication'
];

/**
 * Seed reviews for cleaners
 */
const seedCleanerReviews = async (cleanerProfiles, customerUsers) => {
    console.log('🚀 Creating reviews for cleaners...');
    let reviewCount = 0;

    for (const cleaner of cleanerProfiles) {
        // Create 5-15 reviews per cleaner
        const numReviews = getRandomNumber(5, 15);

        for (let i = 0; i < numReviews; i++) {
            const customer = getRandom(customerUsers);
            const rating = getRandomNumber(3, 5); // Mostly positive reviews
            const numTags = getRandomNumber(2, 4);
            const tags = [];
            for (let t = 0; t < numTags; t++) {
                const tag = getRandom(REVIEW_TAGS);
                if (!tags.includes(tag)) tags.push(tag);
            }

            await createReview({
                cleanerId: cleaner.id,
                customerId: customer.uid,
                customerName: customer.name,
                rating,
                comment: getRandom(REVIEW_COMMENTS),
                tags,
                jobId: generateId('job'),
                createdAt: new Date(Date.now() - getRandomNumber(1, 90) * 24 * 60 * 60 * 1000).toISOString(),
            });
            reviewCount++;
        }
    }

    console.log(`✅ Created ${reviewCount} reviews`);
    return reviewCount;
};

/**
 * Seed notifications for cleaners
 */
const seedCleanerNotifications = async (cleanerUsers, customerUsers) => {
    console.log('🚀 Creating notifications for cleaners...');
    let notifCount = 0;

    const notifTemplates = [
        { type: 'job_available', title: 'New Job Available!', getMessage: (c) => `Deep Clean in Dallas, TX - $${getRandomNumber(100, 200)} earnings` },
        { type: 'payment', title: 'Payment Received', getMessage: () => `You received $${getRandomNumber(80, 180)}.00 for job #GS-2026-${getRandomNumber(100, 999)}` },
        { type: 'review', title: 'New 5-Star Review!', getMessage: (c) => `"${getRandom(REVIEW_COMMENTS).slice(0, 40)}..." - ${getRandom(customerUsers)?.name || 'Customer'}` },
        { type: 'reminder', title: 'Upcoming Job Tomorrow', getMessage: () => `Regular Clean at ${getRandomNumber(100, 999)} ${getRandom(STREET_NAMES)} - 9:00 AM` },
        { type: 'message', title: 'New Message', getMessage: (c) => `${getRandom(customerUsers)?.name || 'Customer'}: "Hi, just wanted to confirm..."` },
    ];

    for (const user of cleanerUsers) {
        // Create 5-10 notifications per cleaner
        const numNotifs = getRandomNumber(5, 10);

        for (let i = 0; i < numNotifs; i++) {
            const template = getRandom(notifTemplates);
            const isRecent = i < 3; // First 3 are unread/recent

            await createNotification(user.uid, {
                type: template.type,
                title: template.title,
                message: template.getMessage(customerUsers),
                read: !isRecent,
                createdAt: new Date(Date.now() - getRandomNumber(1, 72) * 60 * 60 * 1000).toISOString(),
            });
            notifCount++;
        }
    }

    console.log(`✅ Created ${notifCount} notifications`);
    return notifCount;
};

/**
 * Seed messages/conversations for cleaners
 */
const seedCleanerMessages = async (cleanerUsers, customerUsers) => {
    console.log('🚀 Creating conversations and messages...');
    let convCount = 0;
    let msgCount = 0;

    const messageTemplates = [
        ['Hi! I just booked you for a deep clean.', 'Great! I look forward to it. Any specific areas you want me to focus on?'],
        ['What time will you arrive?', 'I should be there around 9:00 AM. I\'ll message when I\'m on my way!'],
        ['The house looks amazing! Thank you!', 'So glad you\'re happy! Let me know if you need anything else.'],
        ['Can you also clean the garage?', 'Sure! I can add that for an extra $30. Does that work?', 'Yes, that\'s perfect!'],
        ['Running about 10 mins late, sorry!', 'No problem, take your time!'],
    ];

    for (const cleaner of cleanerUsers) {
        // Create 2-4 conversations per cleaner
        const numConvs = getRandomNumber(2, 4);
        const usedCustomers = new Set();

        for (let i = 0; i < numConvs; i++) {
            let customer = getRandom(customerUsers);
            // Avoid duplicate conversations with same customer
            while (usedCustomers.has(customer.uid) && usedCustomers.size < customerUsers.length) {
                customer = getRandom(customerUsers);
            }
            usedCustomers.add(customer.uid);

            const conv = await createConversation([cleaner.uid, customer.uid], {
                cleanerName: cleaner.name,
                customerName: customer.name,
            });
            convCount++;

            // Add messages to conversation
            const messageThread = getRandom(messageTemplates);
            for (let m = 0; m < messageThread.length; m++) {
                const senderId = m % 2 === 0 ? customer.uid : cleaner.uid;
                await sendMessage(conv.id, senderId, messageThread[m]);
                msgCount++;
            }
        }
    }

    console.log(`✅ Created ${convCount} conversations with ${msgCount} messages`);
    return { convCount, msgCount };
};

/**
 * Seed jobs for cleaners
 */
const seedCleanerJobs = async (cleanerProfiles, customerUsers) => {
    console.log('🚀 Creating jobs for cleaners...');
    let jobCount = 0;

    const serviceTypes = ['Regular Clean', 'Deep Clean', 'Move-Out Clean', 'Window Cleaning'];
    const jobStatuses = ['completed', 'completed', 'completed', 'scheduled', 'in_progress'];

    for (const cleaner of cleanerProfiles) {
        // Create 10-25 jobs per cleaner
        const numJobs = getRandomNumber(10, 25);

        for (let i = 0; i < numJobs; i++) {
            const customer = getRandom(customerUsers);
            const serviceType = getRandom(serviceTypes);
            const status = i < numJobs - 2 ? 'completed' : getRandom(jobStatuses);
            const daysAgo = status === 'scheduled' ? -getRandomNumber(1, 7) : getRandomNumber(1, 60);
            const scheduledDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

            let amount = 0;
            let duration = 2;
            if (serviceType === 'Regular Clean') {
                amount = getRandomNumber(80, 120);
                duration = getRandomNumber(2, 3);
            } else if (serviceType === 'Deep Clean') {
                amount = getRandomNumber(150, 250);
                duration = getRandomNumber(3, 5);
            } else if (serviceType === 'Move-Out Clean') {
                amount = getRandomNumber(180, 300);
                duration = getRandomNumber(4, 6);
            } else {
                amount = getRandomNumber(100, 180);
                duration = getRandomNumber(2, 4);
            }

            const tip = status === 'completed' && Math.random() > 0.4
                ? getRandomNumber(10, 40)
                : 0;

            const cities = Object.keys(TEXAS_CITIES);
            const city = getRandom(cities);
            const address = generateAddress(city);

            const job = {
                id: generateId('job'),
                cleanerId: cleaner.id,
                customerId: customer.uid,
                customerName: customer.name,
                serviceType,
                status,
                amount,
                tip,
                earnings: amount + tip,
                duration,
                address: address.street + ', ' + address.city,
                scheduledDate: scheduledDate.toISOString(),
                startTime: status !== 'scheduled' ? scheduledDate.toISOString() : null,
                endTime: status === 'completed'
                    ? new Date(scheduledDate.getTime() + duration * 60 * 60 * 1000).toISOString()
                    : null,
                completedAt: status === 'completed'
                    ? new Date(scheduledDate.getTime() + duration * 60 * 60 * 1000).toISOString()
                    : null,
                createdAt: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            };

            await setDoc(COLLECTIONS.JOBS, job.id, job);
            jobCount++;
        }
    }

    console.log(`✅ Created ${jobCount} jobs`);
    return jobCount;
};

/**
 * Seed transactions (payouts) for cleaners
 */
const seedCleanerTransactions = async (cleanerProfiles) => {
    console.log('🚀 Creating payout transactions for cleaners...');
    let txnCount = 0;

    for (const cleaner of cleanerProfiles) {
        // Create 1-3 payouts for each cleaner
        const numTxns = getRandomNumber(1, 3);

        for (let i = 0; i < numTxns; i++) {
            const amount = getRandomNumber(200, 500);
            const daysAgo = getRandomNumber(5, 45);
            const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

            await createTransaction(cleaner.id, {
                type: 'payout',
                amount: amount,
                description: 'Withdrawal to Bank Account',
                status: 'paid',
                createdAt: date.toISOString()
            });
            txnCount++;
        }
    }

    console.log(`✅ Created ${txnCount} payout transactions`);
    return txnCount;
};


/**
 * Seed all data (customers + cleaners)
 */

/**
 * Create admin user
 */
export const createAdminUser = async () => {
    console.log('👤 Creating admin user...');
    try {
        const result = await signUpWithEmail('admin@goswish.com', 'Admin123!', 'GoSwish Admin');

        if (result.success && result.user) {
            // Update role to admin
            await setDoc(COLLECTIONS.USERS, result.user.uid, {
                ...result.user,
                role: 'admin',
                isAdmin: true
            });
            console.log('✅ Admin user created: admin@goswish.com');
            return result.user;
        } else if (result.error && (result.error.includes('registered') || result.error.includes('in use'))) {
            console.log('⚠️ Admin user exists. Ensuring credentials and role...');
            // Force reset password and role
            try {
                // Reset password
                await forceResetUserPassword('admin@goswish.com', 'Admin123!');

                // Ensure role is admin
                // We need to find the user ID first
                const { queryDocs, updateDoc } = await import('./db.js');
                const users = await queryDocs(COLLECTIONS.USERS, 'email', 'admin@goswish.com');
                if (users.length > 0) {
                    await updateDoc(COLLECTIONS.USERS, users[0].id, {
                        role: 'admin',
                        isAdmin: true
                    });
                    console.log('✅ Admin account recovered and updated');
                }
            } catch (recoveryError) {
                console.error('❌ Failed to recover admin account:', recoveryError);
            }
        } else {
            console.log('❌ Failed to create admin user:', result.error);
        }
    } catch (error) {
        console.log('❌ Unexpected error creating admin user:', error.message);
    }
    return null;
};

/**
 * Seed all data (customers + cleaners)
 */
export const seedAllData = async () => {
    console.log('🌱 Starting data seeding...');

    console.log('');

    const startTime = Date.now();

    try {
        // Create admin
        await createAdminUser();
        console.log('');

        // Create customers
        const customers = await createCustomerProfiles();
        console.log('');

        // Create cleaners
        const cleaners = await createCleanerProfiles();
        console.log('');

        // Create promo codes
        await seedPromoCodes();
        console.log('');

        // Get cleaner profiles for additional seeding
        const { getDocs } = await import('./db.js');
        const cleanerProfiles = await getDocs(COLLECTIONS.CLEANERS);
        const cleanerUsers = cleaners; // These are user objects
        const customerUsers = customers; // These are user objects

        // Seed cleaner-related data
        console.log('🚀 Seeding cleaner-related data...');
        console.log('');

        // Create jobs for cleaners
        // await seedCleanerJobs(cleanerProfiles, customerUsers);
        console.log('Skipping job seeding as requested');

        // Create reviews for cleaners
        await seedCleanerReviews(cleanerProfiles, customerUsers);
        console.log('');

        // Create notifications for cleaners
        await seedCleanerNotifications(cleanerUsers, customerUsers);
        console.log('');

        // Create conversations and messages
        await seedCleanerMessages(cleanerUsers, customerUsers);
        console.log('');

        // Create payout transactions
        await seedCleanerTransactions(cleanerProfiles);
        console.log('');

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('✅ Data seeding complete!');
        console.log(`📊 Summary:`);
        console.log(`   - Customers: ${customers.length}`);
        console.log(`   - Cleaners: ${cleaners.length}`);
        console.log(`   - Time: ${duration}s`);
        console.log('');
        console.log('🔑 Login credentials:');
        console.log('   Customers: customer1@goswish.com to customer30@goswish.com');
        console.log('   Cleaners: cleaner1@goswish.com to cleaner30@goswish.com');
        console.log('   Password (all): Customer123! or Cleaner123!');
        console.log('');
        console.log('🌆 Cities: Dallas, Fort Worth, Austin, San Antonio, Houston');

        return {
            success: true,
            customers,
            cleaners,
            duration,
        };
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};


/**
 * Get seeding statistics
 */
export const getSeedingStats = async () => {
    const { getDocs, COLLECTIONS } = await import('./db.js');

    const users = await getDocs(COLLECTIONS.USERS);
    const cleaners = await getDocs(COLLECTIONS.CLEANERS);
    const houses = await getDocs(COLLECTIONS.HOUSES);

    const customers = users.filter(u => u.role === 'homeowner');
    const cleanerUsers = users.filter(u => u.role === 'cleaner');

    // Count by city
    const cityCounts = {};
    Object.keys(TEXAS_CITIES).forEach(city => {
        cityCounts[city] = {
            customers: 0,
            cleaners: 0,
        };
    });

    houses.forEach(house => {
        if (cityCounts[house.address.city]) {
            cityCounts[house.address.city].customers++;
        }
    });

    cleaners.forEach(cleaner => {
        if (cityCounts[cleaner.baseLocation.city]) {
            cityCounts[cleaner.baseLocation.city].cleaners++;
        }
    });

    return {
        total: {
            users: users.length,
            customers: customers.length,
            cleaners: cleanerUsers.length,
            cleanerProfiles: cleaners.length,
            houses: houses.length,
        },
        byCities: cityCounts,
    };
};
