import { useState, useEffect } from 'react';
/*
 * ============================================================================
 * NOTIFICATION CENTER
 * ============================================================================
 * 
 * Purpose:
 * Central hub for alerts: Jobs, Payments, System Messages.
 * 
 * Types Handled:
 * - NEW_JOB / job_offer: Critical for marketplace liquidity.
 * - PAYMENT_RECEIVED: Engagement driver.
 * - SYSTEM: Admin announcements.
 * 
 * Logic:
 * Supports "Mark All Read" and "Filter by Type" for usability.
 */
import { useApp } from '../context/AppContext';
import {
    getUserNotifications,
    markNotificationAsRead as markNotifRead,
    markAllNotificationsAsRead as markAllRead,
    deleteNotification
} from '../storage';
import {
    Bell, Briefcase, DollarSign, Star, MessageSquare,
    CheckCircle, AlertCircle, Clock, ChevronRight, X,
    Sparkles, MapPin, Calendar, Settings, Filter
} from 'lucide-react';

// Notification types mapping
const NOTIFICATION_TYPES = {
    job_available: 'job_available',
    job_offer: 'job_offer', // Specific type used in broadcast
    NEW_JOB: 'new_job',
    job_accepted: 'job_accepted',
    JOB_ACCEPTED: 'job_accepted',
    booking_accepted: 'booking_accepted',
    payment: 'payment',
    PAYMENT_RECEIVED: 'payment_received',
    review: 'review',
    REVIEW_RECEIVED: 'review_received',
    message: 'message',
    MESSAGE: 'message',
    reminder: 'reminder',
    REMINDER: 'reminder',
    system: 'system',
    SYSTEM: 'system'
};

const getNotificationIcon = (type) => {
    const normalizedType = type?.toLowerCase() || 'system';

    if (normalizedType.includes('job') || normalizedType.includes('available') || normalizedType.includes('offer') || normalizedType.includes('booking')) {
        return { icon: Briefcase, color: 'text-primary-600', bg: 'bg-primary-100' };
    }
    if (normalizedType.includes('payment')) {
        return { icon: DollarSign, color: 'text-secondary-600', bg: 'bg-secondary-100' };
    }
    if (normalizedType.includes('review')) {
        return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    }
    if (normalizedType.includes('message')) {
        return { icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-100' };
    }
    if (normalizedType.includes('reminder')) {
        return { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' };
    }
    return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
};

const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export default function CleanerNotifications({ onBack, onViewJob, onViewMessage, onViewReview }) {
    const { user } = useApp();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, jobs, payments
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        newJobs: true,
        payments: true,
        reviews: true,
        messages: true,
        reminders: true,
        marketing: false
    });

    // Load notifications from database
    useEffect(() => {
        const loadNotifications = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const notifs = await getUserNotifications(user.uid);
                setNotifications(notifs || []);
            } catch (error) {
                console.error('Error loading notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [user?.uid]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = notifications.filter(n => {
        const type = n.type?.toLowerCase() || '';
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        if (filter === 'jobs') return type.includes('job') || type.includes('available');
        if (filter === 'payments') return type.includes('payment');
        return true;
    });

    const handleMarkAsRead = async (notifId) => {
        try {
            await markNotifRead(notifId);
            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!user?.uid) return;

        try {
            await markAllRead(user.uid);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDismiss = async (notifId) => {
        try {
            await deleteNotification(notifId);
            setNotifications(prev => prev.filter(n => n.id !== notifId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        handleMarkAsRead(notification.id);

        switch (notification.type) {
            case NOTIFICATION_TYPES.NEW_JOB:
            case NOTIFICATION_TYPES.job_offer:
                onViewJob?.(notification.relatedId ? { id: notification.relatedId } : notification.data);
                break;
            case NOTIFICATION_TYPES.MESSAGE:
                onViewMessage?.(notification.data);
                break;
            case NOTIFICATION_TYPES.REVIEW_RECEIVED:
                onViewReview?.(notification.data);
                break;
            default:
                break;
        }
    };

    // Settings Modal
    if (showSettings) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setShowSettings(false)} className="p-2">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-lg font-semibold">Notification Settings</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="card p-0 divide-y divide-gray-100">
                        {[
                            { key: 'newJobs', label: 'New Job Offers', desc: 'Get notified when jobs match your preferences' },
                            { key: 'payments', label: 'Payment Updates', desc: 'Receive alerts when you get paid' },
                            { key: 'reviews', label: 'Customer Reviews', desc: 'Know when customers leave feedback' },
                            { key: 'messages', label: 'Messages', desc: 'Get notified of new customer messages' },
                            { key: 'reminders', label: 'Job Reminders', desc: 'Reminders for upcoming scheduled jobs' },
                            { key: 'marketing', label: 'Promotions & Tips', desc: 'Earn more with tips and special offers' }
                        ].map(({ key, label, desc }) => (
                            <label key={key} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{label}</p>
                                    <p className="text-sm text-gray-500">{desc}</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={settings[key]}
                                        onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-secondary-500 
                                                    after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                                                    after:bg-white after:rounded-full after:h-5 after:w-5 
                                                    after:transition-all peer-checked:after:translate-x-full" />
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowSettings(false)}
                        className="btn btn-secondary w-full"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold">Notifications</h1>
                <button onClick={() => setShowSettings(true)} className="p-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Unread Badge & Mark All */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-400" />
                        {unreadCount > 0 ? (
                            <span className="text-sm font-medium text-gray-900">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-500">All caught up!</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm font-medium text-secondary-600 hover:text-secondary-700"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'jobs', label: 'Jobs' },
                        { id: 'payments', label: 'Payments' }
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setFilter(id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                ${filter === id
                                    ? 'bg-secondary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                            {id === 'unread' && unreadCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="px-6 py-4 space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No notifications</h3>
                        <p className="text-sm text-gray-500">
                            {filter === 'unread'
                                ? "You're all caught up!"
                                : "You'll see notifications here when something happens"
                            }
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => {
                        const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={`card p-4 relative transition-all cursor-pointer hover:shadow-md
                                    ${!notification.read ? 'bg-secondary-50/50 border-secondary-200' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Unread indicator */}
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-secondary-500 rounded-full" />
                                )}

                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.createdAt || notification.timestamp)}</p>
                                    </div>

                                    {/* Dismiss button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDismiss(notification.id);
                                        }}
                                        className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                {/* Action hint */}
                                {notification.actionable && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-secondary-600 font-medium">Tap to view details</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
