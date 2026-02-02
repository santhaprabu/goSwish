
import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * PAYMENT & PAYOUT SETTINGS
 * ============================================================================
 * 
 * Purpose:
 * Dual-role component that handles:
 * 1. Customers: Adding/Removing Credit Cards (Stripe Integration).
 * 2. Cleaners: Managing Payout Frequency and Bank Accounts.
 * 
 * Logic:
 * - Checks `STRIPE_KEY` environment variable.
 * - Uses Stripe Elements for secure card input.
 */
import { CreditCard, Plus, Trash2, ChevronLeft, CheckCircle2, Wallet, X, Building, Check, Clock, CalendarDays, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCleanerByUserId, updateCleanerProfile } from '../storage';

// Stripe Key from environment variables (keeps sensitive keys out of code)
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate Stripe key is configured
if (!STRIPE_KEY) {
    console.error('⚠️ Stripe publishable key not configured. Payment features will not work.');
    console.error('📝 Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file');
}

export default function PaymentMethods({ onBack }) {
    const { user, selectedRole, updateUser } = useApp();
    const isCustomer = selectedRole === 'homeowner';

    // State for Cleaner Payouts
    const [loadingCleanerData, setLoadingCleanerData] = useState(false);
    const [cleanerId, setCleanerId] = useState(null);
    const [payoutFrequency, setPayoutFrequency] = useState('weekly');
    const [bankInfo, setBankInfo] = useState(null);
    const [savingSettings, setSavingSettings] = useState(false);

    // State for Customer Payment Methods
    const [cards, setCards] = useState([
        { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true },
        { id: '2', brand: 'mastercard', last4: '8899', expMonth: 10, expYear: 2027, isDefault: false }
    ]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [stripeObj, setStripeObj] = useState(null);
    const [cardElement, setCardElement] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    // Fetch Cleaner Data
    useEffect(() => {
        if (!isCustomer && user?.uid) {
            async function loadCleaner() {
                try {
                    setLoadingCleanerData(true);
                    const cleaner = await getCleanerByUserId(user.uid);
                    if (cleaner) {
                        setCleanerId(cleaner.id);
                        setPayoutFrequency(cleaner.settings?.payoutFrequency || 'weekly');
                        setBankInfo(cleaner.bankInfo || null);
                    }
                } catch (e) {
                    console.error("Failed to load cleaner settings", e);
                } finally {
                    setLoadingCleanerData(false);
                }
            }
            loadCleaner();
        }
    }, [user, isCustomer]);

    // Save Frequency Change
    const handleFrequencyChange = async (newFreq) => {
        if (!cleanerId || savingSettings) return;
        setPayoutFrequency(newFreq);
        try {
            setSavingSettings(true);
            await updateCleanerProfile(cleanerId, {
                settings: { payoutFrequency: newFreq } // This merges with existing settings in our implementation
            });
        } catch (e) {
            console.error("Failed to save payout frequency", e);
        } finally {
            setSavingSettings(false);
        }
    };

    // ----- CUSTOMER STRIPE LOGIC -----

    // Load customer cards
    useEffect(() => {
        if (isCustomer && user?.paymentMethods) {
            setCards(user.paymentMethods);
        } else if (isCustomer && !user?.paymentMethods) {
            setCards([]);
        }
    }, [user, isCustomer]);

    const saveCardsToProfile = async (updatedCards) => {
        try {
            // Update local state immediately for UI responsiveness
            setCards(updatedCards);

            // Persist to database
            await updateUser({
                paymentMethods: updatedCards
            });
        } catch (error) {
            console.error("Failed to save cards:", error);
            // Revert on error (optional, simplified here)
        }
    };

    const handleDelete = async (id) => {
        const updated = cards.filter(c => c.id !== id);
        // Ensure one is default if we deleted the default one
        if (updated.length > 0 && !updated.some(c => c.isDefault)) {
            updated[0].isDefault = true;
        }
        await saveCardsToProfile(updated);
    };

    const handleSetDefault = async (id) => {
        const updated = cards.map(c => ({
            ...c,
            isDefault: c.id === id
        }));
        await saveCardsToProfile(updated);
    };

    const handleCardAdded = async (newCard) => {
        const updated = [...cards, { ...newCard, isDefault: cards.length === 0 }];
        await saveCardsToProfile(updated);
        setShowAddForm(false);
    };

    useEffect(() => {
        if (showAddForm) {
            if (window.Stripe) {
                const stripe = window.Stripe(STRIPE_KEY);
                setStripeObj(stripe);
                const elements = stripe.elements();
                const card = elements.create('card', {
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    },
                });
                setTimeout(() => {
                    if (document.getElementById('card-element-pm')) {
                        card.mount('#card-element-pm');
                        setCardElement(card);
                        card.on('change', (event) => setError(event.error ? event.error.message : null));
                    }
                }, 100);
            } else {
                setError("Stripe failed to load. Check internet connection.");
            }
        }
        return () => {
            if (cardElement) {
                cardElement.destroy();
                setCardElement(null);
            }
        };
    }, [showAddForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripeObj || !cardElement) return;
        setLoading(true);
        setError(null);

        // Simulate waiting for Stripe
        const { error: stripeError, paymentMethod } = await stripeObj.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: { name: name },
        });

        if (stripeError) {
            setError(stripeError.message);
            setLoading(false);
        } else {
            await handleCardAdded({
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
                isDefault: false
            });
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setCardElement(null);
        setError(null);
    };

    // ----- RENDER CLEANER VIEW -----
    if (!isCustomer) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="app-bar">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Payout Settings</h1>
                        <div className="w-10" />
                    </div>
                </div>

                <div className="flex-1 px-6 py-6 space-y-8">

                    {/* Frequency Section */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Payout Frequency</h2>
                        <div className="space-y-3">
                            {/* Daily */}
                            <button
                                onClick={() => handleFrequencyChange('daily')}
                                className={`w-full card p-4 flex items-center justify-between border transition-all ${payoutFrequency === 'daily' ? 'border-secondary-500 ring-1 ring-secondary-500 bg-secondary-50' : 'border-transparent hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payoutFrequency === 'daily' ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Daily Payouts</p>
                                        <p className="text-xs text-gray-500">Get paid every morning ($0.50 fee)</p>
                                    </div>
                                </div>
                                {payoutFrequency === 'daily' && <CheckCircle2 className="w-5 h-5 text-secondary-600" />}
                            </button>

                            {/* Weekly */}
                            <button
                                onClick={() => handleFrequencyChange('weekly')}
                                className={`w-full card p-4 flex items-center justify-between border transition-all ${payoutFrequency === 'weekly' ? 'border-secondary-500 ring-1 ring-secondary-500 bg-secondary-50' : 'border-transparent hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payoutFrequency === 'weekly' ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Weekly Payouts</p>
                                        <p className="text-xs text-gray-500">Every Friday (No fee)</p>
                                    </div>
                                </div>
                                {payoutFrequency === 'weekly' && <CheckCircle2 className="w-5 h-5 text-secondary-600" />}
                            </button>

                            {/* Monthly */}
                            <button
                                onClick={() => handleFrequencyChange('monthly')}
                                className={`w-full card p-4 flex items-center justify-between border transition-all ${payoutFrequency === 'monthly' ? 'border-secondary-500 ring-1 ring-secondary-500 bg-secondary-50' : 'border-transparent hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payoutFrequency === 'monthly' ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Monthly Payouts</p>
                                        <p className="text-xs text-gray-500">1st of every month (No fee)</p>
                                    </div>
                                </div>
                                {payoutFrequency === 'monthly' && <CheckCircle2 className="w-5 h-5 text-secondary-600" />}
                            </button>
                        </div>
                    </div>

                    {/* Bank Summary Section */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Linked Account</h2>
                        <div className="card p-5">
                            {bankInfo ? (
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <Building className="w-6 h-6 text-gray-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{bankInfo.bankName || 'Bank Account'}</p>
                                            <p className="text-sm text-gray-500 font-mono">•••• {bankInfo.accountNumber ? bankInfo.accountNumber.slice(-4) : '••••'}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Building className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <p className="font-bold text-gray-900 mb-1">No Bank Account Linked</p>
                                    <p className="text-xs text-gray-500 mb-3">Please add your bank details in Profile to receive payouts.</p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 px-1">
                            To update your bank information, please visit the <span className="font-bold text-gray-500">Bank Information</span> section in your Profile.
                        </p>
                    </div>

                    {/* Next Payout Estimate */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium mb-1">Next Estimated Payout</p>
                                <h3 className="text-2xl font-bold">
                                    {(() => {
                                        const now = new Date();
                                        const options = { weekday: 'short', month: 'short', day: 'numeric' };

                                        if (payoutFrequency === 'daily') {
                                            const tomorrow = new Date(now);
                                            tomorrow.setDate(tomorrow.getDate() + 1);
                                            return tomorrow.toLocaleDateString('en-US', options);
                                        } else if (payoutFrequency === 'weekly') {
                                            const nextFriday = new Date(now);
                                            nextFriday.setDate(now.getDate() + ((7 - now.getDay() + 5) % 7 || 7)); // Next Friday
                                            return nextFriday.toLocaleDateString('en-US', options);
                                        } else {
                                            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                                            return nextMonth.toLocaleDateString('en-US', options);
                                        }
                                    })()}
                                </h3>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Wallet className="w-5 h-5 text-gray-300" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2 text-xs text-gray-400">
                            <Check className="w-3 h-3 text-green-400" />
                            <span>Processing normally</span>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // ----- RENDER CUSTOMER VIEW (Original) -----
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="app-bar">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="btn-ghost p-2 -ml-2 rounded-xl">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Payment Methods</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="flex-1 px-6 py-6">
                {!showAddForm ? (
                    <div className="space-y-6">
                        {/* Cards List */}
                        <div className="space-y-4">
                            {cards.map((card) => (
                                <div key={card.id} className="card relative overflow-hidden group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Card Icon */}
                                            {(() => {
                                                const b = (card.brand || '').toLowerCase();
                                                if (b === 'visa') return (
                                                    <div className="w-10 h-7 bg-[#1A1F71] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <span className="text-[10px] font-black italic text-white tracking-tight leading-none">VISA</span>
                                                    </div>
                                                );
                                                if (b === 'mastercard') return (
                                                    <div className="w-10 h-7 bg-[#252525] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <div className="flex -space-x-1.5">
                                                            <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]"></div>
                                                            <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]"></div>
                                                        </div>
                                                    </div>
                                                );
                                                if (b === 'amex') return (
                                                    <div className="w-10 h-7 bg-[#006FCF] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <span className="text-[8px] font-bold text-white leading-none text-center">AM<br />EX</span>
                                                    </div>
                                                );
                                                return (
                                                    <div className="w-10 h-7 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center flex-shrink-0">
                                                        <CreditCard className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                );
                                            })()}

                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 capitalize truncate">
                                                    {card.brand} ending in {card.last4}
                                                </p>
                                                <p className="text-sm text-gray-400 truncate">
                                                    Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                                                </p>
                                            </div>
                                        </div>

                                        {card.isDefault ? (
                                            <span className="badge badge-primary text-xs">Default</span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(card.id)}
                                                className="text-sm text-gray-400 hover:text-primary-600 font-medium"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end pt-2 border-t border-gray-50">
                                        <button
                                            onClick={() => handleDelete(card.id)}
                                            className="p-2 text-gray-400 hover:text-error-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add New Button */}
                        {cards.length < 2 ? (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl
                                        flex items-center justify-center gap-2 text-gray-500
                                        hover:border-primary-300 hover:text-primary-500 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">Add Payment Method</span>
                            </button>
                        ) : (
                            <div className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl
                                    flex items-center justify-center gap-2 text-gray-400 bg-gray-50">
                                <span className="font-medium text-sm">Maximum 2 cards allowed</span>
                            </div>
                        )}

                        <div className="flex items-start gap-3 p-4 bg-teal-50 text-teal-700 rounded-xl text-sm">
                            <div className="mt-0.5">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <p>
                                Payments are secured by Stripe.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Add Card Form (Vanilla Stripe)
                    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                        <div className="card space-y-4">
                            <div>
                                <label className="label">Card Details</label>
                                <div className="p-3 border border-gray-200 rounded-xl bg-white">
                                    <div id="card-element-pm" style={{ minHeight: '40px' }} />
                                </div>
                            </div>

                            <div>
                                <label className="label">Cardholder Name</label>
                                <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="input pl-12"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex-1"
                                disabled={!stripeObj || loading}
                            >
                                {loading ? 'Processing...' : 'Add Card'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
