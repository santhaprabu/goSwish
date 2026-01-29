import { useState } from 'react';
import {
    ArrowLeft, Eye, EyeOff, Mail, Lock, AlertCircle,
    CheckCircle2, Loader2, Chrome, Apple, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Uber-like Login Screen
export default function AuthScreen({ mode: initialMode = 'login', role, onBack, onSuccess }) {
    const { login, signup, selectedRole } = useApp();

    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isCustomer = (role || selectedRole) === 'homeowner';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            if (mode === 'login') {
                const result = await login(email, password);
                if (result.success) {
                    onSuccess(result.user);
                } else {
                    setError(result.error);
                }
            } else {
                if (password.length < 8) {
                    setError('Password must be at least 8 characters');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                const result = await signup({
                    email,
                    password,
                    role: role || selectedRole,
                    primaryRole: role || selectedRole,
                    name: '',
                    phone: '',
                    photoURL: null,
                });

                if (result.success) {
                    onSuccess(result.user);
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockEmail = provider === 'google'
            ? 'user@gmail.com'
            : 'user@privaterelay.appleid.com';

        const result = signup({
            email: mockEmail,
            password: 'SocialAuth123',
            role: role || selectedRole,
            primaryRole: role || selectedRole,
            name: provider === 'google' ? 'Google User' : 'Apple User',
            phone: '',
            photoURL: provider === 'google' ? 'https://lh3.googleusercontent.com/a/default-user' : null,
            socialProvider: provider,
            emailVerified: true,
        });

        if (result.success) {
            onSuccess(result.user);
        } else {
            const loginResult = await login(mockEmail, 'SocialAuth123');
            if (loginResult.success) {
                onSuccess(loginResult.user);
            } else {
                setError(result.error);
            }
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Uber-style minimal header */}
            <div className="px-4 py-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pb-8 flex flex-col">
                {/* Title - Uber style: large, bold, minimal */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {mode === 'login' ? 'Welcome back' : 'Sign up'}
                    </h1>
                    <p className="text-lg text-gray-600">
                        {mode === 'login'
                            ? 'Enter your email to continue'
                            : 'Create your account to get started'}
                    </p>
                </div>

                {/* Error message - Uber style */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                    {/* Email - Uber style: minimal, clean */}
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-lg
                                     focus:border-black focus:bg-white outline-none transition-all"
                            placeholder="Email"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-lg
                                     focus:border-black focus:bg-white outline-none transition-all pr-12"
                            placeholder="Password"
                            required
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Confirm Password (signup only) */}
                    {mode === 'signup' && (
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-lg
                                         focus:border-black focus:bg-white outline-none transition-all"
                                placeholder="Confirm password"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Submit button - Uber style: solid black, full width */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black text-white text-lg font-semibold rounded-lg
                                 hover:bg-gray-900 active:scale-[0.98] transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : mode === 'login' ? (
                            'Continue'
                        ) : (
                            'Create account'
                        )}
                    </button>
                </form>

                {/* Divider - Uber style */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Social login - Uber style: outlined buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full py-4 bg-white border-2 border-gray-300 text-gray-900 text-lg font-semibold rounded-lg
                                 hover:bg-gray-50 active:scale-[0.98] transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-3"
                    >
                        <Chrome className="w-6 h-6" />
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin('apple')}
                        disabled={loading}
                        className="w-full py-4 bg-white border-2 border-gray-300 text-gray-900 text-lg font-semibold rounded-lg
                                 hover:bg-gray-50 active:scale-[0.98] transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-3"
                    >
                        <Apple className="w-6 h-6" />
                        Continue with Apple
                    </button>
                </div>

                {/* Switch mode - Uber style */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                    >
                        {mode === 'login'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>

                {/* Terms - Uber style */}
                <p className="mt-6 text-xs text-gray-500 text-center">
                    By continuing, you agree to GoSwish's{' '}
                    <button className="underline hover:text-gray-700">Terms of Service</button>
                    {' '}and{' '}
                    <button className="underline hover:text-gray-700">Privacy Policy</button>
                </p>
            </div>
        </div>
    );
}
