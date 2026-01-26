import { useState, useEffect } from 'react';
import {
    Tag, Plus, Trash2, Calendar, Hash
} from 'lucide-react';
import {
    getDocs, addDoc, deleteDoc, COLLECTIONS
} from '../storage/db';

export default function PromoConfig() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount: 10,
        type: 'fixed', // fixed or percentage
        validUntil: '',
        maxUses: 100,
        minAmount: 0
    });

    const loadPromos = async () => {
        setLoading(true);
        try {
            const data = await getDocs(COLLECTIONS.PROMO_CODES);
            setPromos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPromos();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await addDoc(COLLECTIONS.PROMO_CODES, {
                ...formData,
                code: formData.code.toUpperCase(),
                usedCount: 0,
                active: true,
                createdAt: new Date().toISOString(),
                validFrom: new Date().toISOString()
            });
            setIsModalOpen(false);
            setFormData({
                code: '',
                discount: 10,
                type: 'fixed',
                validUntil: '',
                maxUses: 100,
                minAmount: 0
            });
            loadPromos();
        } catch (err) {
            alert('Error creating promo');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this promo code?')) {
            await deleteDoc(COLLECTIONS.PROMO_CODES, id);
            loadPromos();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Promo
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading promos...</div>
            ) : promos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No active promo codes</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promos.map(promo => (
                        <div key={promo.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(promo.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-wide">{promo.code}</h3>
                                    <p className="text-sm text-gray-500">
                                        {promo.type === 'percentage' ? `${promo.discount}% OFF` : `$${promo.discount} OFF`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-gray-400" />
                                    <span>Used: {promo.usedCount} / {promo.maxUses}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Expires: {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Create Promo Code</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER2024"
                                    className="input w-full border p-2 rounded uppercase"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                                    <input
                                        type="number"
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                        className="input w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="input w-full border p-2 rounded"
                                    >
                                        <option value="fixed">Fixed ($)</option>
                                        <option value="percentage">Percent (%)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                <input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                    className="input w-full border p-2 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                                <input
                                    type="number"
                                    value={formData.maxUses}
                                    onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                                    className="input w-full border p-2 rounded"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Promo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
