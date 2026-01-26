import { useState, useEffect } from 'react';
import {
    Layers, Plus, Edit2, Trash2, Check, X,
    DollarSign, Sparkles, Box
} from 'lucide-react';
import {
    getDocs, updateDoc, addDoc, deleteDoc, COLLECTIONS, generateId
} from '../storage/db';

export default function ServiceConfig() {
    const [activeTab, setActiveTab] = useState('services'); // services, addons
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const collection = activeTab === 'services'
                ? COLLECTIONS.SERVICE_TYPES
                : COLLECTIONS.ADD_ONS;
            const data = await getDocs(collection);
            setItems(data);
        } catch (e) {
            console.error("Error loading config", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleSave = async (e) => {
        e.preventDefault();
        const collection = activeTab === 'services'
            ? COLLECTIONS.SERVICE_TYPES
            : COLLECTIONS.ADD_ONS;

        try {
            if (editingItem.id) {
                // Update
                await updateDoc(collection, editingItem.id, editingItem);
            } else {
                // Create
                await addDoc(collection, {
                    ...editingItem,
                    active: true
                });
            }
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert('Failed to save');
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

    const Modal = () => {
        if (!editingItem) return null;
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold mb-4">
                        {editingItem.id ? 'Edit' : 'New'} {activeTab === 'services' ? 'Service' : 'Add-on'}
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                className="input w-full border p-2 rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price / Rate</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    value={editingItem.price || ''}
                                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                    className="input w-full pl-9 border p-2 rounded"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={editingItem.description || ''}
                                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                className="input w-full border p-2 rounded h-24 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editingItem.active !== false}
                                onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label className="text-sm">Active (Available for booking)</label>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Service Configuration</h2>
                <button
                    onClick={() => setEditingItem({ price: 0, active: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add {activeTab === 'services' ? 'Service' : 'Add-on'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 
                        ${activeTab === 'services'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Service Types
                </button>
                <button
                    onClick={() => setActiveTab('addons')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 
                        ${activeTab === 'addons'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Add-ons
                </button>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading configuration...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No items found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className={`bg-white p-6 rounded-2xl border transition-all hover:shadow-md ${item.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === 'services' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {activeTab === 'services' ? <Layers className="w-5 h-5" /> : <Box className="w-5 h-5" />}
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
                            <p className="text-2xl font-bold text-gray-900 mb-2">${item.price}</p>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>

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

            <Modal />
        </div>
    );
}
