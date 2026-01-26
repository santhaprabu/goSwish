/**
 * Auto-seed script
 * Run this to automatically create 30 customers and 30 cleaners
 */

import { initDB, initializeDatabase } from './storage/index.js';
import { seedAllData } from './storage/seedData.js';

console.log('🌱 Starting automatic data seeding...');
console.log('');

// Initialize and seed
async function autoSeed() {
    try {
        // Step 1: Initialize database
        console.log('📦 Initializing database...');
        await initDB();
        await initializeDatabase();
        console.log('✅ Database initialized');
        console.log('');

        // Step 2: Seed all data
        console.log('🌱 Creating 30 customers and 30 cleaners...');
        console.log('⏳ This will take about 10-15 seconds...');
        console.log('');

        const result = await seedAllData();

        if (result.success) {
            console.log('');
            console.log('🎉 SUCCESS! Data seeding complete!');
            console.log('');
            console.log('📊 Summary:');
            console.log(`   ✅ Customers created: ${result.customers.length}`);
            console.log(`   ✅ Cleaners created: ${result.cleaners.length}`);
            console.log(`   ⏱️  Time taken: ${result.duration}s`);
            console.log('');
            console.log('🔑 You can now login with:');
            console.log('   📧 customer1@goswish.com / Customer123!');
            console.log('   📧 cleaner1@goswish.com / Cleaner123!');
            console.log('');
            console.log('🌆 Cities: Dallas, Fort Worth, Austin, San Antonio, Houston');
            console.log('');
        } else {
            console.error('❌ Seeding failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    }
}

// Run the seeding
autoSeed();
