import { useState, useEffect } from 'react';
import {
    Layers, Plus, Edit2, Trash2, Check, X,
    DollarSign, Sparkles, Box, Settings, MapPin,
    Percent, Clock, Save, RefreshCw
} from 'lucide-react';
import {
    getDocs, updateDoc, setDoc, deleteDoc, COLLECTIONS, generateId
} from '../storage/db';

export default function ServiceConfig() {
    const [activeTab, setActiveTab] = useState('services'); // services, addons, settings
    const [items, setItems] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'services') {
                const data = await getDocs(COLLECTIONS.SERVICE_TYPES);
                setItems(data);
            } else if (activeTab === 'addons') {
                const data = await getDocs(COLLECTIONS.ADD_ONS);
                setItems(data);
            } else if (activeTab === 'settings') {
                const data = await getDocs(COLLECTIONS.SETTINGS);
                const appSettings = data.find(s => s.id === 'app') || {};
                setSettings({
                    taxRate: appSettings.taxRate || 0.0825,
                    platformFee: appSettings.platformFee || 0.10,
                    cleanerEarningsRate: appSettings.cleanerEarningsRate || 0.90,
                    petSurcharge: appSettings.petSurcharge || 10,
                    minBookingAmount: appSettings.minBookingAmount || 50,
                    maxBookingAmount: appSettings.maxBookingAmount || 1000,
                    cancellationFee: appSettings.cancellationFee || 25,
                    cancellationWindow: appSettings.cancellationWindow || 24,
                    metroMultipliers: appSettings.metroMultipliers || {
                        'Dallas': 1.0,
                        'Fort Worth': 1.0,
                        'Austin': 1.1,
                        'San Antonio': 1.05,
                        'Houston': 1.05,
                    },
                });
            }
        } catch (e) {
            console.error("Error loading config", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Save Service or Add-on
    const handleSave = async (e) => {
        e.preventDefault();
        const collection = activeTab === 'services'
            ? COLLECTIONS.SERVICE_TYPES
            : COLLECTIONS.ADD_ONS;

        try {
            setSaving(true);
            const itemToSave = { ...editingItem };

            // For services, ensure rate is set from pricePerSqft
            if (activeTab === 'services') {
                itemToSave.rate = itemToSave.pricePerSqft || 0;
            }

            if (editingItem.id && !editingItem.isNew) {
                // Update existing
                await updateDoc(collection, editingItem.id, itemToSave);
            } else {
                // Create new
                const id = editingItem.id || generateId(activeTab === 'services' ? 'service' : 'addon');
                await setDoc(collection, id, {
                    ...itemToSave,
                    id,
                    active: true,
                    createdAt: new Date().toISOString()
                });
            }
            setEditingItem(null);
            loadData();
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Save Settings
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await updateDoc(COLLECTIONS.SETTINGS, 'app', {
                ...settings,
                updatedAt: new Date().toISOString()
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This might affect existing bookings.')) return;
        const collection = activeTab === 'services'
            ? COLLECTIONS.SERVICE_TYPES
            : COLLECTIONS.ADD_ONS;
        await deleteDoc(collection, id);
        loadData();
    };

    // Service/Add-on Modal
    const ItemModal = () => {
        if (!editingItem) return null;
        const isService = activeTab === 'services';

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">
                        {editingItem.isNew ? 'New' : 'Edit'} {isService ? 'Service Type' : 'Add-on'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                className="w-full border p-2 rounded-lg"
                                placeholder={isService ? "e.g., Deep Clean" : "e.g., Inside Fridge"}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={editingItem.description || ''}
                                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                className="w-full border p-2 rounded-lg h-20 resize-none"
                                placeholder="Brief description..."
                            />
                        </div>

                        {/* Pricing Section */}
                        <div className="pt-2 border-t">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pricing</h4>

                            {isService ? (
                                <>
                                    {/* Service: Base Price + Per Sq Ft Rate */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Base Price ($)
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editingItem.basePrice || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, basePrice: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-9 border p-2 rounded-lg"
                                                    placeholder="25"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Minimum charge</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Rate per Sq Ft ($)
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editingItem.pricePerSqft || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, pricePerSqft: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-9 border p-2 rounded-lg"
                                                    placeholder="0.10"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">e.g., 0.10 = 10¢/sqft</p>
                                        </div>
                                    </div>

                                    {/* Price Example */}
                                    {editingItem.pricePerSqft > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <strong>Example:</strong> 2000 sqft home = ${((editingItem.basePrice || 0) + (2000 * (editingItem.pricePerSqft || 0))).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Add-on: Flat Price or Per Sq Ft Rate */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="pricingType"
                                                    checked={!editingItem.rate}
                                                    onChange={() => setEditingItem({ ...editingItem, rate: null })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">Flat Fee</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="pricingType"
                                                    checked={!!editingItem.rate}
                                                    onChange={() => setEditingItem({ ...editingItem, rate: 0.01, price: 0 })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">Per Sq Ft</span>
                                            </label>
                                        </div>
                                    </div>

                                    {!editingItem.rate ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Flat Price ($)
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editingItem.price || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-9 border p-2 rounded-lg"
                                                    placeholder="15"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Rate per Sq Ft ($)
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    value={editingItem.rate || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-9 border p-2 rounded-lg"
                                                    placeholder="0.02"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Example: 2000 sqft = ${(2000 * (editingItem.rate || 0)).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Duration (minutes)
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    min="0"
                                    value={editingItem.duration || ''}
                                    onChange={e => setEditingItem({ ...editingItem, duration: parseInt(e.target.value) || 0 })}
                                    className="w-full pl-9 border p-2 rounded-lg"
                                    placeholder={isService ? "120" : "20"}
                                />
                            </div>
                        </div>

                        {/* Icon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon Name</label>
                            <input
                                type="text"
                                value={editingItem.icon || ''}
                                onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                                className="w-full border p-2 rounded-lg"
                                placeholder="Sparkles, Zap, Home, Box, etc."
                            />
                            <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
                        </div>

                        {/* Features (Services only) */}
                        {isService && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                                <textarea
                                    value={(editingItem.features || []).join('\n')}
                                    onChange={e => setEditingItem({
                                        ...editingItem,
                                        features: e.target.value.split('\n').filter(f => f.trim())
                                    })}
                                    className="w-full border p-2 rounded-lg h-28 resize-none"
                                    placeholder="Dusting all surfaces&#10;Vacuum & mop floors&#10;Clean bathrooms"
                                />
                            </div>
                        )}

                        {/* Active Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editingItem.active !== false}
                                onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label className="text-sm">Active (Available for booking)</label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Settings Panel
    const SettingsPanel = () => {
        if (!settings) return <div className="text-center py-10">Loading settings...</div>;

        const updateMetroMultiplier = (city, value) => {
            setSettings({
                ...settings,
                metroMultipliers: {
                    ...settings.metroMultipliers,
                    [city]: parseFloat(value) || 1.0
                }
            });
        };

        const addMetroCity = () => {
            const city = prompt('Enter city name:');
            if (city && city.trim()) {
                setSettings({
                    ...settings,
                    metroMultipliers: {
                        ...settings.metroMultipliers,
                        [city.trim()]: 1.0
                    }
                });
            }
        };

        const removeMetroCity = (city) => {
            if (!window.confirm(`Remove ${city} from metro multipliers?`)) return;
            const newMultipliers = { ...settings.metroMultipliers };
            delete newMultipliers[city];
            setSettings({ ...settings, metroMultipliers: newMultipliers });
        };

        return (
            <div className="space-y-6">
                {/* Tax & Fees */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-blue-600" />
                        Tax & Platform Fees
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={(settings.taxRate * 100).toFixed(2)}
                                onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) / 100 || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">e.g., 8.25 for 8.25%</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={(settings.platformFee * 100).toFixed(1)}
                                onChange={e => {
                                    const fee = parseFloat(e.target.value) / 100 || 0;
                                    setSettings({
                                        ...settings,
                                        platformFee: fee,
                                        cleanerEarningsRate: 1 - fee
                                    });
                                }}
                                className="w-full border p-2 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Cleaner earns: {((1 - settings.platformFee) * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Surcharge ($)</label>
                            <input
                                type="number"
                                step="1"
                                min="0"
                                value={settings.petSurcharge || 10}
                                onChange={e => setSettings({ ...settings, petSurcharge: parseFloat(e.target.value) || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Added for homes with pets</p>
                        </div>
                    </div>
                </div>

                {/* Booking Limits */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Booking Limits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Booking ($)</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.minBookingAmount}
                                onChange={e => setSettings({ ...settings, minBookingAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Booking ($)</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.maxBookingAmount}
                                onChange={e => setSettings({ ...settings, maxBookingAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <X className="w-5 h-5 text-red-600" />
                        Cancellation Policy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee ($)</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.cancellationFee}
                                onChange={e => setSettings({ ...settings, cancellationFee: parseFloat(e.target.value) || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Free Cancellation Window (hours)</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.cancellationWindow}
                                onChange={e => setSettings({ ...settings, cancellationWindow: parseInt(e.target.value) || 0 })}
                                className="w-full border p-2 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Hours before booking when free cancellation ends</p>
                        </div>
                    </div>
                </div>

                {/* Metro Multipliers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-purple-600" />
                            Metro Area Price Multipliers
                        </h3>
                        <button
                            onClick={addMetroCity}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                        >
                            <Plus className="w-4 h-4" /> Add City
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Adjust pricing for different metro areas. 1.0 = base price, 1.1 = 10% higher, 0.9 = 10% lower
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(settings.metroMultipliers || {}).map(([city, multiplier]) => (
                            <div key={city} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{city}</p>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.5"
                                        max="2.0"
                                        value={multiplier}
                                        onChange={e => updateMetroMultiplier(city, e.target.value)}
                                        className="w-full border p-1.5 rounded text-sm mt-1"
                                    />
                                </div>
                                <button
                                    onClick={() => removeMetroCity(city)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pricing & Services</h2>
                    <p className="text-gray-500 text-sm mt-1">Configure service types, add-ons, and pricing settings</p>
                </div>
                {activeTab !== 'settings' && (
                    <button
                        onClick={() => setEditingItem({ isNew: true, active: true, features: [] })}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add {activeTab === 'services' ? 'Service' : 'Add-on'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'services'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Service Types
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('addons')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'addons'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <span className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Add-ons
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'settings'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Pricing Settings
                    </span>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'settings' ? (
                loading ? (
                    <div className="text-center py-10 text-gray-500">Loading settings...</div>
                ) : (
                    <SettingsPanel />
                )
            ) : loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No items found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`bg-white p-6 rounded-2xl border transition-all hover:shadow-md
                                ${item.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                                    ${activeTab === 'services' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {activeTab === 'services' ? <Layers className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>

                            {/* Pricing Display */}
                            {activeTab === 'services' ? (
                                <div className="mb-3">
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${item.pricePerSqft || item.rate || 0}<span className="text-sm font-normal text-gray-500">/sqft</span>
                                    </p>
                                    {item.basePrice > 0 && (
                                        <p className="text-sm text-gray-500">+ ${item.basePrice} base</p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-3">
                                    {item.rate ? (
                                        <p className="text-2xl font-bold text-gray-900">
                                            ${item.rate}<span className="text-sm font-normal text-gray-500">/sqft</span>
                                        </p>
                                    ) : (
                                        <p className="text-2xl font-bold text-gray-900">${item.price || 0}</p>
                                    )}
                                </div>
                            )}

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>

                            {/* Duration */}
                            {item.duration > 0 && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{item.duration} min</span>
                                </div>
                            )}

                            {/* Features (Services only) */}
                            {activeTab === 'services' && item.features?.length > 0 && (
                                <div className="text-xs text-gray-500 mb-3">
                                    <span className="font-medium">{item.features.length} features included</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                    ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {item.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ItemModal />
        </div>
    );
}
