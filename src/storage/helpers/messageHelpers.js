/**
 * ============================================================================
 * MESSAGE/CONVERSATION OPERATIONS
 * ============================================================================
 *
 * Booking-scoped conversation model:
 * - Conversations are STRICTLY tied to bookings
 * - Each booking gets its own unique conversation thread
 * - When a booking is completed/cancelled, the conversation is LOCKED
 *
 * @module storage/helpers/messageHelpers
 */

import { COLLECTIONS, setDoc, getDoc, updateDoc, getDocs, generateId } from '../db.js';
import { canMessageForBookingStatus, isConversationLocked } from './constants.js';

// Lazy import to avoid circular dependency
let getBookingById;
const loadDependencies = async () => {
    if (!getBookingById) {
        const bookingHelpers = await import('./bookingHelpers.js');
        getBookingById = bookingHelpers.getBookingById;
    }
};

/**
 * Create a conversation - MUST be tied to a booking
 * @param {string[]} participantIds - Array of participant user IDs [customerId, cleanerId]
 * @param {Object} metadata - Must include bookingId
 * @returns {Promise<Object>} Created conversation
 * @throws {Error} If bookingId is not provided
 */
export const createConversation = async (participantIds, metadata = {}) => {
    if (!metadata.bookingId) {
        throw new Error('bookingId is required to create a conversation. Conversations must be tied to a booking.');
    }

    const existing = await getConversationForBooking(metadata.bookingId);
    if (existing) {
        console.warn(`Conversation already exists for booking ${metadata.bookingId}, returning existing`);
        return existing;
    }

    const conversation = {
        id: generateId('conv'),
        participantIds,
        bookingId: metadata.bookingId,
        serviceType: metadata.serviceType || 'Cleaning',
        customerName: metadata.customerName || 'Customer',
        cleanerName: metadata.cleanerName || 'Cleaner',
        status: 'active',
        lastMessage: null,
        lastMessageTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    console.log(`Creating new conversation for booking ${metadata.bookingId}`);
    return await setDoc(COLLECTIONS.MESSAGES, conversation.id, conversation);
};

/**
 * Get user's conversations (all conversations they're part of)
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} Array of conversation objects, sorted by recency
 */
export const getUserConversations = async (userId) => {
    const allMessages = await getDocs(COLLECTIONS.MESSAGES);
    const conversations = allMessages.filter(m =>
        m.participantIds && m.participantIds.includes(userId)
    );
    return conversations.sort((a, b) =>
        new Date(b.lastMessageTime || b.createdAt) - new Date(a.lastMessageTime || a.createdAt)
    );
};

/**
 * Get conversation for a specific booking ID
 * This is the PRIMARY way to look up conversations
 * @param {string} bookingId - The booking ID to find conversation for
 * @returns {Promise<Object|null>} The conversation or null if not found
 */
export const getConversationForBooking = async (bookingId) => {
    if (!bookingId || bookingId === 'N/A') return null;

    const allMessages = await getDocs(COLLECTIONS.MESSAGES);
    const conversation = allMessages.find(m =>
        m.participantIds && m.bookingId === bookingId
    );
    return conversation || null;
};

/**
 * Get conversation between two users for a specific booking
 * @deprecated Use getConversationForBooking instead - conversations are booking-scoped
 */
export const getConversation = async (userId1, userId2, bookingId = null) => {
    if (bookingId) {
        return await getConversationForBooking(bookingId);
    }

    console.warn('getConversation called without bookingId - this is deprecated. Use getConversationForBooking instead.');
    const conversations = await getUserConversations(userId1);
    return conversations.find(c => c.participantIds.includes(userId2)) || null;
};

/**
 * Get or create a conversation for a booking
 * This is the RECOMMENDED way to start a conversation
 * @param {string} bookingId - The booking ID
 * @param {string} customerId - The customer (homeowner) ID
 * @param {string} cleanerId - The cleaner ID
 * @param {Object} metadata - Additional metadata (serviceType, names, etc.)
 * @returns {Promise<Object>} The existing or new conversation
 * @throws {Error} If booking doesn't exist or status doesn't allow messaging
 */
export const getOrCreateConversationForBooking = async (bookingId, customerId, cleanerId, metadata = {}) => {
    await loadDependencies();

    if (!bookingId || bookingId === 'N/A') {
        throw new Error('Valid bookingId is required to get or create a conversation');
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
    }

    if (!canMessageForBookingStatus(booking.status)) {
        throw new Error(`Cannot create conversation - booking status is "${booking.status}". Messaging is only available for active bookings.`);
    }

    let conversation = await getConversationForBooking(bookingId);

    if (!conversation) {
        conversation = await createConversation([customerId, cleanerId], {
            bookingId,
            serviceType: metadata.serviceType || booking.serviceType || 'Cleaning',
            customerName: metadata.customerName || 'Customer',
            cleanerName: metadata.cleanerName || 'Cleaner',
        });
    }

    return conversation;
};

/**
 * Get conversation messages
 * @param {string} conversationId - Conversation's unique identifier
 * @returns {Promise<Array>} Array of message objects, sorted chronologically
 */
export const getConversationMessages = async (conversationId) => {
    const allMessages = await getDocs(COLLECTIONS.MESSAGES);
    return allMessages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

/**
 * Send a message - with booking status validation
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender's user ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} The sent message
 * @throws {Error} If conversation is locked (booking completed/cancelled)
 */
export const sendMessage = async (conversationId, senderId, content) => {
    await loadDependencies();

    const conversation = await getDoc(COLLECTIONS.MESSAGES, conversationId);
    if (!conversation || !conversation.participantIds) {
        throw new Error('Conversation not found');
    }

    if (conversation.bookingId && conversation.bookingId !== 'N/A') {
        const booking = await getBookingById(conversation.bookingId);
        if (booking && isConversationLocked(booking.status)) {
            throw new Error(`Cannot send message - booking is "${booking.status}". This conversation is locked.`);
        }
    }

    if (conversation.status === 'closed') {
        throw new Error('This conversation is closed. No new messages can be sent.');
    }

    const message = {
        id: generateId('msg'),
        conversationId,
        senderId,
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
    };

    await setDoc(COLLECTIONS.MESSAGES, message.id, message);

    await updateDoc(COLLECTIONS.MESSAGES, conversationId, {
        lastMessage: content,
        lastMessageTime: message.createdAt,
    });

    return message;
};

/**
 * Lock a conversation when booking is completed/cancelled
 * @param {string} bookingId - The booking ID whose conversation should be locked
 * @returns {Promise<void>}
 */
export const lockConversationForBooking = async (bookingId) => {
    const conversation = await getConversationForBooking(bookingId);
    if (conversation) {
        await updateDoc(COLLECTIONS.MESSAGES, conversation.id, {
            status: 'closed',
            closedAt: new Date().toISOString(),
        });
        console.log(`Locked conversation for booking ${bookingId}`);
    }
};

/**
 * Mark message as read
 * @param {string} messageId - Message's unique identifier
 * @returns {Promise<Object>} Updated message object
 */
export const markMessageAsRead = async (messageId) => {
    return await updateDoc(COLLECTIONS.MESSAGES, messageId, {
        status: 'read',
        readAt: new Date().toISOString(),
    });
};

/**
 * Get unread message count for user
 * @param {string} userId - User's ID
 * @returns {Promise<number>} Count of unread messages
 */
export const getUnreadMessageCount = async (userId) => {
    const conversations = await getUserConversations(userId);
    let count = 0;

    for (const conv of conversations) {
        const messages = await getConversationMessages(conv.id);
        count += messages.filter(m =>
            m.senderId !== userId && m.status !== 'read'
        ).length;
    }

    return count;
};
