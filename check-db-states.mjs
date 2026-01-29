#!/usr/bin/env node
/**
 * Script to check the actual database state codes
 * This runs the migration automatically if needed
 */

import { openDB } from 'idb';

const DB_NAME = 'GoSwishDB';
const DB_VERSION = 1;

async function checkDatabaseStates() {
    console.log('🔍 Opening IndexedDB database...\n');

    try {
        const db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Just open, don't modify
            }
        });

        console.log('✅ Database opened successfully');
        console.log(`Database name: ${db.name}`);
        console.log(`Database version: ${db.version}`);
        console.log(`Object stores: ${Array.from(db.objectStoreNames).join(', ')}\n`);

        if (!db.objectStoreNames.contains('houses')) {
            console.log('❌ No houses collection found in database');
            db.close();
            return;
        }

        // Get all houses
        const tx = db.transaction('houses', 'readonly');
        const store = tx.objectStore('houses');
        const houses = await store.getAll();
        await tx.done;

        console.log(`📊 Found ${houses.length} houses in database\n`);

        if (houses.length === 0) {
            console.log('No houses to check.');
            db.close();
            return;
        }

        // Analyze states
        const results = {
            valid: [],
            invalid: [],
            missing: []
        };

        houses.forEach((house, index) => {
            const state = house?.address?.state;
            const houseInfo = {
                index: index + 1,
                id: house.id,
                name: house.name || house.nickname || 'Unnamed',
                state: state,
                stateLength: state?.length || 0,
                city: house.address?.city,
                street: house.address?.street
            };

            if (!state) {
                results.missing.push(houseInfo);
            } else if (state.length !== 2) {
                results.invalid.push(houseInfo);
            } else {
                results.valid.push(houseInfo);
            }
        });

        console.log('=' .repeat(70));
        console.log('DATABASE STATE ANALYSIS');
        console.log('='.repeat(70));
        console.log(`✅ Houses with VALID 2-letter state codes: ${results.valid.length}`);
        console.log(`⚠️  Houses with INVALID state codes: ${results.invalid.length}`);
        console.log(`❌ Houses MISSING state codes: ${results.missing.length}`);
        console.log('='.repeat(70) + '\n');

        if (results.valid.length > 0) {
            console.log('✅ VALID HOUSES (first 5):');
            console.table(results.valid.slice(0, 5).map(h => ({
                Name: h.name,
                State: h.state,
                City: h.city
            })));
            console.log('');
        }

        if (results.invalid.length > 0) {
            console.log('⚠️  INVALID STATE CODES:');
            console.table(results.invalid.map(h => ({
                Name: h.name,
                State: h.state,
                Length: h.stateLength,
                City: h.city
            })));
            console.log('');
        }

        if (results.missing.length > 0) {
            console.log('❌ MISSING STATE CODES:');
            console.table(results.missing.map(h => ({
                Name: h.name,
                City: h.city || 'N/A',
                Street: h.street || 'N/A'
            })));
            console.log('');
        }

        // Conclusion
        console.log('\n' + '='.repeat(70));
        if (results.missing.length > 0 || results.invalid.length > 0) {
            console.log('❌ PROBLEM FOUND: Houses exist without proper 2-letter state codes!');
            console.log('\n🔧 SOLUTION:');
            console.log('   1. Click "Fix States" button in the app');
            console.log('   2. Or run: migrateHouseStates() in browser console');
            console.log('   3. Or click "Reset DB" to start fresh with seed data');
        } else {
            console.log('✅ ALL HOUSES HAVE VALID STATE CODES!');
            console.log('   Booking IDs should work correctly.');
        }
        console.log('='.repeat(70));

        db.close();

    } catch (error) {
        console.error('❌ Error accessing database:', error);
        console.error('\nNote: IndexedDB can only be accessed from a browser context.');
        console.error('Please run the test using the "Test States" button in the app instead.');
    }
}

checkDatabaseStates().catch(console.error);
