import { useState } from 'react';
import { Mail, Lock, Loader2, Sparkles, ArrowLeft, User, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WelcomeScreen({ onSuccess }) {
    // Destructure all needed context methods at the top level
    const { login, signup, setRole, requestOtp, loginWithOtp, checkUser } = useApp();

    const [mode, setMode] = useState('welcome'); // 'welcome' | 'login' | 'customer-signup' | 'cleaner-signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

        setMode('login');

        // Trigger OTP send - User preference: Don't auto send OTP
        // try {
        //     await requestOtp(identifier);
        // } catch (e) {
        //     console.error('OTP request error (silent):', e);
        // }
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
    if (mode === 'welcome') {
        return (
            <div
                className="min-h-screen flex flex-col relative overflow-hidden"
                style={{ backgroundColor: '#d9d9d9' }}
            >
                {/* Header Section */}
                <div className="flex-1 flex flex-col px-6 pt-20 relative z-10">
                    <div className="mb-12 flex flex-col items-center">
                        <img
                            src="/logo-light.jpg"
                            alt="GoSwish"
                            className="h-24 mb-4 object-contain"
                        />
                        <p className="text-xl text-gray-500 font-medium text-center">Clean homes, happy lives</p>
                    </div>

                    {/* Main Input Section */}
                    <div className="space-y-6">
                        <form onSubmit={handleInitialSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                                    Get started
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full px-5 py-4 bg-white border-2 border-transparent hover:border-gray-200 focus:border-black rounded-2xl transition-all duration-200 outline-none text-lg font-medium placeholder:text-gray-400 shadow-sm"
                                    placeholder="Enter email or mobile number"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!identifier.trim()}
                                className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl shadow-lg shadow-black/5 hover:bg-gray-900 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6"
                            >
                                <span>Continue</span>
                                <ArrowLeft className="w-6 h-6 rotate-180" />
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300/30"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 text-gray-400 font-medium" style={{ backgroundColor: '#d9d9d9' }}>or continue with</span>
                            </div>
                        </div>

                        {/* Stacked Social Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => handleSocialLogin('Apple')}
                                className="w-full py-4 bg-black text-white rounded-2xl font-semibold shadow-lg shadow-black/5 hover:bg-gray-900 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Continue with Apple
                            </button>

                            <button
                                onClick={() => handleSocialLogin('Google')}
                                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 pb-8 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
                    <p className="text-center text-sm text-gray-500 mb-4">Don't have an account?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setRole('customer');
                                setMode('customer-signup');
                            }}
                            className="flex-1 py-3 bg-white border border-gray-200 text-black font-semibold rounded-xl hover:bg-gray-50 hover:border-black/20 transition-all text-sm shadow-sm"
                        >
                            Sign up as Home Owner
                        </button>
                        <button
                            onClick={() => {
                                setRole('cleaner');
                                setMode('cleaner-signup');
                            }}
                            className="flex-1 py-3 bg-white border border-gray-200 text-black font-semibold rounded-xl hover:bg-gray-50 hover:border-black/20 transition-all text-sm shadow-sm"
                        >
                            Sign up as Cleaner
                        </button>
                    </div>
                    {/* DEV HELPER FOR WELCOME SCREEN */}
                    <div className="mt-4 pt-4 border-t border-gray-200/50 text-center space-y-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Developer Tools</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={async (e) => {
                                    const btn = e.target;
                                    const originalText = btn.innerText;
                                    btn.innerText = "Resetting...";
                                    btn.disabled = true;

                                    try {
                                        const { clearDatabase } = await import('../storage/db.js');
                                        const { seedAllData } = await import('../storage/seedData.js');
                                        await clearDatabase();
                                        await seedAllData();
                                        alert("✅ Database Reset Complete! Click OK to reload.");
                                        window.location.reload();
                                    } catch (e) {
                                        alert("Error: " + e.message);
                                        btn.innerText = originalText;
                                        btn.disabled = false;
                                    }
                                }}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-xs text-red-600 rounded border border-red-200"
                            >
                                Wipe & Reseed
                            </button>
                            <button
                                onClick={async () => {
                                    /* Debug Cleaner1 Logic */
                                    try {
                                        const { queryDocs, COLLECTIONS } = await import('../storage/db.js');
                                        const email = 'cleaner1@goswish.com';
                                        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);
                                        if (users.length === 0) { alert(`❌ User '${email}' NOT FOUND in DB.`); return; }
                                        const user = users[0];
                                        const { signInWithEmail } = await import('../storage/auth.js');
                                        const result = await signInWithEmail(email, 'Cleaner123!');

                                        if (result.success) alert(`✅ Login PASSED!\nRole: ${user.role}\nStatus: ${user.status}`);
                                        else alert(`❌ Login FAILED: ${result.error}\nRole: ${user.role}\nStatus: ${user.status}`);
                                    } catch (e) { alert("Error: " + e.message); }
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-xs text-blue-600 rounded border border-blue-200"
                            >
                                Debug Cleaner1
                            </button>
                            <button
                                onClick={async () => {
                                    console.log('Dev: Logging in as Cleaner...');
                                    localStorage.clear();
                                    try {
                                        const res = await login('cleaner1@goswish.com', 'Cleaner123!');
                                        if (res.success) {
                                            // onSuccess(res.user); 
                                            // Directly reload to force state update if onSuccess isn't enough
                                            window.location.reload();
                                        }
                                        else alert('Dev Login Failed: ' + res.error);
                                    } catch (e) { alert(e.message) }
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 rounded border border-gray-300"
                            >
                                Force Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Login Screen
    if (mode === 'login') {
        return (
            <div
                className="min-h-screen flex flex-col"
                style={{ backgroundColor: '#d9d9d9' }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <button
                        onClick={() => setMode('welcome')}
                        className="p-3 -ml-3 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 px-6 pt-4 overflow-y-auto">
                    <div className="mb-6">
                        <img
                            src="/logo-light.jpg"
                            alt="GoSwish"
                            className="h-12 mb-4 object-contain -ml-2"
                        />
                        <h1 className="text-3xl font-bold text-black mb-2">Welcome back</h1>
                        <p className="text-gray-500">
                            Sign in to <strong>{email}</strong>
                        </p>
                        {/* 
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-2 bg-green-50 p-2 rounded-lg w-fit">
                            <Sparkles className="w-4 h-4" />
                            OTP sent to your email
                        </p> 
                        */}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-600 rounded-full" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-8 pb-10">
                        {/* Password Option */}
                        <form onSubmit={(e) => handleLogin(e, 'password')}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Option 1: Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl transition-all duration-200 outline-none text-lg"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="w-full py-4 bg-black text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Login with Password'}
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">OR verify via OTP</span>
                            </div>
                        </div>

                        {/* OTP Option */}
                        <form onSubmit={(e) => handleLogin(e, 'otp')}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Option 2: One-Time Password</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-2xl transition-all duration-200 outline-none text-lg tracking-widest font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full py-4 bg-white text-black border-2 border-black text-lg font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Login with OTP'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* DEV HELPER - Added to fix auth issues */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">Developer Tools</p>
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
                                Reset Passwords
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm("Wipe DB and Reseed?")) {
                                        try {
                                            const { clearDatabase } = await import('../storage/db.js');
                                            const { seedAllData } = await import('../storage/seedData.js');
                                            await clearDatabase();
                                            await seedAllData();
                                            alert("✅ Database Reset! Refreshing...");
                                            window.location.reload();
                                        } catch (e) { alert(e.message); }
                                    }
                                }}
                                className="text-xs bg-red-50 hover:bg-red-100 px-3 py-2 rounded text-red-600"
                            >
                                Wipe & Reseed
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const { queryDocs, COLLECTIONS } = await import('../storage/db.js');
                                        const email = 'cleaner1@goswish.com';
                                        const users = await queryDocs(COLLECTIONS.USERS, 'email', email);

                                        if (users.length === 0) {
                                            alert(`❌ User '${email}' NOT FOUND.`);
                                            return;
                                        }

                                        const user = users[0];
                                        const { signInWithEmail } = await import('../storage/auth.js');
                                        const result = await signInWithEmail(email, 'Cleaner123!');

                                        if (result.success) {
                                            alert("✅ Login PASSED! Credentials are correct.");
                                        } else {
                                            alert(`❌ Login FAILED: ${result.error}\nUser Role: ${user.role}\nStatus: ${user.status}`);
                                        }

                                    } catch (e) { alert("Debug Error: " + e.message); }
                                }}
                                className="text-xs bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded text-blue-600"
                            >
                                Debug Cleaner1
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Signup Screen
    const isCustomerSignup = mode === 'customer-signup';
    const role = isCustomerSignup ? 'customer' : 'cleaner';

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: '#d9d9d9' }}
        >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <button
                    onClick={() => setMode('welcome')}
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-50"
                >
                    <ArrowLeft className="w-6 h-6 text-black" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-8 overflow-y-auto pb-24">
                <div className="mb-6">
                    <img
                        src="/logo-light.jpg"
                        alt="GoSwish"
                        className="h-10 mb-4 object-contain -ml-2"
                    />
                    <h1 className="text-3xl font-bold text-black mb-2">
                        {isCustomerSignup ? 'Home Owner Sign Up' : 'Cleaner Sign Up'}
                    </h1>
                    <p className="text-gray-500">
                        {isCustomerSignup ? 'Create an account to book cleaning services' : 'Create an account to start earning'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => handleSignup(e, role)} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-black mb-2">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-black mb-2">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                        <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none text-base"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-md"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
