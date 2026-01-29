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
    MessageSquare, AlertCircle, Loader, Briefcase
} from 'lucide-react';

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

                // Format conversations for display
                const formattedConvos = convos.map(conv => ({
                    id: conv.id,
                    cleanerId: conv.participantIds?.find(id => id !== user.uid),
                    cleanerName: conv.cleanerName || 'Cleaner',
                    cleanerPhoto: null,
                    lastMessage: conv.lastMessage || 'No messages yet',
                    lastMessageTime: conv.lastMessageTime || conv.createdAt,
                    unreadCount: 0,
                    bookingId: conv.bookingId || 'N/A',
                    serviceType: conv.serviceType || 'Cleaning',
                    status: 'active'
                }));

                setConversations(formattedConvos);
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
    if (selectedConvo) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
                    <button onClick={() => setSelectedConvo(null)} className="p-2 -ml-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 truncate">{selectedConvo.cleanerName}</h2>
                        <p className="text-xs text-gray-500 truncate">
                            {selectedConvo.serviceType} • {selectedConvo.bookingId}
                        </p>
                    </div>

                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    <div className="flex items-center justify-center">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                            Today
                        </span>
                    </div>

                    {messages.map(message => {
                        const isOwn = message.senderId === 'homeowner';
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn
                                        ? 'bg-primary-500 text-white rounded-br-md'
                                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm break-words">{message.text}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'
                                        }`}>
                                        <span className="text-xs">{formatTime(message.timestamp)}</span>
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
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t border-gray-200 px-4 py-3 pb-safe">
                    <div className="flex items-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
                            <Paperclip className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex-1 relative">
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
                                className="w-full px-4 py-2.5 bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                style={{ maxHeight: '100px' }}
                            />
                        </div>

                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`p-2.5 rounded-full flex-shrink-0 transition-colors ${newMessage.trim()
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Conversations List
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
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
            <div className="px-6 py-3 bg-white border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, message or job..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    {['all', 'unread', 'jobs'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === filter
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversations */}
            <div className="divide-y divide-gray-100">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-900 mb-1">No conversations yet</p>
                        <p className="text-sm text-gray-500">Chats with your cleaners will appear here</p>
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
                            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-gray-400" />
                                </div>
                                {conv.status === 'active' && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 rounded-full border-2 border-white" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="font-semibold text-gray-900 truncate">{conv.cleanerName}</h3>
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
                                <p className="text-xs text-gray-400 mt-0.5">{conv.serviceType} • {conv.bookingId}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
