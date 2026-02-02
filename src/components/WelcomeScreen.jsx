import { useState } from 'react';
/*
 * ============================================================================
 * WELCOME / AUTH SCREEN
 * ============================================================================
 * 
 * Purpose:
 * The main entry point supporting:
 * - Login (Email/Password & OTP Phone Login)
 * - Sign Up (Dual flows for Cleaner/Customer)
 * - Social Login (Mocked)
 * 
 * Architecture:
 * Uses a "Bottom Sheet" design pattern for a modern mobile feel.
 */
import { Mail, Lock, Loader2, Sparkles, ArrowLeft, User, Phone, ShieldCheck } from 'lucide-react';
import OTPInput from './OTPInput';
import { useApp } from '../context/AppContext';

export default function WelcomeScreen({ onSuccess, initialMode = 'welcome' }) {
    // Destructure all needed context methods at the top level
    const { login, signup, setRole, requestOtp, loginWithOtp, checkUser } = useApp();

    const [mode, setMode] = useState(initialMode); // 'welcome' | 'login' | 'customer-signup' | 'cleaner-signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [greetingName, setGreetingName] = useState('');

    // Modal state for migration
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const [migrationResult, setMigrationResult] = useState(null);

    const handleLogin = async (e, type = 'password') => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (type === 'password') {
                if (!password) {
                    setError('Please enter your password');
                    setLoading(false);
                    return;
                }
                result = await login(email, password);
            } else {
                if (!otp) {
                    setError('Please enter the OTP');
                    setLoading(false);
                    return;
                }
                result = await loginWithOtp(email, otp);
            }

            if (result.success) {
                onSuccess(result.user);
            } else {
                setError(result.error || 'Authentication failed');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        setEmail(identifier);

        // Check for user name
        try {
            const { exists, name } = await checkUser(identifier);
            if (exists && name) {
                setGreetingName(name.split(' ')[0]); // First name only
            } else {
                setGreetingName('Friend');
            }
        } catch (e) {
            setGreetingName('Friend');
        }

        if (identifier) {
            // Check if phone number
            setLoading(true);
            try {
                await requestOtp(identifier);
                setOtpSent(true);
                const isPhone = !identifier.includes('@');
                setError(`OTP code sent to your ${isPhone ? 'phone' : 'email'}`);
            } catch (e) {
                console.error('Auto OTP error:', e);
                setOtpSent(false);
            }
            setLoading(false);
        }

        setMode('login');
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await requestOtp(email);
            setOtpSent(true);
            const isPhone = !email.includes('@');
            setError(`OTP code sent to your ${isPhone ? 'phone' : 'email'}`);
        } catch (e) {
            setError(e.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e, role) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !email || !password || !phone) {
            setError('Please fill in all fields');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const result = await signup({
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim(),
                email,
                password,
                phone,
                role,
                primaryRole: role
            });

            if (result.success) {
                setRole(role);
                onSuccess(result.user);
            } else {
                setError(result.error || 'Signup failed');
            }
        } catch (err) {
            setError('Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        alert(`${provider} login coming soon!`);
    };

    // Welcome Screen - Enhanced UI
    // Welcome Screen - Enhanced UI
    if (mode === 'welcome') {
        return (
            <div className="min-h-screen bg-[#d9d9d9] flex flex-col relative overflow-hidden">
                {/* Header Section */}
                <div className="flex-1 flex flex-col justify-center px-8 z-10 text-gray-900 pb-10">
                    <div className="mb-8 flex justify-center">
                        <img src="/logo-light.jpg" alt="GoSwish" className="h-32 object-contain" />
                    </div>
                    <p className="text-gray-600 text-center text-lg max-w-xs mx-auto leading-relaxed font-medium">
                        Premium home cleaning services at your fingertips.
                    </p>
                </div>

                {/* Bottom Sheet Form */}
                <div className="bg-white rounded-t-[2.5rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <form onSubmit={handleInitialSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                                Get Started
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus:border-black focus:bg-white rounded-2xl transition-all outline-none text-lg font-medium placeholder:text-gray-400"
                                    placeholder="Email or phone"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!identifier.trim()}
                            className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            Continue
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </button>
                    </form>

                    {/* Socials & Divider */}
                    <div className="relative py-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-400 font-medium">or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin('Apple')}
                            className="py-3.5 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                            Apple
                        </button>
                        <button
                            onClick={() => handleSocialLogin('Google')}
                            className="py-3.5 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Google
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => { setRole('homeowner'); setMode('customer-signup'); }} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all text-sm shadow-md">Sign up as Owner</button>
                        <button onClick={() => { setRole('cleaner'); setMode('cleaner-signup'); }} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all text-sm shadow-md">Sign up as Cleaner</button>
                    </div>

                    {/* Developer Tools */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity flex-wrap">
                        <button
                            onClick={async () => {
                                console.log('🧪 Running full state test...');
                                try {
                                    // Import storage functions directly
                                    const { getDocs, COLLECTIONS, getCurrentUser, createBooking, updateDoc } = await import('../storage');

                                    // Get all houses
                                    const houses = await getDocs(COLLECTIONS.HOUSES);
                                    console.log(`Found ${houses.length} houses`);

                                    // Analyze states
                                    const valid = houses.filter(h => h?.address?.state?.length === 2);
                                    const invalid = houses.filter(h => h?.address?.state && h.address.state.length !== 2);
                                    const missing = houses.filter(h => !h?.address?.state);

                                    console.log(`✅ Valid: ${valid.length}, ⚠️  Invalid: ${invalid.length}, ❌ Missing: ${missing.length}`);

                                    if (houses.length === 0) {
                                        alert('No houses found! Please add a house first.');
                                        return;
                                    }

                                    // Get current user
                                    const user = await getCurrentUser();
                                    if (!user) {
                                        alert('Please sign in first!');
                                        return;
                                    }

                                    // Create test booking with first house
                                    const testHouse = houses[0];
                                    console.log(`Testing with house: ${testHouse.name}`);
                                    console.log(`House state: "${testHouse.address?.state}"`);

                                    const testBooking = await createBooking(user.uid, {
                                        houseId: testHouse.id,
                                        serviceTypeId: 'regular-cleaning',
                                        dates: [new Date().toISOString()],
                                        totalAmount: 100,
                                        specialNotes: 'TEST BOOKING'
                                    });

                                    console.log(`Booking created: ${testBooking.bookingId}`);

                                    // Clean up
                                    await updateDoc(COLLECTIONS.BOOKINGS, testBooking.id, { status: 'cancelled' });

                                    const stateInBooking = testBooking.bookingId.split('-')[0];
                                    const success = stateInBooking !== 'US';

                                    alert(`Test Complete!\n\n✅ Valid: ${valid.length}\n⚠️  Invalid: ${invalid.length}\n❌ Missing: ${missing.length}\n\nBooking ID: ${testBooking.bookingId}\nHouse State: ${testHouse.address?.state}\n\n${success ? '✅ Working!' : '❌ Using fallback "US"'}\n\nCheck console for details.`);
                                } catch (error) {
                                    alert('Test failed! Check console for details.');
                                    console.error('Test error:', error);
                                }
                            }}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                        >
                            Test States
                        </button>
                        <button
                            onClick={async () => {
                                console.log('🔍 Starting database check...');
                                const { checkAllHouses } = await import('../storage');
                                const result = await checkAllHouses();

                                // Show summary in alert
                                const total = result.withState.length + result.invalidState.length + result.missingState.length;
                                let message = `📊 Database Check Complete!\n\n`;
                                message += `Total houses: ${total}\n`;
                                message += `✅ Valid state codes: ${result.withState.length}\n`;
                                message += `⚠️  Invalid state codes: ${result.invalidState.length}\n`;
                                message += `❌ Missing state codes: ${result.missingState.length}\n\n`;
                                message += `Check the browser console (F12) for full details.`;

                                alert(message);

                                // Show detailed results in console
                                console.log('\n' + '='.repeat(60));
                                console.log('📊 DATABASE CHECK RESULTS');
                                console.log('='.repeat(60));
                                console.log(`Total: ${total} houses`);
                                console.log(`✅ Valid: ${result.withState.length}`);
                                console.log(`⚠️  Invalid: ${result.invalidState.length}`);
                                console.log(`❌ Missing: ${result.missingState.length}`);
                                console.log('='.repeat(60) + '\n');

                                if (result.missingState.length > 0) {
                                    console.log('❌ HOUSES MISSING STATE CODES:');
                                    console.table(result.missingState.map(h => ({
                                        Name: h.name,
                                        City: h.address?.city || 'N/A',
                                        Street: h.address?.street || 'N/A'
                                    })));
                                }

                                if (result.invalidState.length > 0) {
                                    console.log('⚠️  HOUSES WITH INVALID STATE CODES:');
                                    console.table(result.invalidState.map(h => ({
                                        Name: h.name,
                                        State: h.state,
                                        Length: h.state?.length || 0,
                                        City: h.address?.city || 'N/A'
                                    })));
                                }

                                if (result.withState.length > 0) {
                                    console.log(`✅ First 5 houses with valid state codes:`);
                                    console.table(result.withState.slice(0, 5).map(h => ({
                                        Name: h.name,
                                        State: h.state,
                                        City: h.address?.city || 'N/A'
                                    })));
                                }

                                console.log('\n💡 To fix issues, click "Fix States" button');
                            }}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        >
                            Check Houses
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMigrationModal(true);
                            }}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-green-50 hover:text-green-600"
                        >
                            Fix States
                        </button>
                        <button
                            onClick={async () => {
                                setLoading(true);
                                console.log('🔄 Resetting Database immediately...');
                                try {
                                    const { clearDatabase, seedAllData } = await import('../storage');
                                    await clearDatabase();
                                    await seedAllData();
                                    console.log('✅ Database reset complete');
                                    window.location.reload();
                                } catch (error) {
                                    console.error("Failed to reset DB:", error);
                                    alert("Failed to reset database");
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset DB'}
                        </button>

                        <div className="w-full basis-full h-0"></div> {/* Line Break for new row */}

                        <button
                            onClick={async () => {
                                try {
                                    const { exportDatabase } = await import('../storage');
                                    const data = await exportDatabase();
                                    const jsonString = JSON.stringify(data, null, 2);
                                    const blob = new Blob([jsonString], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);

                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `goswish_backup_${new Date().toISOString().split('T')[0]}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                } catch (e) {
                                    alert('Export failed: ' + e.message);
                                }
                            }}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            Export Data
                        </button>

                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'application/json';
                                input.onchange = async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                        try {
                                            const { importDatabase } = await import('../storage');
                                            const data = JSON.parse(event.target.result);

                                            if (confirm('Warning: This will OVERWRITE all current local data with the imported file. Continue?')) {
                                                await importDatabase(data);
                                                alert('Import successful! The page will now reload.');
                                                window.location.reload();
                                            }
                                        } catch (err) {
                                            alert('Import failed: ' + err.message);
                                        }
                                    };
                                    reader.readAsText(file);
                                };
                                input.click();
                            }}
                            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-600"
                        >
                            Import Data
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Login Screen
    if (mode === 'login') {
        const isPhone = !email.includes('@');
        return (
            <div className="min-h-screen bg-[#d9d9d9] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="pt-8 pb-4 px-6 z-10 flex items-center justify-between">
                    <button
                        onClick={() => { setMode('welcome'); setOtpSent(false); setError(''); }}
                        className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors text-gray-900 shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Bottom Sheet Content */}
                <div className="flex-1 mt-6 bg-white rounded-t-[2.5rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-y-auto">
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-3 text-black">
                            <User className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
                        <p className="text-gray-500 text-lg">
                            Sign in to <span className="font-semibold text-gray-900">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in shake ${error.includes('OTP code sent')
                            ? 'bg-teal-50 border border-teal-100 text-teal-700'
                            : 'bg-red-50 border border-red-100 text-red-600'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${error.includes('OTP code sent') ? 'bg-teal-600' : 'bg-red-600'
                                }`} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-8 pb-10">
                        {/* Password Option */}
                        {/* Password Option */}
                        {!isPhone && (
                            <form onSubmit={(e) => handleLogin(e, 'password')}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl transition-all duration-200 outline-none text-lg"
                                                placeholder="Enter password"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !password}
                                        className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Login with Password'}
                                    </button>
                                    <div className="text-center">
                                        <button type="button" className="text-sm font-semibold text-gray-500 hover:text-black hover:underline">Forgot Password?</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Divider */}
                        {/* Divider */}
                        {!isPhone && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-400 font-medium">OR</span>
                                </div>
                            </div>
                        )}

                        {/* OTP Option */}
                        <div className="pt-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Login with Code</label>
                            <div className="flex justify-center mb-4">
                                <OTPInput
                                    length={6}
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={!otpSent && !isPhone}
                                    error={error && !error.includes('OTP code sent')}
                                />
                            </div>

                            {!otpSent ? (
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    className="w-full py-4 bg-gray-100 text-gray-900 text-lg font-bold rounded-2xl shadow-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get OTP'}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={(e) => handleLogin(e, 'otp')}
                                        disabled={loading || otp.length < 6}
                                        className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Login using OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="w-full text-center text-sm text-gray-500 hover:text-black hover:underline"
                                    >
                                        Send new code
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DEV HELPER  */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center opacity-30 hover:opacity-100 transition-opacity">
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const { forceResetCleanerPasswords } = await import('../storage/auth.js');
                                        const res = await forceResetCleanerPasswords();
                                        alert(`✅ Reset ${res.count} passwords to 'Cleaner123!'`);
                                    } catch (e) { alert(e.message); }
                                }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-gray-700"
                            >
                                Reset PWs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Signup Screen
    const isCustomerSignup = mode === 'customer-signup';
    const role = isCustomerSignup ? 'homeowner' : 'cleaner';

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-800 flex flex-col relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[50%] bg-teal-400/30 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="pt-8 pb-4 px-6 z-10 flex items-center justify-between">
                <button
                    onClick={() => setMode('welcome')}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Sheet Content */}
            <div className="flex-1 mt-6 bg-white rounded-t-[2.5rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-black mb-2">
                        {isCustomerSignup ? 'Create Account' : 'Join as Pro'}
                    </h1>
                    <p className="text-gray-500">
                        {isCustomerSignup ? 'Book premium cleanings instantly' : 'Start earning on your own schedule'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => handleSignup(e, role)} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Phone</label>
                        <div className="relative group">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="(555) 123-4567"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-lg text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>
            </div>

            {/* Migration Modal */}
            {showMigrationModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !migrationResult) {
                            setShowMigrationModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        {!migrationResult ? (
                            // Confirmation screen
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Fix State Codes</h2>
                                <p className="text-gray-600 mb-6">
                                    This will update all house addresses to have proper 2-letter state codes.
                                    Houses without a state will default to <strong>TX (Texas)</strong>.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowMigrationModal(false)}
                                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            console.log('🔧 Starting migration...');
                                            try {
                                                const { migrateHouseStates } = await import('../storage');
                                                const result = await migrateHouseStates();
                                                console.log('Migration result:', result);
                                                setMigrationResult(result);
                                            } catch (error) {
                                                console.error('Migration error:', error);
                                                setMigrationResult({ error: error.message });
                                            }
                                        }}
                                        className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                                    >
                                        Fix States
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Results screen
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    {migrationResult.error ? 'Migration Failed' : 'Migration Complete!'}
                                </h2>
                                {migrationResult.error ? (
                                    <div className="text-red-600 mb-6">
                                        <p className="font-semibold mb-2">Error:</p>
                                        <p className="text-sm">{migrationResult.error}</p>
                                        <p className="text-xs text-gray-500 mt-2">Check console for details.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Total houses:</span>
                                            <span className="font-bold text-gray-900">{migrationResult.total}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-green-700">Updated:</span>
                                            <span className="font-bold text-green-900">{migrationResult.updated}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                            <span className="text-blue-700">Already valid:</span>
                                            <span className="font-bold text-blue-900">{migrationResult.skipped}</span>
                                        </div>
                                        {migrationResult.errors > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                                <span className="text-red-700">Errors:</span>
                                                <span className="font-bold text-red-900">{migrationResult.errors}</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 mt-4">
                                            All houses now have proper state codes! Try creating a booking to see the correct format.
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setShowMigrationModal(false);
                                        setMigrationResult(null);
                                    }}
                                    className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
