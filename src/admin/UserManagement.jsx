import { useState, useEffect } from 'react';
import {
    getDocs, updateDoc, COLLECTIONS
} from '../storage/db';
import {
    Search, Filter, MoreVertical, Shield, ShieldCheck,
    User, Briefcase, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [cleaners, setCleaners] = useState([]); // Cleaner profiles
    const [filterRole, setFilterRole] = useState('all'); // all, customer, cleaner
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        // Cleaner-specific fields
        hourlyRate: '',
        serviceRadius: '',
        bio: '',
        headline: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const usersData = await getDocs(COLLECTIONS.USERS);
            setUsers(usersData);

            const cleanersData = await getDocs(COLLECTIONS.CLEANERS);
            setCleaners(cleanersData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApproveCleaner = async (userId) => {
        // Find cleaner profile
        const cleaner = cleaners.find(c => c.userId === userId);
        if (!cleaner) return alert('Cleaner profile not found');

        if (window.confirm(`Approve ${cleaner.name}?`)) {
            await updateDoc(COLLECTIONS.CLEANERS, cleaner.id, { status: 'active' });
            loadData();
        }
    };

    const handleToggleStatus = async (user) => {
        const isCurrentlyActive = user.isActive !== false;
        const action = isCurrentlyActive ? 'Deactivate' : 'Activate';
        const confirmMessage = isCurrentlyActive
            ? `Deactivate ${user.name}? They will not be able to log in or receive jobs.`
            : `Activate ${user.name}? They will be able to log in and use the app.`;

        if (window.confirm(confirmMessage)) {
            try {
                // Update user account status
                await updateDoc(COLLECTIONS.USERS, user.id, {
                    isActive: !isCurrentlyActive,
                    deactivatedAt: isCurrentlyActive ? new Date().toISOString() : null,
                    deactivatedBy: 'admin'
                });

                // If user is a cleaner, also update their cleaner profile status
                if (user.role === 'cleaner') {
                    const cleanerProfile = cleaners.find(c => c.userId === user.id);
                    if (cleanerProfile) {
                        await updateDoc(COLLECTIONS.CLEANERS, cleanerProfile.id, {
                            status: isCurrentlyActive ? 'deactivated' : 'active',
                            deactivatedAt: isCurrentlyActive ? new Date().toISOString() : null
                        });
                    }
                }

                loadData();
            } catch (error) {
                console.error('Error toggling user status:', error);
                alert('Failed to update user status');
            }
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);

        // Find cleaner profile if editing a cleaner
        const cleanerProfile = user.role === 'cleaner'
            ? cleaners.find(c => c.userId === user.id)
            : null;

        setEditForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'homeowner',
            // Cleaner-specific fields
            hourlyRate: cleanerProfile?.hourlyRate || '',
            serviceRadius: cleanerProfile?.serviceRadius || '',
            bio: cleanerProfile?.bio || '',
            headline: cleanerProfile?.headline || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            // Update user document
            await updateDoc(COLLECTIONS.USERS, editingUser.id, {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                role: editForm.role,
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin'
            });

            // Also update cleaner profile if they are a cleaner
            if (editForm.role === 'cleaner') {
                const cleanerProfile = cleaners.find(c => c.userId === editingUser.id);
                if (cleanerProfile) {
                    await updateDoc(COLLECTIONS.CLEANERS, cleanerProfile.id, {
                        name: editForm.name,
                        hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : cleanerProfile.hourlyRate,
                        serviceRadius: editForm.serviceRadius ? parseInt(editForm.serviceRadius) : cleanerProfile.serviceRadius,
                        bio: editForm.bio || cleanerProfile.bio,
                        headline: editForm.headline || cleanerProfile.headline,
                        updatedAt: new Date().toISOString()
                    });
                }
            }

            setEditingUser(null);
            loadData();
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user");
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const getCleanerStatus = (userId) => {
        const profile = cleaners.find(c => c.userId === userId);
        return profile ? profile.status : 'N/A';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input w-full pl-10 border p-2 rounded-lg"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterRole('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                            ${filterRole === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterRole('homeowner')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                            ${filterRole === 'homeowner' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}
                    >
                        <User className="w-4 h-4" /> Home Owners
                    </button>
                    <button
                        onClick={() => setFilterRole('cleaner')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                            ${filterRole === 'cleaner' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'}`}
                    >
                        <Briefcase className="w-4 h-4" /> Cleaners
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider overflow-hidden text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => {
                                const cleanerStatus = user.role === 'cleaner' ? getCleanerStatus(user.id) : null;
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                                    {user.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                                                ${user.role === 'cleaner' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'cleaner' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded w-fit
                                                        ${cleanerStatus === 'active' ? 'bg-green-100 text-green-700' :
                                                            cleanerStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        Profile: {cleanerStatus}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        Account: {user.isActive !== false ? 'Active' : 'Deactivated'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={`font-medium text-sm ${user.isActive !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                    {user.isActive !== false ? 'Active' : 'Deactivated'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:text-gray-900"
                                                >
                                                    Edit
                                                </button>
                                                {user.role === 'cleaner' && cleanerStatus === 'pending' && (
                                                    <button
                                                        onClick={() => handleApproveCleaner(user.id)}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                                                        ${user.isActive !== false
                                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                            : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                >
                                                    {user.isActive !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {editingUser.role === 'cleaner' ? 'Cleaner Profile' : 'Homeowner Account'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Deactivated Warning */}
                        {editingUser.isActive === false && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="text-sm text-red-700">This account is currently deactivated</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            {/* Basic Info Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Basic Information</h4>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="homeowner">Home Owner</option>
                                        <option value="cleaner">Cleaner</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cleaner-Specific Fields */}
                            {editForm.role === 'cleaner' && (
                                <div className="space-y-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cleaner Profile</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                                        <input
                                            type="text"
                                            value={editForm.headline}
                                            onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                                            placeholder="e.g., Professional & Reliable Cleaner"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={3}
                                            placeholder="Brief description of the cleaner..."
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editForm.hourlyRate}
                                                onChange={e => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Radius (miles)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={editForm.serviceRadius}
                                                onChange={e => setEditForm({ ...editForm, serviceRadius: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
