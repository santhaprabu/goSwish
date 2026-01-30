import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    getUserConversations,
    getConversationMessages,
    sendMessage as dbSendMessage,
    markMessageAsRead
} from '../storage';
import {
    Send, ChevronLeft, Phone, MoreVertical, Image as ImageIcon,
    Paperclip, Smile, Check, CheckCheck, Clock, User, Search,
    MessageSquare, AlertCircle, Loader, Briefcase, Plus, Lock
} from 'lucide-react';
import { getDoc, COLLECTIONS } from '../storage/db';

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

export default function CustomerMessaging({ onBack }) {
    const { user } = useApp();
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'jobs'
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            if (!user?.uid) return;

            try {
                setLoading(true);
                const convos = await getUserConversations(user.uid);

                // Fetch booking details for status
                const convosWithStatus = await Promise.all(convos.map(async (conv) => {
                    let status = 'active';
                    let bookingStatus = 'unknown';

                    if (conv.bookingId && conv.bookingId !== 'N/A') {
                        try {
                            // First try to find by random ID match if needed, but assuming ID is key
                            // Actually bookingId might be the clean ID string or the doc ID
                            // Let's assume it's the docId or we try to fetch by bookingId field
                            // For simplicity, we'll try to getDoc if ID looks like a doc ID, or query if not
                            // Since we don't have easy query access here without more imports, 
                            // we'll rely on the fact that usually we store the ID.
                            // However, seed data generates custom IDs.
                            // Let's try to fetch assuming conv.bookingId is the document ID first.
                            // But actually `createBooking` uses `generateId` for doc ID and `generateBookingNumber` for visible ID.
                            // If `conv.bookingId` is the visible ID (e.g. TX-2023...), we can't getDoc it.
                            // But let's check how conversation is created. 
                            // It usually links to the job or booking doc ID.
                            // See `acceptJobOffer`: `createConversation([cleanerId, customerId], { bookingId: bookingId ... })`
                            // So `bookingId` in conversation is likely the Document ID.

                            const bookingDoc = await getDoc(COLLECTIONS.BOOKINGS, conv.bookingId);
                            if (bookingDoc) {
                                bookingStatus = bookingDoc.status;
                                if (['completed', 'cancelled', 'declined', 'approved'].includes(bookingStatus)) {
                                    status = 'closed';
                                }
                            }
                        } catch (e) {
                            console.warn('Could not fetch booking details for chat', conv.id);
                        }
                    }

                    return {
                        id: conv.id,
                        cleanerId: conv.participantIds?.find(id => id !== user.uid),
                        cleanerName: conv.cleanerName || 'Cleaner',
                        cleanerPhoto: null,
                        lastMessage: conv.lastMessage || 'No messages yet',
                        lastMessageTime: conv.lastMessageTime || conv.createdAt,
                        unreadCount: 0,
                        bookingId: conv.bookingId || 'N/A',
                        serviceType: conv.serviceType || 'Cleaning',
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

    // Load messages when a conversation is selected
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedConvo?.id) return;

            try {
                const msgs = await getConversationMessages(selectedConvo.id);

                // Format messages
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
            (activeFilter === 'jobs' && conv.bookingId && conv.bookingId !== 'N/A');

        return matchesSearch && matchesFilter;
    });

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConvo?.id || !user?.uid) return;

        const messageText = newMessage;
        setNewMessage('');

        // Optimistic update
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

            // Replace temp message with real one
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
    // Chat View
    if (selectedConvo) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col z-50">
                {/* Chat Header - Minimal */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 transition-all">
                    <button
                        onClick={() => setSelectedConvo(null)}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner">
                            <span className="font-bold text-sm">
                                {selectedConvo.cleanerName.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 leading-tight">{selectedConvo.cleanerName}</h2>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Online</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900">
                            <Phone className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Area - Clean & Spacious */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-white">
                    <div className="flex justify-center mb-8">
                        <span className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-100">
                            Today
                        </span>
                    </div>

                    {messages.map((message, index) => {
                        const isOwn = message.senderId === 'homeowner';
                        const isConsecutive = index > 0 && messages[index - 1].senderId === message.senderId;

                        return (
                            <div
                                key={message.id}
                                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
                            >
                                <div
                                    className={`max-w-[75%] px-5 py-3.5 text-sm leading-relaxed ${isOwn
                                        ? 'bg-black text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-gray-50 text-gray-700 rounded-2xl rounded-tl-sm border border-gray-100'
                                        }`}
                                >
                                    {message.text}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-[10px] font-medium text-gray-300">
                                        {formatTime(message.timestamp)}
                                    </span>
                                    {isOwn && (
                                        message.status === 'sending' ? (
                                            <Clock className="w-3 h-3 text-gray-300" />
                                        ) : message.status === 'delivered' ? (
                                            <Check className="w-3 h-3 text-gray-300" />
                                        ) : (
                                            <CheckCheck className="w-3 h-3 text-teal-500" />
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Floating & Modern */}
                <div className="p-4 bg-white/90 backdrop-blur-lg border-t border-gray-50 sticky bottom-0">
                    {selectedConvo.status === 'closed' ? (
                        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-medium border border-gray-100">
                            <Lock className="w-4 h-4" />
                            <span>This conversation is closed because the booking is {selectedConvo.bookingStatus === 'approved' ? 'completed' : selectedConvo.bookingStatus}.</span>
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 max-w-4xl mx-auto">
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>

                            <div className="flex-1 bg-gray-100 rounded-[1.5rem] flex items-center px-2 py-1.5 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                <textarea
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="w-full bg-transparent px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-32"
                                />
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newMessage.trim()
                                    ? 'bg-black text-white hover:scale-105 active:scale-95 shadow-lg shadow-black/20'
                                    : 'bg-gray-100 text-gray-300'
                                    }`}
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Conversations List
    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Minimal Header */}
            <div className="px-6 pt-12 pb-4 sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b border-gray-50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Messages</h1>
                        <p className="text-sm text-gray-400 font-medium">Connect with your cleaners</p>
                    </div>

                    {totalUnread > 0 && (
                        <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/20">
                            <span className="text-xs font-bold">{totalUnread} new</span>
                        </div>
                    )}
                </div>

                {/* Minimal Search & Filter */}
                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all placeholder-gray-400"
                        />
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                        {['all', 'unread', 'jobs'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeFilter === filter
                                    ? 'bg-black text-white border-black shadow-md'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversations */}
            <div className="px-4 py-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-20 px-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg mb-2">No messages yet</p>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Start a conversation by booking a cleaner or contacting one from your previous jobs.
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
                            className="w-full p-4 rounded-3xl flex items-center gap-4 hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-xl font-bold">{conv.cleanerName.charAt(0)}</span>
                                </div>
                                {conv.status === 'active' && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-gray-900 truncate group-hover:text-black transition-colors">
                                        {conv.cleanerName}
                                    </h3>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${conv.unreadCount > 0 ? 'text-teal-600' : 'text-gray-400'
                                        }`}>
                                        {formatTime(conv.lastMessageTime)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <p className={`text-sm truncate leading-relaxed ${conv.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-600'
                                        }`}>
                                        {conv.id === '1' ? "I'm on my way!" : conv.lastMessage}
                                    </p>

                                    {conv.unreadCount > 0 && (
                                        <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg shadow-teal-500/30 flex-shrink-0">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300 bg-gray-50 px-2 py-0.5 rounded-md">
                                        {conv.bookingId}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
