

import { db } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { Conversation, Message, UserRole } from '../types';
import { moderateMessage } from './aiService';

const CONV_COLLECTION = 'conversations';

export const startConversation = async (
    hostId: string, 
    guestId: string, 
    guestName: string,
    guestAvatar: string,
    hostName: string,
    hostAvatar: string,
    propertyName: string = 'General'
): Promise<string> => {
    try {
        // Check if conversation exists
        const q = query(
            collection(db, CONV_COLLECTION), 
            where('participants', 'array-contains', guestId)
        );
        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(d => {
            const data = d.data();
            return data.hostId === hostId && data.guestId === guestId;
        });

        if (existing) return existing.id;

        // Create new
        const newConv: Partial<Conversation> = {
            participants: [hostId, guestId],
            hostId, hostName, hostAvatar,
            guestId, guestName, guestAvatar,
            propertyName,
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            unreadCount: 0
        };

        const docRef = await addDoc(collection(db, CONV_COLLECTION), newConv);
        return docRef.id;
    } catch (e) {
        console.error("Error starting conversation", e);
        throw e;
    }
};

export const sendMessage = async (
    conversationId: string, 
    senderId: string, 
    senderRole: UserRole, 
    text: string
): Promise<{ success: boolean; reason?: string }> => {
    // 1. AI Moderation
    const moderation = await moderateMessage(text);
    if (!moderation.safe) {
        return { success: false, reason: moderation.reason };
    }

    // 2. Save Message
    try {
        const messagesRef = collection(db, CONV_COLLECTION, conversationId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            senderRole,
            text,
            timestamp: serverTimestamp(),
            status: 'sent'
        });

        // 3. Update Conversation Last Message
        const convRef = doc(db, CONV_COLLECTION, conversationId);
        await updateDoc(convRef, {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            // In a real app, increment unread for the other user
        });

        return { success: true };
    } catch (e) {
        console.error("Send message error", e);
        return { success: false, reason: "Network error" };
    }
};

export const subscribeToConversations = (userId: string, callback: (convs: Conversation[]) => void) => {
    // FIXED: Removed orderBy to avoid index error. Sorting done client-side.
    const q = query(
        collection(db, CONV_COLLECTION),
        where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        // Sort client-side
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