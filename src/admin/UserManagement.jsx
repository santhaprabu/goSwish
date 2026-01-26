import { useState, useEffect } from 'react';
import {
    getDocs, updateDoc, COLLECTIONS
} from '../storage/db';
import {
    Search, Filter, MoreVertical, Shield, ShieldCheck,
    User, Briefcase, CheckCircle, XCircle
} from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [cleaners, setCleaners] = useState([]); // Cleaner profiles
    const [filterRole, setFilterRole] = useState('all'); // all, customer, cleaner
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

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
        if (window.confirm(`${user.isActive === false ? 'Activate' : 'Deactivate'} user ${user.name}?`)) {
            await updateDoc(COLLECTIONS.USERS, user.id, { isActive: !user.isActive });
            loadData();
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
                        onClick={() => setFilterRole('customer')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                            ${filterRole === 'customer' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}
                    >
                        <User className="w-4 h-4" /> Customers
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
        </div>
    );
}
