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
import { Mail, Lock, Loader2, ArrowLeft, User, Phone } from 'lucide-react';
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

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidPhone = (phone) => {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    };

    const hasLetters = (input) => /[a-zA-Z]/.test(input);

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim()) {
            setError('Please enter your email or phone number');
            return;
        }

        if (hasLetters(identifier)) {
            // Has letters = email
            if (!isValidEmail(identifier)) {
                setError('Please enter a valid email address');
                return;
            }
        } else {
            // Numbers only = phone
            if (!isValidPhone(identifier)) {
                setError('Please enter a valid phone number (10-15 digits)');
                return;
            }
        }

        // Check if user exists in the system
        setLoading(true);
        try {
            const { exists } = await checkUser(identifier);
            if (!exists) {
                setError('Account not found. Please sign up below.');
                setLoading(false);
                return;
            }
        } catch (e) {
            // Continue anyway if check fails
        }

        setEmail(identifier);

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

    if (mode === 'welcome') {
        return (
            <div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center p-6">
                {/* White Card Container */}
                <div className="bg-white shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header Section with Logo */}
                    <div className="flex-shrink-0 pt-8 pb-4 flex justify-center">
                        <img
                            src="/goswish-logo-1.png"
                            alt="GoSwish"
                            className="h-24 object-contain"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 bg-white px-6 pt-4 pb-6 overflow-y-auto">
                        {/* Title */}
                        <h1 className="text-2xl font-bold text-black mb-6 text-center">
                            Let's get started
                        </h1>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {/* Email/Phone Input */}
                        <form onSubmit={handleInitialSubmit} className="mb-6">
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                                className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none mb-3"
                                placeholder="Enter email or phone number"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!identifier.trim() || loading}
                                className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400">or</span>
                            </div>
                        </div>

                        {/* Social Auth Options */}
                        <div className="space-y-3 mb-6">
                            {/* Continue with Apple */}
                            <button
                                onClick={() => handleSocialLogin('Apple')}
                                className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Continue with Apple
                            </button>

                            {/* Continue with Google */}
                            <button
                                onClick={() => handleSocialLogin('Google')}
                                className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400">or</span>
                            </div>
                        </div>

                        {/* Signup Options */}
                        <div className="space-y-3">
                            <button
                                onClick={() => { setRole('homeowner'); setMode('customer-signup'); }}
                                className="w-full py-4 bg-[#1a7f8e] hover:bg-[#156d7a] text-white font-semibold rounded-lg transition-colors"
                            >
                                Sign up as Home Owner
                            </button>
                            <button
                                onClick={() => { setRole('cleaner'); setMode('cleaner-signup'); }}
                                className="w-full py-4 bg-[#1a7f8e] hover:bg-[#156d7a] text-white font-semibold rounded-lg transition-colors"
                            >
                                Sign up as a Cleaner
                            </button>
                        </div>

                        {/* Legal Text */}
                        <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed px-4">
                            By proceeding, you consent to receive calls, SMS, or email messages from GoSwish and its affiliates to the contact provided.
                        </p>

                        {/* Developer Tools - Collapsed by default */}
                        <details className="mt-6 group">
                            <summary className="text-xs text-gray-300 cursor-pointer hover:text-gray-500 transition-colors text-center list-none">
                                <span className="opacity-50 group-open:opacity-100">Developer Tools</span>
                            </summary>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-2 flex-wrap">
                                <button
                                    onClick={async () => {
                                        console.log('🧪 Running full state test...');
                                        try {
                                            const { getDocs, COLLECTIONS, getCurrentUser, createBooking, updateDoc } = await import('../storage');
                                            const houses = await getDocs(COLLECTIONS.HOUSES);
                                            console.log(`Found ${houses.length} houses`);
                                            const valid = houses.filter(h => h?.address?.state?.length === 2);
                                            const invalid = houses.filter(h => h?.address?.state && h.address.state.length !== 2);
                                            const missing = houses.filter(h => !h?.address?.state);
                                            console.log(`Valid: ${valid.length}, Invalid: ${invalid.length}, Missing: ${missing.length}`);
                                            if (houses.length === 0) {
                                                alert('No houses found! Please add a house first.');
                                                return;
                                            }
                                            const user = await getCurrentUser();
                                            if (!user) {
                                                alert('Please sign in first!');
                                                return;
                                            }
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
                                            await updateDoc(COLLECTIONS.BOOKINGS, testBooking.id, { status: 'cancelled' });
                                            const stateInBooking = testBooking.bookingId.split('-')[0];
                                            const success = stateInBooking !== 'US';
                                            alert(`Test Complete!\n\nValid: ${valid.length}\nInvalid: ${invalid.length}\nMissing: ${missing.length}\n\nBooking ID: ${testBooking.bookingId}\nHouse State: ${testHouse.address?.state}\n\n${success ? 'Working!' : 'Using fallback "US"'}\n\nCheck console for details.`);
                                        } catch (error) {
                                            alert('Test failed! Check console for details.');
                                            console.error('Test error:', error);
                                        }
                                    }}
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                >
                                    Test States
                                </button>
                                <button
                                    onClick={async () => {
                                        console.log('Starting database check...');
                                        const { checkAllHouses } = await import('../storage');
                                        const result = await checkAllHouses();
                                        const total = result.withState.length + result.invalidState.length + result.missingState.length;
                                        let message = `Database Check Complete!\n\n`;
                                        message += `Total houses: ${total}\n`;
                                        message += `Valid state codes: ${result.withState.length}\n`;
                                        message += `Invalid state codes: ${result.invalidState.length}\n`;
                                        message += `Missing state codes: ${result.missingState.length}\n\n`;
                                        message += `Check the browser console (F12) for full details.`;
                                        alert(message);
                                    }}
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    Check Houses
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMigrationModal(true);
                                    }}
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                                >
                                    Fix States
                                </button>
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        console.log('Resetting Database immediately...');
                                        try {
                                            const { clearDatabase, seedAllData } = await import('../storage');
                                            await clearDatabase();
                                            await seedAllData();
                                            console.log('Database reset complete');
                                            window.location.reload();
                                        } catch (error) {
                                            console.error("Failed to reset DB:", error);
                                            alert("Failed to reset database");
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Resetting...' : 'Reset DB'}
                                </button>
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
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
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
                                    className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                >
                                    Import Data
                                </button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        );
    }

    // Login Screen - Clean White Design
    if (mode === 'login') {
        const isPhone = !email.includes('@');
        return (
            <div className="min-h-screen bg-white flex flex-col">
                {/* Header */}
                <div className="pt-6 pb-4 px-5 flex items-center">
                    <button
                        onClick={() => { setMode('welcome'); setOtpSent(false); setError(''); }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-black"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 bg-white px-6 pt-8 pb-6 overflow-y-auto">
                    {/* Title */}
                    <h1 className="text-2xl font-bold text-black mb-2">
                        Welcome back
                    </h1>
                    <p className="text-gray-500 mb-6">
                        Sign in to continue
                    </p>

                    {/* Email/Phone Display */}
                    {email && (
                        <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg mb-6">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Signing in as</p>
                                <p className="text-black font-medium">{email}</p>
                            </div>
                        </div>
                    )}

                    {/* Email/Phone Input if not set */}
                    {!email && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email or phone number
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                                placeholder="Enter email or phone"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    if (identifier.trim()) {
                                        setEmail(identifier);
                                    }
                                }}
                                disabled={!identifier.trim()}
                                className="w-full mt-4 py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {email && (
                        <>
                            {error && (
                                <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${error.includes('OTP code sent')
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-600'
                                    }`}>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Password Option */}
                                {!isPhone && (
                                    <form onSubmit={(e) => handleLogin(e, 'password')}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                                                    placeholder="Enter your password"
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading || !password}
                                                className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                                            </button>
                                            <button type="button" className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors">
                                                Forgot password?
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Divider */}
                                {!isPhone && (
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-400">or</span>
                                        </div>
                                    </div>
                                )}

                                {/* OTP Option */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        {isPhone ? 'Enter verification code' : 'One-time password'}
                                    </label>
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
                                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                <>
                                                    <Mail className="w-5 h-5" />
                                                    Send Code
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <button
                                                onClick={(e) => handleLogin(e, 'otp')}
                                                disabled={loading || otp.length < 6}
                                                className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOtpSent(false)}
                                                className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors"
                                            >
                                                Resend code
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* DEV HELPER */}
                    <details className="mt-8 group">
                        <summary className="text-xs text-gray-300 cursor-pointer hover:text-gray-500 transition-colors text-center list-none">
                            <span className="opacity-50 group-open:opacity-100">Developer Tools</span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const { forceResetCleanerPasswords } = await import('../storage/auth.js');
                                        const res = await forceResetCleanerPasswords();
                                        alert(`Reset ${res.count} passwords to 'Cleaner123!'`);
                                    } catch (e) { alert(e.message); }
                                }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-600 transition-colors"
                            >
                                Reset Passwords
                            </button>
                        </div>
                    </details>
                </div>
            </div>
        );
    }

    // Signup Screen - Clean White Design
    const isCustomerSignup = mode === 'customer-signup';
    const role = isCustomerSignup ? 'homeowner' : 'cleaner';

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="pt-6 pb-4 px-5 flex items-center justify-between">
                <button
                    onClick={() => setMode('welcome')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-black"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-black">
                    {isCustomerSignup ? 'Homeowner' : 'Cleaning Pro'}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 bg-white px-6 pt-8 pb-6 overflow-y-auto">
                {/* Title */}
                <h1 className="text-2xl font-bold text-black mb-2">
                    {isCustomerSignup ? 'Create account' : 'Join as a pro'}
                </h1>
                <p className="text-gray-500 mb-6">
                    {isCustomerSignup
                        ? 'Book cleaning services instantly'
                        : 'Start earning on your schedule'
                    }
                </p>

                {error && (
                    <div className="mb-5 p-4 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => handleSignup(e, role)} className="space-y-4">
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First name
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last name
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                            placeholder="Min. 8 characters"
                            required
                            minLength={8}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-100 border-0 rounded-lg text-black font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black outline-none"
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                        By continuing, you agree to our{' '}
                        <span className="text-black font-medium">Terms of Service</span>
                        {' '}and{' '}
                        <span className="text-black font-medium">Privacy Policy</span>
                    </p>
                </form>
            </div>

            {/* Migration Modal */}
            {showMigrationModal && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !migrationResult) {
                            setShowMigrationModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        {!migrationResult ? (
                            <>
                                <h2 className="text-xl font-bold text-black mb-3">Fix State Codes</h2>
                                <p className="text-gray-600 mb-6 text-sm">
                                    This will update all house addresses to have proper 2-letter state codes.
                                    Houses without a state will default to <strong>TX (Texas)</strong>.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowMigrationModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            console.log('Starting migration...');
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
                                        className="flex-1 px-4 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        Fix States
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-black mb-3">
                                    {migrationResult.error ? 'Migration Failed' : 'Migration Complete'}
                                </h2>
                                {migrationResult.error ? (
                                    <div className="text-red-600 mb-6">
                                        <p className="font-medium mb-2">Error:</p>
                                        <p className="text-sm">{migrationResult.error}</p>
                                        <p className="text-xs text-gray-500 mt-2">Check console for details.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                                            <span className="text-gray-600">Total houses:</span>
                                            <span className="font-bold text-black">{migrationResult.total}</span>
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
                                            All houses now have proper state codes.
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setShowMigrationModal(false);
                                        setMigrationResult(null);
                                    }}
                                    className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
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
