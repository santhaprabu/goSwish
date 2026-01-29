/**
 * Storage Test & Demo Page
 * Use this to test the storage system
 */

import React, { useState, useEffect } from 'react';
import {
    initDB,
    initializeDatabase,
    verifyDatabase,
    signUpWithEmail,
    signInWithEmail,
    getCurrentUser,
    signOut,
    createHouse,
    getUserHouses,
    createBooking,
    getCustomerBookings,
    getServiceTypes,
    getAddOns,
    validatePromoCode,
    exportDatabase,
    clearDatabase,
} from '../storage';

export default function StorageTest() {
    const [status, setStatus] = useState('Not initialized');
    const [currentUser, setCurrentUser] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
        console.log(`[${type.toUpperCase()}]`, message);
    };

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
    }, []);

    // Initialize database
    const handleInit = async () => {
        try {
            setStatus('Initializing...');
            addLog('Initializing database...', 'info');

            await initDB();
            addLog('✅ IndexedDB initialized', 'success');

            await initializeDatabase();
            addLog('✅ Database initialized with default data', 'success');

            const verification = await verifyDatabase();
            addLog(`✅ Database verified: ${JSON.stringify(verification.counts)}`, 'success');

            setStatus('Ready');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
            setStatus('Error');
        }
    };

    // Test sign up
    const handleSignUp = async () => {
        try {
            const email = `test${Date.now()}@example.com`;
            const password = 'Test1234!';

            addLog(`Creating user: ${email}`, 'info');

            const result = await signUpWithEmail(email, password, {
                name: 'Test User',
                role: 'homeowner',
                phone: '555-1234',
            });

            if (result.success) {
                addLog(`✅ User created: ${result.user.email}`, 'success');
                setCurrentUser(result.user);
            } else {
                addLog(`❌ Sign up failed: ${result.error}`, 'error');
            }
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test sign in
    const handleSignIn = async () => {
        try {
            const email = prompt('Enter email:');
            const password = prompt('Enter password:');

            if (!email || !password) return;

            addLog(`Signing in: ${email}`, 'info');

            const result = await signInWithEmail(email, password);

            if (result.success) {
                addLog(`✅ Signed in: ${result.user.email}`, 'success');
                setCurrentUser(result.user);
            } else {
                addLog(`❌ Sign in failed: ${result.error}`, 'error');
            }
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test sign out
    const handleSignOut = async () => {
        try {
            await signOut();
            addLog('✅ Signed out', 'success');
            setCurrentUser(null);
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test create house
    const handleCreateHouse = async () => {
        if (!currentUser) {
            addLog('❌ Please sign in first', 'error');
            return;
        }

        try {
            addLog('Creating house...', 'info');

            const house = await createHouse(currentUser.uid, {
                nickname: 'Test House',
                address: {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94102',
                },
                size: 1500,
                bedrooms: 2,
                bathrooms: 2,
                propertyType: 'house',
            });

            addLog(`✅ House created: ${house.nickname} (${house.id})`, 'success');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test get houses
    const handleGetHouses = async () => {
        if (!currentUser) {
            addLog('❌ Please sign in first', 'error');
            return;
        }

        try {
            const houses = await getUserHouses(currentUser.uid);
            addLog(`✅ Found ${houses.length} houses`, 'success');
            houses.forEach(house => {
                addLog(`  - ${house.nickname} (${house.address.city})`, 'info');
            });
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test create booking
    const handleCreateBooking = async () => {
        if (!currentUser) {
            addLog('❌ Please sign in first', 'error');
            return;
        }

        try {
            const houses = await getUserHouses(currentUser.uid);

            if (houses.length === 0) {
                addLog('❌ Please create a house first', 'error');
                return;
            }

            addLog('Creating booking...', 'info');

            const booking = await createBooking({
                customerId: currentUser.uid,
                cleanerId: 'demo-cleaner-123',
                houseId: houses[0].id,
                serviceType: 'regular',
                addOns: ['inside-fridge'],
                selectedDate: {
                    date: new Date().toISOString(),
                    timeSlot: '9:00 AM - 12:00 PM',
                },
                pricingBreakdown: {
                    basePrice: 100,
                    addOnsTotal: 15,
                    subtotal: 115,
                    discount: 0,
                    tax: 9.49,
                    total: 124.49,
                },
            });

            addLog(`✅ Booking created: ${booking.bookingId}`, 'success');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test get bookings
    const handleGetBookings = async () => {
        if (!currentUser) {
            addLog('❌ Please sign in first', 'error');
            return;
        }

        try {
            const bookings = await getCustomerBookings(currentUser.uid);
            addLog(`✅ Found ${bookings.length} bookings`, 'success');
            bookings.forEach(booking => {
                addLog(`  - ${booking.bookingId} (${booking.status})`, 'info');
            });
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test get service types
    const handleGetServices = async () => {
        try {
            const services = await getServiceTypes();
            addLog(`✅ Found ${services.length} service types`, 'success');
            services.forEach(service => {
                addLog(`  - ${service.name} ($${service.basePrice})`, 'info');
            });
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test get add-ons
    const handleGetAddOns = async () => {
        try {
            const addOns = await getAddOns();
            addLog(`✅ Found ${addOns.length} add-ons`, 'success');
            addOns.forEach(addOn => {
                addLog(`  - ${addOn.name} ($${addOn.price})`, 'info');
            });
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Test validate promo code
    const handleValidatePromo = async () => {
        if (!currentUser) {
            addLog('❌ Please sign in first', 'error');
            return;
        }

        try {
            const result = await validatePromoCode('WELCOME20', currentUser.uid, 'regular', 100);

            if (result.valid) {
                addLog(`✅ Promo code valid: ${result.promo.description}`, 'success');
            } else {
                addLog(`❌ Promo code invalid: ${result.error}`, 'error');
            }
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Export data
    const handleExport = async () => {
        try {
            const data = await exportDatabase();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `goswish-backup-${Date.now()}.json`;
            a.click();

            addLog('✅ Database exported', 'success');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    // Clear database
    const handleClear = async () => {
        if (!confirm('Are you sure you want to clear all data?')) return;

        try {
            await clearDatabase();
            await initializeDatabase();
            addLog('✅ Database cleared and reinitialized', 'success');
            setCurrentUser(null);
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>🧪 Storage System Test</h1>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
                <p><strong>Status:</strong> {status}</p>
                {currentUser && (
                    <p><strong>Current User:</strong> {currentUser.email} ({currentUser.role})</p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <button onClick={handleInit} style={buttonStyle}>
                    🚀 Initialize DB
                </button>
                <button onClick={handleSignUp} style={buttonStyle}>
                    ➕ Sign Up
                </button>
                <button onClick={handleSignIn} style={buttonStyle}>
                    🔑 Sign In
                </button>
                <button onClick={handleSignOut} style={buttonStyle} disabled={!currentUser}>
                    🚪 Sign Out
                </button>
                <button onClick={handleCreateHouse} style={buttonStyle} disabled={!currentUser}>
                    🏠 Create House
                </button>
                <button onClick={handleGetHouses} style={buttonStyle} disabled={!currentUser}>
                    📋 Get Houses
                </button>
                <button onClick={handleCreateBooking} style={buttonStyle} disabled={!currentUser}>
                    📅 Create Booking
                </button>
                <button onClick={handleGetBookings} style={buttonStyle} disabled={!currentUser}>
                    📋 Get Bookings
                </button>
                <button onClick={handleGetServices} style={buttonStyle}>
                    🧹 Get Services
                </button>
                <button onClick={handleGetAddOns} style={buttonStyle}>
                    ➕ Get Add-ons
                </button>
                <button onClick={handleValidatePromo} style={buttonStyle} disabled={!currentUser}>
                    🎟️ Validate Promo
                </button>
                <button onClick={handleExport} style={buttonStyle}>
                    💾 Export Data
                </button>
                <button onClick={handleClear} style={{ ...buttonStyle, background: '#dc3545' }}>
                    🗑️ Clear DB
                </button>
            </div>

            <div style={{ background: '#1e1e1e', color: '#fff', padding: '15px', borderRadius: '8px', maxHeight: '400px', overflow: 'auto' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Console Logs</h3>
                {logs.length === 0 ? (
                    <p style={{ opacity: 0.5 }}>No logs yet...</p>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '5px 0',
                                borderBottom: '1px solid #333',
                                color: log.type === 'error' ? '#ff6b6b' : log.type === 'success' ? '#51cf66' : '#fff',
                            }}
                        >
                            <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {log.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const buttonStyle = {
    padding: '10px 15px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
};
