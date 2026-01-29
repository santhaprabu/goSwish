import { useState, useEffect } from 'react';
import { ChevronLeft, Building, CreditCard, User, Check, AlertCircle, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCleanerByUserId, updateCleanerProfile } from '../storage';

export default function BankInformation({ onBack }) {
    const { user } = useApp();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [cleanerId, setCleanerId] = useState(null);

    const [formData, setFormData] = useState({
        accountHolderName: '',
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        confirmAccountNumber: '',
        accountType: 'checking'
    });

    useEffect(() => {
        async function loadData() {
            if (!user?.uid) return;
            try {
                setLoading(true);
                const cleaner = await getCleanerByUserId(user.uid);
                if (cleaner) {
                    setCleanerId(cleaner.id);
                    if (cleaner.bankInfo) {
                        setFormData({
                            accountHolderName: cleaner.bankInfo.accountHolderName || '',
                            bankName: cleaner.bankInfo.bankName || '',
                            routingNumber: cleaner.bankInfo.routingNumber || '',
                            accountNumber: cleaner.bankInfo.accountNumber || '',
                            confirmAccountNumber: cleaner.bankInfo.accountNumber || '', // Pre-fill confirm for UX if exists
                            accountType: cleaner.bankInfo.accountType || 'checking'
                        });
                    } else {
                        // Default to user name if no bank info yet
                        setFormData(prev => ({
                            ...prev,
                            accountHolderName: user.name || ''
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to load cleaner data", err);
                setError("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Number only validation for routing/account
        if ((name === 'routingNumber' || name.includes('accountNumber')) && value && !/^\d*$/.test(value)) {
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!cleanerId) {
            setError("Cleaner profile not found");
            return;
        }

        if (formData.accountNumber !== formData.confirmAccountNumber) {
            setError("Account numbers do not match");
            return;
        }

        if (formData.routingNumber.length !== 9) {
            setError("Routing number must be 9 digits");
            return;
        }

        try {
            setSaving(true);

            // Don't save confirmAccountNumber
            const bankInfoToSave = {
                accountHolderName: formData.accountHolderName,
                bankName: formData.bankName,
                routingNumber: formData.routingNumber,
                accountNumber: formData.accountNumber,
                accountType: formData.accountType,
                updatedAt: new Date().toISOString()
            };

            await updateCleanerProfile(cleanerId, { bankInfo: bankInfoToSave });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save bank info", err);
            setError("Failed to save bank information. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 ml-2">Bank Information</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 py-6 space-y-6">

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium mb-1">Secure Information</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Your banking information is securely stored. You can only have one active bank account linked for payouts at a time. Updating this will replace your current account.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Account Type */}
                    <div className="card p-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account Type</label>
                        <div className="flex gap-4">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="checking"
                                    checked={formData.accountType === 'checking'}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="text-center py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 peer-checked:border-secondary-500 peer-checked:bg-secondary-50 peer-checked:text-secondary-700 transition-all font-medium">
                                    Checking
                                </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="savings"
                                    checked={formData.accountType === 'savings'}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="text-center py-2 px-4 rounded-lg border-2 border-gray-200 text-gray-600 peer-checked:border-secondary-500 peer-checked:bg-secondary-50 peer-checked:text-secondary-700 transition-all font-medium">
                                    Savings
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        {/* Account Holder */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="accountHolderName"
                                    required
                                    value={formData.accountHolderName}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white"
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        {/* Bank Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="bankName"
                                    required
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white"
                                    placeholder="e.g. Chase, Bank of America"
                                />
                            </div>
                        </div>

                        {/* Routing Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-xs font-bold">#</span>
                                </div>
                                <input
                                    type="text"
                                    name="routingNumber"
                                    required
                                    maxLength={9}
                                    value={formData.routingNumber}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white font-mono"
                                    placeholder="9-digit routing number"
                                />
                            </div>
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="accountNumber"
                                    required
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white font-mono"
                                    placeholder="•••• •••• ••••"
                                />
                            </div>
                        </div>

                        {/* Confirm Account Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="confirmAccountNumber"
                                    required
                                    value={formData.confirmAccountNumber}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white font-mono"
                                    placeholder="Re-enter account number"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2 text-sm">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            Bank information saved successfully!
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="w-full py-4 bg-secondary-600 text-white font-bold rounded-xl shadow-lg shadow-secondary-900/20 hover:bg-secondary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Bank Information'}
                    </button>

                    <p className="text-xs text-gray-400 text-center px-4">
                        By saving, you authorize GoSwish to deposit your weekly earnings to this account.
                    </p>
                </form>
            </div>
        </div>
    );
}
