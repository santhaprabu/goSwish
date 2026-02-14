import { useState, useEffect } from 'react';
import {
    Tag, Plus, Trash2, Calendar, Hash, Edit2, Eye, XCircle,
    Search, Filter, DollarSign, Percent, Users, Clock,
    CheckCircle, AlertTriangle, TrendingUp, Copy, RefreshCw,
    ChevronDown, ChevronUp, BarChart3, CalendarRange
} from 'lucide-react';
import {
    getDocs, setDoc, updateDoc, deleteDoc, COLLECTIONS, generateId
} from '../storage/db';

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700 border-green-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    exhausted: 'bg-gray-100 text-gray-700 border-gray-200',
    inactive: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export default function PromoConfig() {
    const [promos, setPromos] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [usageHistory, setUsageHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewingUsage, setViewingUsage] = useState(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'fixed', // fixed, percentage
        value: 10,
        maxDiscount: null, // For percentage codes
        validFrom: '',
        validUntil: '',
        maxUses: 100,
        maxUsesPerUser: 1,
        minOrderAmount: 0,
        serviceTypes: [], // Empty = all services
        firstTimeOnly: false,
        newUsersOnly: false,
        active: true,
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [promosData, serviceTypesData, usageData] = await Promise.all([
                getDocs(COLLECTIONS.PROMO_CODES),
                getDocs(COLLECTIONS.SERVICE_TYPES),
                getDocs(COLLECTIONS.PROMO_USAGE || 'promo_usage'),
            ]);

            setPromos(promosData || []);
            setServiceTypes(serviceTypesData || []);
            setUsageHistory(usageData || []);
        } catch (e) {
            console.error('Error loading promos:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Get promo status
    const getPromoStatus = (promo) => {
        const now = new Date();
        const startDate = promo.validFrom ? new Date(promo.validFrom) : null;
        const endDate = promo.validUntil ? new Date(promo.validUntil) : null;

        if (!promo.active) return 'inactive';
        if (promo.usedCount >= promo.maxUses) return 'exhausted';
        if (endDate && now > endDate) return 'expired';
        if (startDate && now < startDate) return 'scheduled';
        return 'active';
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format date for input
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    };

    // Calculate stats
    const stats = {
        total: promos.length,
        active: promos.filter(p => getPromoStatus(p) === 'active').length,
        expired: promos.filter(p => getPromoStatus(p) === 'expired').length,
        exhausted: promos.filter(p => getPromoStatus(p) === 'exhausted').length,
        totalUsage: promos.reduce((sum, p) => sum + (p.usedCount || 0), 0),
        totalSavings: promos.reduce((sum, p) => sum + (p.totalDiscountGiven || 0), 0),
    };

    // Filter promos
    const filteredPromos = promos.filter(promo => {
        // Status filter
        if (statusFilter !== 'all' && getPromoStatus(promo) !== statusFilter) return false;

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            return promo.code?.toLowerCase().includes(searchLower) ||
                promo.description?.toLowerCase().includes(searchLower);
        }

        return true;
    });

    // Open create modal
    const openCreateModal = () => {
        setFormData({
            code: '',
            description: '',
            type: 'fixed',
            value: 10,
            maxDiscount: null,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: '',
            maxUses: 100,
            maxUsesPerUser: 1,
            minOrderAmount: 0,
            serviceTypes: [],
            firstTimeOnly: false,
            newUsersOnly: false,
            active: true,
        });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (promo) => {
        setFormData({
            id: promo.id,
            code: promo.code || '',
            description: promo.description || '',
            type: promo.type || 'fixed',
            value: promo.value || promo.discount || 10,
            maxDiscount: promo.maxDiscount || null,
            validFrom: formatDateForInput(promo.validFrom),
            validUntil: formatDateForInput(promo.validUntil),
            maxUses: promo.maxUses || 100,
            maxUsesPerUser: promo.maxUsesPerUser || 1,
            minOrderAmount: promo.minOrderAmount || promo.minAmount || 0,
            serviceTypes: promo.serviceTypes || [],
            firstTimeOnly: promo.firstTimeOnly || false,
            newUsersOnly: promo.newUsersOnly || false,
            active: promo.active !== false,
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Generate random code
    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const promoData = {
                code: formData.code.toUpperCase().trim(),
                description: formData.description,
                type: formData.type,
                value: parseFloat(formData.value) || 0,
                discount: parseFloat(formData.value) || 0, // For backwards compatibility
                maxDiscount: formData.type === 'percentage' ? (parseFloat(formData.maxDiscount) || null) : null,
                validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
                validUntil: formData.validUntil ? new Date(formData.validUntil + 'T23:59:59').toISOString() : null,
                maxUses: parseInt(formData.maxUses) || 100,
                maxUsesPerUser: parseInt(formData.maxUsesPerUser) || 1,
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                minAmount: parseFloat(formData.minOrderAmount) || 0, // For backwards compatibility
                serviceTypes: formData.serviceTypes,
                firstTimeOnly: formData.firstTimeOnly,
                newUsersOnly: formData.newUsersOnly,
                active: formData.active,
                updatedAt: new Date().toISOString(),
            };

            if (isEditMode && formData.id) {
                // Update existing
                await updateDoc(COLLECTIONS.PROMO_CODES, formData.id, promoData);
            } else {
                // Check if code already exists
                const existingPromo = promos.find(p => p.code === promoData.code);
                if (existingPromo) {
                    alert('A promo code with this code already exists!');
                    setSaving(false);
                    return;
                }

                // Create new
                const id = generateId('promo');
                await setDoc(COLLECTIONS.PROMO_CODES, id, {
                    ...promoData,
                    id,
                    usedCount: 0,
                    currentUses: 0,
                    totalDiscountGiven: 0,
                    usageByUser: {},
                    createdAt: new Date().toISOString(),
                });
            }

            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error saving promo:', error);
            alert('Failed to save promo code');
        } finally {
            setSaving(false);
        }
    };

    // Toggle active status
    const toggleActive = async (promo) => {
        try {
            await updateDoc(COLLECTIONS.PROMO_CODES, promo.id, {
                active: !promo.active,
                updatedAt: new Date().toISOString(),
            });
            await loadData();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    // Delete promo
    const handleDelete = async (id) => {
        const promo = promos.find(p => p.id === id);
        if (!window.confirm(`Delete promo code "${promo?.code}"? This cannot be undone.`)) return;

        try {
            await deleteDoc(COLLECTIONS.PROMO_CODES, id);
            await loadData();
        } catch (error) {
            console.error('Error deleting promo:', error);
            alert('Failed to delete promo code');
        }
    };

    // Copy code to clipboard
    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        // Could add a toast notification here
    };

    // Get usage for a promo
    const getPromoUsage = (promoId) => {
        return usageHistory.filter(u => u.promoId === promoId);
    };

    // Promo Card Component
    const PromoCard = ({ promo }) => {
        const status = getPromoStatus(promo);
        const usage = getPromoUsage(promo.id);
        const usagePercent = promo.maxUses > 0 ? ((promo.usedCount || 0) / promo.maxUses) * 100 : 0;

        return (
            <div className={`bg-white rounded-2xl border-2 transition-all hover:shadow-lg overflow-hidden
                ${status === 'active' ? 'border-green-200' : 'border-gray-200'}`}>
                {/* Header */}
                <div className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                                ${promo.type === 'percentage' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                {promo.type === 'percentage' ? <Percent className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 tracking-wide">{promo.code}</h3>
                                    <button
                                        onClick={() => copyCode(promo.code)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        title="Copy code"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-lg font-semibold text-gray-700">
                                    {promo.type === 'percentage'
                                        ? `${promo.value || promo.discount}% OFF`
                                        : `$${promo.value || promo.discount} OFF`}
                                    {promo.maxDiscount && <span className="text-sm font-normal text-gray-500"> (max ${promo.maxDiscount})</span>}
                                </p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </div>

                    {promo.description && (
                        <p className="text-sm text-gray-500 mt-3">{promo.description}</p>
                    )}
                </div>

                {/* Usage Progress */}
                <div className="px-5 pb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Usage</span>
                        <span>{promo.usedCount || 0} / {promo.maxUses}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <CalendarRange className="w-4 h-4 text-gray-400" />
                        <span>
                            {formatDate(promo.validFrom)} — {promo.validUntil ? formatDate(promo.validUntil) : 'No expiry'}
                        </span>
                    </div>

                    {promo.minOrderAmount > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>Min order: ${promo.minOrderAmount || promo.minAmount}</span>
                        </div>
                    )}

                    {promo.maxUsesPerUser && promo.maxUsesPerUser > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{promo.maxUsesPerUser}x per user</span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {promo.firstTimeOnly && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">First Order Only</span>
                        )}
                        {promo.newUsersOnly && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">New Users Only</span>
                        )}
                        {promo.serviceTypes?.length > 0 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                {promo.serviceTypes.length} service(s)
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {promo.totalDiscountGiven > 0 && (
                    <div className="px-5 py-2 bg-emerald-50 border-t border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-700 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            <span>Total savings given: <strong>${promo.totalDiscountGiven?.toFixed(2) || '0.00'}</strong></span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={() => openEditModal(promo)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewingUsage(promo)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Usage"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => toggleActive(promo)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                            ${promo.active
                                ? 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                    >
                        {promo.active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        );
    };

    // Usage History Modal
    const UsageModal = () => {
        if (!viewingUsage) return null;

        const usage = getPromoUsage(viewingUsage.id);
        const promo = viewingUsage;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Usage History</h3>
                            <p className="text-sm text-gray-500">Promo Code: <span className="font-mono font-bold">{promo.code}</span></p>
                        </div>
                        <button onClick={() => setViewingUsage(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-blue-700">{promo.usedCount || 0}</p>
                                <p className="text-xs text-blue-600">Times Used</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-green-700">${promo.totalDiscountGiven?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-green-600">Total Savings</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-purple-700">
                                    {promo.usageByUser ? Object.keys(promo.usageByUser).length : 0}
                                </p>
                                <p className="text-xs text-purple-600">Unique Users</p>
                            </div>
                        </div>

                        {/* Usage by User */}
                        {promo.usageByUser && Object.keys(promo.usageByUser).length > 0 ? (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Usage by User</h4>
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">User ID</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Times Used</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Last Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {Object.entries(promo.usageByUser).map(([userId, data]) => (
                                                <tr key={userId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-mono text-xs">{userId.slice(0, 12)}...</td>
                                                    <td className="px-4 py-2">{typeof data === 'object' ? data.count : data}</td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {typeof data === 'object' && data.lastUsed
                                                            ? formatDate(data.lastUsed)
                                                            : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl">
                                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No usage data yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Create/Edit Modal
    const FormModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Promo Code' : 'Create Promo Code'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Code & Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER2026"
                                    className="flex-1 border p-2.5 rounded-lg uppercase font-mono tracking-wider"
                                    required
                                    disabled={isEditMode}
                                />
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                                    >
                                        Generate
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Summer sale - 20% off all services"
                                className="w-full border p-2.5 rounded-lg"
                            />
                        </div>

                        {/* Discount Type & Value */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                >
                                    <option value="fixed">Fixed Amount ($)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {formData.type === 'percentage' ? 'Discount (%)' : 'Discount ($)'} *
                                </label>
                                <input
                                    type="number"
                                    step={formData.type === 'percentage' ? '1' : '0.01'}
                                    min="0"
                                    max={formData.type === 'percentage' ? '100' : undefined}
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Max Discount (for percentage) */}
                        {formData.type === 'percentage' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Discount ($)
                                    <span className="text-gray-400 font-normal ml-1">Optional</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.maxDiscount || ''}
                                    onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                                    placeholder="e.g., 50 (caps discount at $50)"
                                    className="w-full border p-2.5 rounded-lg"
                                />
                            </div>
                        )}

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                    <span className="text-gray-400 font-normal ml-1">Optional</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Usage Limits */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Uses Limit *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maxUses}
                                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Uses Per User</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maxUsesPerUser}
                                    onChange={e => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                                    className="w-full border p-2.5 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Minimum Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Order Amount ($)
                                <span className="text-gray-400 font-normal ml-1">Optional</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.minOrderAmount}
                                onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                placeholder="0"
                                className="w-full border p-2.5 rounded-lg"
                            />
                        </div>

                        {/* Service Type Restrictions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Applicable Services
                                <span className="text-gray-400 font-normal ml-1">(Leave empty for all)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {serviceTypes.map(service => (
                                    <label
                                        key={service.id}
                                        className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border
                                            ${formData.serviceTypes.includes(service.id)
                                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.serviceTypes.includes(service.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, serviceTypes: [...formData.serviceTypes, service.id] });
                                                } else {
                                                    setFormData({ ...formData, serviceTypes: formData.serviceTypes.filter(s => s !== service.id) });
                                                }
                                            }}
                                        />
                                        {service.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* User Restrictions */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">User Restrictions</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={formData.firstTimeOnly}
                                        onChange={e => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">First Order Only</span>
                                        <p className="text-xs text-gray-500">Only valid for customer's first booking</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={formData.newUsersOnly}
                                        onChange={e => setFormData({ ...formData, newUsersOnly: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">New Users Only</span>
                                        <p className="text-xs text-gray-500">Only for accounts created in the last 7 days</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <div>
                                <span className="font-medium text-gray-900">Active</span>
                                <p className="text-xs text-gray-500">Promo code can be used by customers</p>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                {isEditMode ? 'Save Changes' : 'Create Promo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
                    <p className="text-gray-500 text-sm mt-1">Create and manage promotional discounts</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Promo
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 uppercase tracking-wide">Active</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <p className="text-xs text-red-600 uppercase tracking-wide">Expired</p>
                    <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Exhausted</p>
                    <p className="text-2xl font-bold text-gray-700">{stats.exhausted}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 uppercase tracking-wide">Total Uses</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.totalUsage}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide">Savings Given</p>
                    <p className="text-2xl font-bold text-emerald-700">${stats.totalSavings.toFixed(0)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by code or description..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'active', 'scheduled', 'expired', 'exhausted', 'inactive'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                                ${statusFilter === status
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Promo Cards Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : filteredPromos.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No promo codes found</p>
                    <p className="text-gray-400 text-sm mt-1">
                        {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first promo code'}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create Promo Code
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPromos.map(promo => (
                        <PromoCard key={promo.id} promo={promo} />
                    ))}
                </div>
            )}

            {/* Modals */}
            <FormModal />
            <UsageModal />
        </div>
    );
}
