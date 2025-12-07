
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs, setDoc, increment, writeBatch } from 'firebase/firestore';
import { Conversation, Message, UserRole } from '../types';
import { moderateMessage } from './aiService';

const CONV_COLLECTION = 'conversations';

// Helper for heuristic checks
const isSoloNumber = (text: string) => /^\d{1,4}$/.test(text.trim());

const hasDistributedPhoneNumber = (text: string, history: Message[], senderId: string): boolean => {
    // Get last 10 messages from this sender
    const senderHistory = history
        .filter(m => m.senderId === senderId)
        .slice(-10)
        .map(m => m.text);
    
    // Combine context
    const fullContext = [...senderHistory, text].join(' ');
    
    // Strip everything except digits
    const digitsOnly = fullContext.replace(/\D/g, '');
    
    // Check for Indian Mobile Number pattern (starts with 6,7,8,9 and followed by 9 digits) inside the stream
    // Using a regex that looks for 10 digit sequences starting with 6-9
    return /[6-9]\d{9}/.test(digitsOnly);
};

export const startConversation = async (
    hostId: string, 
    guestId: string, 
    guestName: string,
    guestAvatar: string,
    hostName: string,
    hostAvatar: string,
    propertyName: string = 'General',
    bookingContext?: {
        bookingId?: string;
        bookingStatus?: 'inquiry' | 'pending' | 'confirmed';
        startDate?: string;
        endDate?: string;
        guestCount?: number;
        totalPrice?: number;
    }
): Promise<string> => {
    try {
        // QUERY: Find any conversation involving this guest
        const q = query(
            collection(db, CONV_COLLECTION), 
            where('participants', 'array-contains', guestId)
        );
        const snapshot = await getDocs(q);
        
        // STRICT CHECK: Find conversation with specific Host + Guest pair.
        // We ignore propertyId here to enforce "One Chat per Host-Guest" rule.
        const existing = snapshot.docs.find(d => {
            const data = d.data();
            return data.hostId === hostId && data.guestId === guestId;
        });

        if (existing) {
            // Update latest user details and context on the existing thread
            const updates: any = {
                guestName,
                guestAvatar,
                hostName,
                hostAvatar
            };
            
            // CONTEXT SWITCHING:
            if (propertyName !== 'General') {
                 updates.propertyName = propertyName;
            }

            // If a specific booking context is provided (Inquiry/Booking), overwrite the old context
            if (bookingContext) {
                updates.startDate = bookingContext.startDate;
                updates.endDate = bookingContext.endDate;
                updates.guestCount = bookingContext.guestCount;
                if (bookingContext.totalPrice) updates.totalPrice = bookingContext.totalPrice;
                if (bookingContext.bookingStatus) updates.bookingStatus = bookingContext.bookingStatus;
                if (bookingContext.bookingId) updates.bookingId = bookingContext.bookingId;
            }

            await updateDoc(doc(db, CONV_COLLECTION, existing.id), updates);
            return existing.id;
        }

        // CREATE NEW: Only if no chat exists between these two people
        const newConv: Partial<Conversation> = {
            participants: [hostId, guestId],
            hostId, hostName, hostAvatar,
            guestId, guestName, guestAvatar,
            propertyName,
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            unreadCount: 0,
            hostUnreadCount: 0,
            guestUnreadCount: 0,
            ...(bookingContext || {})
        };

        const docRef = await addDoc(collection(db, CONV_COLLECTION), newConv);
        return docRef.id;
    } catch (e) {
        console.error("Error starting conversation", e);
        throw e;
    }
};

export const updateConversationBooking = async (
    conversationId: string,
    bookingData: {
        bookingId?: string;
        bookingStatus?: string;
        startDate?: string;
        endDate?: string;
        guestCount?: number;
        totalPrice?: number;
    }
) => {
    try {
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        await updateDoc(convRef, bookingData);
    } catch (e) {
        console.error("Failed to update conversation booking context", e);
    }
};

export const sendMessage = async (
    conversationId: string, 
    senderId: string, 
    senderRole: UserRole, 
    text: string,
    recentMessages: Message[] = [] // History for moderation context
): Promise<{ success: boolean; reason?: string }> => {
    
    // --- HEURISTIC CHECKS (Local) ---
    
    // 1. Consecutive Solo Numbers Check
    // If current message is a solo number (e.g. "98", "9")
    if (isSoloNumber(text)) {
        // Check previous messages from same sender
        const senderMsgs = recentMessages.filter(m => m.senderId === senderId);
        // We look at the very last 2 messages
        if (senderMsgs.length >= 2) {
            const last1 = senderMsgs[senderMsgs.length - 1];
            const last2 = senderMsgs[senderMsgs.length - 2];
            
            // If the last 2 were also solo numbers, this makes 3 in a row -> BLOCK
            if (isSoloNumber(last1.text) && isSoloNumber(last2.text)) {
                return { 
                    success: false, 
                    reason: "Please stop sending numbers one by one. Write full sentences." 
                };
            }
        }
    }

    // 2. Distributed Phone Number Check
    if (hasDistributedPhoneNumber(text, recentMessages, senderId)) {
        return { 
            success: false, 
            reason: "Phone number detected across multiple messages. Please keep communication on platform." 
        };
    }

    // 3. AI Moderation (Remote)
    const moderation = await moderateMessage(text);
    if (!moderation.safe) {
        return { success: false, reason: moderation.reason };
    }

    // 4. Save Message
    try {
        const messagesRef = collection(db, CONV_COLLECTION, conversationId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            senderRole,
            text,
            timestamp: serverTimestamp(),
            status: 'sent'
        });

        // 5. Update Conversation Last Message & Increment Unread
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        
        // Determine who gets the unread increment
        const isHostSender = senderRole === UserRole.HOST;
        const updateField = isHostSender ? 'guestUnreadCount' : 'hostUnreadCount';
        
        await updateDoc(convRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            [updateField]: increment(1)
        });

        return { success: true };
    } catch (e) {
        console.error("Send message error", e);
        return { success: false, reason: "Network error" };
    }
};

export const markConversationAsRead = async (conversationId: string, userRole: UserRole) => {
    try {
        const batch = writeBatch(db);

        // 1. Reset Conversation Unread Count
        const field = userRole === UserRole.HOST ? 'hostUnreadCount' : 'guestUnreadCount';
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        batch.update(convRef, { [field]: 0 });

        // 2. Mark Messages as Read
        // We look for messages sent by the OTHER person that are not yet read.
        // Assuming 'sent' is the only non-read status for now.
        const otherRole = userRole === UserRole.HOST ? UserRole.GUEST : UserRole.HOST;
        
        const messagesRef = collection(db, CONV_COLLECTION, conversationId, 'messages');
        const q = query(
            messagesRef, 
            where('senderRole', '==', otherRole),
            where('status', '==', 'sent')
        );
        
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'read' });
        });

        await batch.commit();
    } catch (e) {
        console.error("Failed to mark as read", e);
    }
};

export const subscribeToConversations = (userId: string, callback: (convs: Conversation[]) => void) => {
    // We fetch all where user is a participant. 
    // Sorting happens client-side to avoid complex composite indexes during development.
    const q = query(
        collection(db, CONV_COLLECTION),
        where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        // Client-side sort: Newest first
        convs.sort((a, b) => {
            const tA = a.lastMessageTime?.seconds || 0;
            const tB = b.lastMessageTime?.seconds || 0;
            return tB - tA;
        });
        callback(convs);
    });
};

export const subscribeToMessages = (conversationId: string, callback: (msgs: Message[]) => void) => {
    const q = query(
        collection(db, CONV_COLLECTION, conversationId, 'messages'),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                // Convert Firestore timestamp to Date string/object for UI
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
            } as Message;
        });
        callback(msgs);
    });
};
