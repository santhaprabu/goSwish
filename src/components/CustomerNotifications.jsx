import { useState, useEffect } from 'react';
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
    booking_accepted: 'booking_accepted',
    job_accepted: 'job_accepted',
    booking_update: 'booking_update',
    message: 'message',
    promo: 'promo',
    system: 'system'
};

const getNotificationIcon = (type) => {
    const normalizedType = type?.toLowerCase() || 'system';

    if (normalizedType.includes('booking') || normalizedType.includes('job') || normalizedType.includes('accepted')) {
        return { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-100' };
    }
    if (normalizedType.includes('promo') || normalizedType.includes('offer')) {
        return { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
    if (normalizedType.includes('message')) {
        return { icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-100' };
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

export default function CustomerNotifications({ onBack, onViewBooking }) {
    const { user } = useApp();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

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
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
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

        if (notification.type === 'booking_accepted' || notification.type === 'job_accepted') {
            // Navigate to booking details if possible
            // Assuming relatedId is booking ID
            onViewBooking?.(notification.relatedId);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold">Notifications</h1>
                <div className="w-10" />
            </div>

            {/* Unread Badge & Mark All */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-400" />
                        {unreadCount > 0 ? (
                            <span className="text-sm font-medium text-gray-900">
                                {unreadCount} unread
                            </span>
                        ) : (
                            <span className="text-sm text-gray-500">All caught up!</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
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
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setFilter(id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                ${filter === id
                                    ? 'bg-primary-500 text-white'
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
                            You'll see updates here when your bookings change
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => {
                        const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={`card p-4 relative transition-all cursor-pointer hover:shadow-md
                                    ${!notification.read ? 'bg-primary-50/50 border-primary-200' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Unread indicator */}
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary-500 rounded-full" />
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
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
