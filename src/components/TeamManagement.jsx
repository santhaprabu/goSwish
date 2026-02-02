import { useState } from 'react';
/*
 * ============================================================================
 * TEAM MANAGEMENT
 * ============================================================================
 * 
 * Purpose:
 * Allows Cleaners to form teams to handle larger jobs.
 * 
 * Features:
 * - Create a Team profile.
 * - Invite members via email.
 * - View member stats and remove members.
 */
import {
    Users, Plus, UserPlus, Mail, Check, X,
    ChevronRight, Star, TrendingUp, Award, Settings
} from 'lucide-react';

// Team Management - Create and manage cleaning teams
export default function TeamManagement({ cleaner, onBack }) {
    const [activeTab, setActiveTab] = useState('overview'); // overview, members, invitations
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showInviteMember, setShowInviteMember] = useState(false);

    // Mock team data
    const [team, setTeam] = useState({
        id: 'team-001',
        name: 'Elite Cleaners',
        description: 'Professional cleaning team specializing in deep cleans',
        leaderId: cleaner?.uid,
        members: [
            {
                id: cleaner?.uid,
                name: cleaner?.name || 'You',
                role: 'leader',
                photoURL: cleaner?.photoURL,
                rating: 4.9,
                completedJobs: 156,
                status: 'active'
            },
            {
                id: 'member-002',
                name: 'Sarah Johnson',
                role: 'member',
                photoURL: null,
                rating: 4.8,
                completedJobs: 89,
                status: 'active'
            },
            {
                id: 'member-003',
                name: 'Mike Chen',
                role: 'member',
                photoURL: null,
                rating: 4.7,
                completedJobs: 67,
                status: 'active'
            }
        ],
        stats: {
            totalJobs: 312,
            rating: 4.8,
            activeMembers: 3
        }
    });

    const [invitations, setInvitations] = useState([
        {
            id: 'inv-001',
            email: 'john.doe@example.com',
            status: 'pending',
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
    ]);

    const handleCreateTeam = (teamData) => {
        // In production, this would create team in database
        setTeam({
            ...teamData,
            id: `team-${Date.now()}`,
            leaderId: cleaner?.uid,
            members: [{
                id: cleaner?.uid,
                name: cleaner?.name,
                role: 'leader',
                photoURL: cleaner?.photoURL,
                rating: cleaner?.rating || 5.0,
                completedJobs: cleaner?.completedJobs || 0,
                status: 'active'
            }],
            stats: {
                totalJobs: 0,
                rating: 0,
                activeMembers: 1
            }
        });
        setShowCreateTeam(false);
    };

    const handleInviteMember = (email) => {
        const newInvitation = {
            id: `inv-${Date.now()}`,
            email,
            status: 'pending',
            sentAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        setInvitations([...invitations, newInvitation]);
        setShowInviteMember(false);
    };

    const handleRemoveMember = (memberId) => {
        if (confirm('Are you sure you want to remove this member?')) {
            setTeam({
                ...team,
                members: team.members.filter(m => m.id !== memberId)
            });
        }
    };

    const handleCancelInvitation = (invId) => {
        setInvitations(invitations.filter(inv => inv.id !== invId));
    };

    if (!team && !showCreateTeam) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
                <Users className="w-24 h-24 text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Team</h2>
                <p className="text-gray-600 text-center mb-8 max-w-md">
                    Work with other cleaners to take on bigger jobs and earn more together.
                </p>
                <button
                    onClick={() => setShowCreateTeam(true)}
                    className="btn btn-primary px-8 py-4"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Team
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-semibold text-center">Team Management</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'members', label: 'Members', icon: Users },
                        { id: 'invitations', label: 'Invitations', icon: Mail }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                  ${activeTab === tab.id
                                        ? 'bg-black text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 py-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Team Info Card */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">{team.name}</h2>
                                    <p className="text-gray-600">{team.description}</p>
                                </div>
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Settings className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{team.stats.totalJobs}</p>
                                    <p className="text-sm text-gray-500">Total Jobs</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{team.stats.rating} ★</p>
                                    <p className="text-sm text-gray-500">Team Rating</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{team.stats.activeMembers}</p>
                                    <p className="text-sm text-gray-500">Active Members</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowInviteMember(true)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserPlus className="w-5 h-5 text-gray-600" />
                                        <span className="font-medium text-gray-900">Invite New Member</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>

                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-gray-600" />
                                        <span className="font-medium text-gray-900">View Team Performance</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Team Members ({team.members.length})</h3>
                            <button
                                onClick={() => setShowInviteMember(true)}
                                className="btn btn-primary"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite
                            </button>
                        </div>

                        {team.members.map(member => (
                            <div key={member.id} className="card p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        {member.photoURL ? (
                                            <img
                                                src={member.photoURL}
                                                alt={member.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-600">
                                                {member.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                            {member.role === 'leader' && (
                                                <span className="badge bg-black text-white text-xs">Leader</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {member.rating}
                                            </span>
                                            <span>{member.completedJobs} jobs</span>
                                        </div>
                                    </div>

                                    {member.role !== 'leader' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <X className="w-5 h-5 text-gray-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Invitations Tab */}
                {activeTab === 'invitations' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Pending Invitations ({invitations.length})</h3>
                            <button
                                onClick={() => setShowInviteMember(true)}
                                className="btn btn-primary"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Invite
                            </button>
                        </div>

                        {invitations.length === 0 ? (
                            <div className="text-center py-12">
                                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No pending invitations</p>
                            </div>
                        ) : (
                            invitations.map(inv => (
                                <div key={inv.id} className="card p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{inv.email}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Sent {new Date(inv.sentAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Expires {new Date(inv.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-warning">Pending</span>
                                            <button
                                                onClick={() => handleCancelInvitation(inv.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                            >
                                                <X className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Invite Member Modal */}
            {showInviteMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <div className="card p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const email = e.target.email.value;
                                handleInviteMember(email);
                            }}
                        >
                            <div className="mb-4">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="colleague@example.com"
                                    className="input-field"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    They'll receive an invitation to join your team
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteMember(false)}
                                    className="btn btn-ghost flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
