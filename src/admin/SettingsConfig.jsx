import { useState, useEffect } from 'react';
import {
    Settings, Save, Percent, DollarSign,
    ShieldAlert, Mail, Phone, Info, CheckCircle2
} from 'lucide-react';
import { getAppSettings } from '../storage/helpers';
import { updateDoc, COLLECTIONS } from '../storage/db';

export default function SettingsConfig() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                setLoading(true);
                const data = await getAppSettings();
                setSettings(data || {
                    id: 'app',
                    taxRate: 0.0825,
                    cleanerEarningsRate: 0.90,
                    minBookingAmount: 50,
                    supportEmail: 'support@goswish.com',
                    supportPhone: '1-800-GOSWISH'
                });
            } catch (e) {
                console.error("Error loading settings", e);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await updateDoc(COLLECTIONS.SETTINGS, 'app', settings);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure global platform parameters and fees</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100 italic animate-bounce">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settings saved!</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Financial Rates */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-slate-500" />
                        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Financial & Splits</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cleaner Earnings Rate</label>
                            <div className="relative">
                                <Percent className="absolute right-4 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    max="1"
                                    value={settings.cleanerEarningsRate}
                                    onChange={e => setSettings({ ...settings, cleanerEarningsRate: Number(e.target.value) })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic px-1">Percentage of subtotal paid to cleaners (e.g. 0.70 for 70%)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (Global)</label>
                            <div className="relative">
                                <Percent className="absolute right-4 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={settings.taxRate}
                                    onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic px-1">Platform-wide sales tax (e.g. 0.0825 for 8.25%)</p>
                        </div>
                    </div>
                </div>

                {/* Booking Rules */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Booking Constraints</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Booking Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    value={settings.minBookingAmount}
                                    onChange={e => setSettings({ ...settings, minBookingAmount: Number(e.target.value) })}
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Fee</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    value={settings.cancellationFee}
                                    onChange={e => setSettings({ ...settings, cancellationFee: Number(e.target.value) })}
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Contact */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Customer Support</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={settings.supportEmail}
                                    onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={settings.supportPhone}
                                    onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save System Configuration
                    </button>
                </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Deployment Notice</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Changes to financial rates (Tax, Cleaner Split) will apply to **new bookings only**.
                        Existing bookings will retain the rates they were created with to ensure financial consistency.
                    </p>
                </div>
            </div>
        </div>
    );
}
