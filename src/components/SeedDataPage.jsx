/**
 * Seed Data Page
 * Create 30 customers and 30 cleaners with Texas city data
 */

import React, { useState } from 'react';
import { initDB, initializeDatabase } from '../storage';
import {
    seedAllData,
    createCustomerProfiles,
    createCleanerProfiles,
    getSeedingStats
} from '../storage/seedData';

export default function SeedDataPage() {
    const [logs, setLogs] = useState([]);
    const [isSeeding, setIsSeeding] = useState(false);
    const [stats, setStats] = useState(null);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
        console.log(`[${type.toUpperCase()}]`, message);
    };

    // Seed all data (customers + cleaners)
    const handleSeedAll = async () => {
        if (!confirm('This will create 30 customers and 30 cleaners. Continue?')) return;

        setIsSeeding(true);
        setLogs([]);
        addLog('🌱 Starting data seeding...', 'info');

        try {
            // Initialize database first
            await initDB();
            await initializeDatabase();
            addLog('✅ Database initialized', 'success');

            // Seed all data
            const result = await seedAllData();

            if (result.success) {
                addLog(`✅ Seeding complete in ${result.duration}s`, 'success');
                addLog(`📊 Created ${result.customers.length} customers and ${result.cleaners.length} cleaners`, 'success');

                // Get stats
                const newStats = await getSeedingStats();
                setStats(newStats);
            } else {
                addLog(`❌ Seeding failed: ${result.error}`, 'error');
            }
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        } finally {
            setIsSeeding(false);
        }
    };

    // Seed only customers
    const handleSeedCustomers = async () => {
        if (!confirm('This will create 30 customers. Continue?')) return;

        setIsSeeding(true);
        setLogs([]);
        addLog('🌱 Creating customers...', 'info');

        try {
            await initDB();
            await initializeDatabase();

            const customers = await createCustomerProfiles();
            addLog(`✅ Created ${customers.length} customers`, 'success');

            const newStats = await getSeedingStats();
            setStats(newStats);
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        } finally {
            setIsSeeding(false);
        }
    };

    // Seed only cleaners
    const handleSeedCleaners = async () => {
        if (!confirm('This will create 30 cleaners. Continue?')) return;

        setIsSeeding(true);
        setLogs([]);
        addLog('🌱 Creating cleaners...', 'info');

        try {
            await initDB();
            await initializeDatabase();

            const cleaners = await createCleanerProfiles();
            addLog(`✅ Created ${cleaners.length} cleaners`, 'success');

            const newStats = await getSeedingStats();
            setStats(newStats);
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        } finally {
            setIsSeeding(false);
        }
    };

    // Get statistics
    const handleGetStats = async () => {
        try {
            addLog('📊 Getting statistics...', 'info');
            const newStats = await getSeedingStats();
            setStats(newStats);
            addLog('✅ Statistics loaded', 'success');
        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>🌱 Seed Test Data</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Create 30 customers and 30 cleaners with realistic Texas city data
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleSeedAll}
                    disabled={isSeeding}
                    style={{
                        ...buttonStyle,
                        background: isSeeding ? '#ccc' : '#28a745',
                        cursor: isSeeding ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isSeeding ? '⏳ Seeding...' : '🌱 Seed All (30+30)'}
                </button>

                <button
                    onClick={handleSeedCustomers}
                    disabled={isSeeding}
                    style={{
                        ...buttonStyle,
                        background: isSeeding ? '#ccc' : '#007bff',
                        cursor: isSeeding ? 'not-allowed' : 'pointer',
                    }}
                >
                    👥 Seed Customers (30)
                </button>

                <button
                    onClick={handleSeedCleaners}
                    disabled={isSeeding}
                    style={{
                        ...buttonStyle,
                        background: isSeeding ? '#ccc' : '#17a2b8',
                        cursor: isSeeding ? 'not-allowed' : 'pointer',
                    }}
                >
                    🧹 Seed Cleaners (30)
                </button>

                <button
                    onClick={handleGetStats}
                    style={{
                        ...buttonStyle,
                        background: '#6c757d',
                    }}
                >
                    📊 Get Statistics
                </button>
            </div>

            {/* Login Credentials Info */}
            <div style={{
                background: '#e7f3ff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                border: '1px solid #b3d9ff'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#004085' }}>🔑 Login Credentials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>Customers</h4>
                        <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>
                            customer1@goswish.com<br />
                            customer2@goswish.com<br />
                            ...<br />
                            customer30@goswish.com
                        </p>
                        <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', color: '#004085' }}>
                            Password: Customer123!
                        </p>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>Cleaners</h4>
                        <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>
                            cleaner1@goswish.com<br />
                            cleaner2@goswish.com<br />
                            ...<br />
                            cleaner30@goswish.com
                        </p>
                        <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', color: '#004085' }}>
                            Password: Cleaner123!
                        </p>
                    </div>
                </div>
                <p style={{ margin: '15px 0 0 0', color: '#004085', fontSize: '14px' }}>
                    🌆 <strong>Cities:</strong> Dallas, Fort Worth, Austin, San Antonio, Houston
                </p>
            </div>

            {/* Statistics */}
            {stats && (
                <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    border: '1px solid #dee2e6'
                }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>📊 Database Statistics</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <StatCard label="Total Users" value={stats.total.users} color="#007bff" />
                        <StatCard label="Customers" value={stats.total.customers} color="#28a745" />
                        <StatCard label="Cleaners" value={stats.total.cleaners} color="#17a2b8" />
                        <StatCard label="Cleaner Profiles" value={stats.total.cleanerProfiles} color="#6c757d" />
                        <StatCard label="Houses" value={stats.total.houses} color="#ffc107" />
                    </div>

                    <h4 style={{ margin: '20px 0 10px 0' }}>By City</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {Object.entries(stats.byCities).map(([city, counts]) => (
                            <div key={city} style={{
                                background: '#fff',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{city}</div>
                                <div style={{ fontSize: '14px', color: '#666' }}>
                                    Customers: {counts.customers} | Cleaners: {counts.cleaners}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Console Logs */}
            <div style={{
                background: '#1e1e1e',
                color: '#fff',
                padding: '15px',
                borderRadius: '8px',
                maxHeight: '400px',
                overflow: 'auto'
            }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Console Logs</h3>
                {logs.length === 0 ? (
                    <p style={{ opacity: 0.5 }}>No logs yet... Click a button above to start seeding data.</p>
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

// Stat Card Component
function StatCard({ label, value, color }) {
    return (
        <div style={{
            background: '#fff',
            padding: '15px',
            borderRadius: '6px',
            border: `2px solid ${color}`,
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color, marginBottom: '5px' }}>
                {value}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                {label}
            </div>
        </div>
    );
}

const buttonStyle = {
    padding: '12px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'opacity 0.2s',
};
