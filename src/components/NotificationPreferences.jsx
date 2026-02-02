
import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * NOTIFICATION PREFERENCES
 * ============================================================================
 * 
 * Purpose:
 * Allows users to toggle specific notification channels and types.
 * 
 * Channels: Push, Email, SMS.
 * Types: Reminders, Promotions.
 * 
 * Logic:
 * - Persists settings to the user's profile in the database.
 */
import { ChevronLeft, Bell, Mail, MessageSquare, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NotificationPreferences({ onBack }) {
    const { user, updateUser } = useApp();

    const [preferences, setPreferences] = useState({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        promoEnabled: true,
        remindersEnabled: true
    });

    // Load initial preferences from user
    useEffect(() => {
        if (user?.notificationSettings) {
            setPreferences(prev => ({
                ...prev,
                ...user.notificationSettings
            }));
        }
    }, [user]);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const toggle = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUser({
                notificationSettings: preferences
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            console.error('Failed to save preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Notification Settings</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="flex-1 px-6 py-6 space-y-8">

                {/* Channels Section */}
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Channels</h2>
                    <div className="card divide-y divide-gray-50 overflow-hidden">

                        {/* Push */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Push Notifications</p>
                                    <p className="text-xs text-gray-500">Receive alerts on your device</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.pushEnabled}
                                    onChange={() => toggle('pushEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                        </div>

                        {/* Email */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Email Notifications</p>
                                    <p className="text-xs text-gray-500">Job summaries and receipts</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.emailEnabled}
                                    onChange={() => toggle('emailEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                        </div>

                        {/* SMS */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">SMS Notifications</p>
                                    <p className="text-xs text-gray-500">Instant updates via text</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.smsEnabled}
                                    onChange={() => toggle('smsEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Types Section */}
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Preferences</h2>
                    <div className="card divide-y divide-gray-50 overflow-hidden">

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900">Job Reminders</p>
                                <p className="text-xs text-gray-500">Get reminded 1 hour before jobs</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.remindersEnabled}
                                    onChange={() => toggle('remindersEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900">Promotions & Tips</p>
                                <p className="text-xs text-gray-500">Offers and cleaning guides</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.promoEnabled}
                                    onChange={() => toggle('promoEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                        </div>

                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        {saving ? 'Saving...' : success ? 'Preferences Saved!' : 'Save Preferences'}
                        {success && <Check className="w-5 h-5" />}
                    </button>
                </div>

            </div>
        </div>
    );
}

