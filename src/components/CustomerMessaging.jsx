import { useState, useRef, useEffect } from 'react';
/*
 * ============================================================================
 * CUSTOMER MESSAGING SYSTEM (Booking-Scoped)
 * ============================================================================
 * 
 * Purpose:
 * Enables communication between Homeowners and Cleaners.
 * 
 * IMPORTANT - Booking-Scoped Conversations:
 * - Each conversation is tied to a specific booking
 * - Messaging is ONLY allowed for active bookings
 * - Once a booking is completed, cancelled, or approved, the conversation is LOCKED
 * - New bookings between the same parties create NEW conversation threads
 * 
 * Features:
 * - Real-time polling for new messages
 * - Visual indicator for locked conversations
 * - Booking info displayed in each conversation
 */
import { useApp } from '../context/AppContext';
import {
    getUserConversations,
    getConversationMessages,
    sendMessage as dbSendMessage,
    isConversationLocked,
} from '../storage';
import {
    Send, ChevronRight, Phone, Check, CheckCheck, Clock, Search,
    MessageSquare, Loader, Lock, Calendar, MapPin
} from 'lucide-react';
import { getDoc, COLLECTIONS } from '../storage/db';
import { formatBookingId } from '../utils/formatters';

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function CustomerMessaging({ onBack, initialBookingId }) {
    const { user } = useApp();
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const convos = await getUserConversations(user.uid);

                const convosWithStatus = await Promise.all(convos.map(async (conv) => {
                    let status = 'active';
                    let bookingStatus = 'unknown';
                    let address = '';
                    let formattedBookingId = conv.bookingId || 'N/A';
                    let rawBookingId = conv.bookingId; // Keep the raw ID for matching

                    if (conv.bookingId && conv.bookingId !== 'N/A') {
                        try {
                            const bookingDoc = await getDoc(COLLECTIONS.BOOKINGS, conv.bookingId);
                            if (bookingDoc) {
                                bookingStatus = bookingDoc.status;
                                formattedBookingId = bookingDoc.bookingId || conv.bookingId;
                                if (['completed', 'cancelled', 'declined', 'approved'].includes(bookingStatus)) {
                                    status = 'closed';
                                }
                                // Fetch house/address info
                                if (bookingDoc.houseId) {
                                    try {
                                        const house = await getDoc(COLLECTIONS.HOUSES, bookingDoc.houseId);
                                        if (house) {
                                            address = house.address?.street || house.name || '';
                                        }
                                    } catch (e) {
                                        // Ignore house fetch errors
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('Could not fetch booking details for chat', conv.id);
                        }
                    }

                    // Format service type to Title Case (e.g., "deep_cleaning" -> "Deep Cleaning")
                    const formatServiceType = (type) => {
                        if (!type) return 'Cleaning';
                        return type
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase());
                    };

                    return {
                        id: conv.id,
                        cleanerId: conv.participantIds?.find(id => id !== user.uid),
                        cleanerName: conv.cleanerName || 'Cleaner',
                        lastMessage: conv.lastMessage || 'No messages yet',
                        lastMessageTime: conv.lastMessageTime || conv.createdAt,
                        unreadCount: 0,
                        bookingId: formattedBookingId,
                        rawBookingId: rawBookingId,
                        serviceType: formatServiceType(conv.serviceType),
                        address: address,
                        status: status,
                        bookingStatus: bookingStatus
                    };
                }));

                setConversations(convosWithStatus);
            } catch (error) {
                console.error('Error loading conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [user?.uid]);

    // Auto-select conversation if initialBookingId is provided
    useEffect(() => {
        if (initialBookingId && conversations.length > 0 && !autoSelectAttempted) {
            setAutoSelectAttempted(true);
            const matchingConvo = conversations.find(
                conv => conv.rawBookingId === initialBookingId || conv.bookingId === initialBookingId
            );
            if (matchingConvo) {
                setSelectedConvo(matchingConvo);
            }
        }
    }, [initialBookingId, conversations, autoSelectAttempted]);

    // Load messages when a conversation is selected
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedConvo?.id) return;

            try {
                const msgs = await getConversationMessages(selectedConvo.id);

                const formattedMsgs = msgs.map(msg => ({
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId === user?.uid ? 'homeowner' : 'cleaner',
                    text: msg.content,
                    timestamp: msg.createdAt,
                    status: msg.status || 'delivered'
                }));

                setMessages(formattedMsgs);
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();
    }, [selectedConvo?.id, user?.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch =
            conv.cleanerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (conv.bookingId || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'unread' && conv.unreadCount > 0) ||
            (activeFilter === 'active' && conv.status === 'active');

        return matchesSearch && matchesFilter;
    });

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConvo?.id || !user?.uid) return;

        const messageText = newMessage;
        setNewMessage('');

        const tempMessage = {
            id: `temp-${Date.now()}`,
            conversationId: selectedConvo.id,
            senderId: 'homeowner',
            text: messageText,
            timestamp: new Date().toISOString(),
            status: 'sending'
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            setSendingMessage(true);
            const savedMsg = await dbSendMessage(selectedConvo.id, user.uid, messageText);

            setMessages(prev =>
                prev.map(m => m.id === tempMessage.id
                    ? { ...m, id: savedMsg.id, status: 'delivered' }
                    : m
                )
            );
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev =>
                prev.map(m => m.id === tempMessage.id ? { ...m, status: 'failed' } : m)
            );
        } finally {
            setSendingMessage(false);
        }
    };

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    // Chat View
    if (selectedConvo) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Chat Header */}
                <div className="app-bar flex items-center px-4 py-3">
                    <button onClick={() => setSelectedConvo(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-primary-600 text-sm">
                                {selectedConvo.cleanerName.charAt(0)}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base font-semibold truncate">{selectedConvo.cleanerName}</h1>
                            <p className="text-xs text-gray-500">{selectedConvo.serviceType} • {formatBookingId(selectedConvo.bookingId)}</p>
                            {selectedConvo.address && (
                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    {selectedConvo.address}
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Date Divider */}
                    <div className="flex items-center justify-center mb-4">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                            Today
                        </span>
                    </div>

                    <div className="space-y-3 mx-1">
                        {messages.map((message) => {
                            const isOwn = message.senderId === 'homeowner';

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isOwn
                                            ? 'bg-primary-500 text-white rounded-br-md'
                                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                                            }`}
                                    >
                                        <p className="text-sm">{message.text}</p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                                            <span className="text-[10px]">{formatTime(message.timestamp)}</span>
                                            {isOwn && (
                                                message.status === 'sending' ? (
                                                    <Clock className="w-3 h-3" />
                                                ) : message.status === 'delivered' ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    <CheckCheck className="w-3 h-3" />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe">
                    {selectedConvo.status === 'closed' ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl text-gray-500 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>Chat closed - Booking {selectedConvo.bookingStatus}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="w-full py-2.5 bg-transparent text-sm focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sendingMessage}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${newMessage.trim()
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Conversations List
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="app-bar flex items-center justify-between px-4 py-3">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold">Messages</h1>
                <div className="w-10 relative">
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                            {totalUnread}
                        </span>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border-b border-gray-100 px-6 py-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-3 overflow-x-auto">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'active', label: 'Active' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveFilter(id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === id
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversations List */}
            <div className="px-6 py-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No messages</h3>
                        <p className="text-sm text-gray-500">
                            Messages with your cleaners will appear here
                        </p>
                    </div>
                ) : (
                    filteredConversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => {
                                setSelectedConvo(conv);
                                setConversations(prev =>
                                    prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
                                );
                            }}
                            className={`card p-4 w-full text-left transition-all hover:shadow-md ${!conv.unreadCount ? '' : 'bg-primary-50/50 border-primary-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                        <span className="font-semibold text-primary-600">
                                            {conv.cleanerName.charAt(0)}
                                        </span>
                                    </div>
                                    {conv.status === 'active' && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {conv.cleanerName}
                                        </h3>
                                        <span className={`text-xs ${conv.unreadCount > 0 ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                                            {formatTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {conv.lastMessage}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="ml-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {conv.serviceType} • {formatBookingId(conv.bookingId)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
