
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserRole } from '../types';
import { subscribeToConversations, subscribeToMessages, sendMessage, markConversationAsRead } from '../services/chatService';
import { Send, Search, MoreVertical, AlertTriangle, CheckCircle, Loader2, Calendar, Users, MapPin, Check, CheckCheck } from 'lucide-react';

interface MessagesProps {
    currentUserId?: string;
    userRole?: UserRole;
}

export const Messages: React.FC<MessagesProps> = ({ currentUserId = 'guest_user_1', userRole = UserRole.GUEST }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [moderationError, setModerationError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to Conversations List
    useEffect(() => {
        if (!currentUserId) return;
        const unsubscribe = subscribeToConversations(currentUserId, (data) => {
            // DEDUPLICATION LOGIC:
            const uniqueMap = new Map<string, Conversation>();
            
            data.forEach(conv => {
                const otherId = userRole === UserRole.HOST ? conv.guestId : conv.hostId;
                if (!uniqueMap.has(otherId)) {
                    uniqueMap.set(otherId, conv);
                }
            });
            
            const uniqueConvs = Array.from(uniqueMap.values());
            setConversations(uniqueConvs);

            if (!activeConvId && uniqueConvs.length > 0) {
                setActiveConvId(uniqueConvs[0].id);
            }
        });
        return () => unsubscribe();
    }, [currentUserId, userRole]);

    // Subscribe to Active Conversation Messages
    useEffect(() => {
        if (!activeConvId) return;

        const unsubscribe = subscribeToMessages(activeConvId, (data) => {
            setMessages(data);
            
            // Real-time Read Receipts: 
            // If we receive unread messages from the other person while looking at the chat, mark them as read immediately.
            const hasUnread = data.some(m => m.senderRole !== userRole && m.status !== 'read');
            if (hasUnread) {
                 markConversationAsRead(activeConvId, userRole);
            }

            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        return () => unsubscribe();
    }, [activeConvId, userRole]);

    const activeConversation = conversations.find(c => c.id === activeConvId);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeConvId) return;
        setModerationError(null);
        setIsSending(true);

        // Pass messages for context-aware moderation (Rule 1 & Rule 2)
        const result = await sendMessage(activeConvId, currentUserId, userRole, inputText, messages);
        
        if (!result.success) {
            setModerationError(result.reason || "Failed to send");
        } else {
            setInputText('');
        }
        setIsSending(false);
    };

    const getDisplayInfo = (conv: Conversation) => {
        if (userRole === UserRole.HOST) {
            return { name: conv.guestName, avatar: conv.guestAvatar, role: 'Guest' };
        } else {
            return { name: conv.hostName, avatar: conv.hostAvatar, role: 'Host' };
        }
    };

    const getUnreadCount = (conv: Conversation) => {
        return userRole === UserRole.HOST ? conv.hostUnreadCount : conv.guestUnreadCount;
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden animate-fadeIn">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input 
                            placeholder="Search..." 
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No messages yet.</div>
                    ) : (
                        conversations.map(conv => {
                            const info = getDisplayInfo(conv);
                            const unread = getUnreadCount(conv) || 0;
                            return (
                                <div 
                                    key={conv.id}
                                    onClick={() => setActiveConvId(conv.id)}
                                    className={`p-4 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${activeConvId === conv.id ? 'bg-white dark:bg-gray-800 border-l-4 border-l-brand-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={info.avatar || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full object-cover" alt={info.name} />
                                                {unread > 0 && activeConvId !== conv.id && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold ${activeConvId === conv.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${unread > 0 && activeConvId !== conv.id ? 'font-extrabold text-black dark:text-white' : ''}`}>{info.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{conv.propertyName}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{typeof conv.lastMessageTime === 'string' ? conv.lastMessageTime : 'Just now'}</span>
                                    </div>
                                    <p className={`text-sm line-clamp-1 pl-[52px] ${unread > 0 && activeConvId !== conv.id ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {conv.lastMessage || 'Started a conversation'}
                                    </p>
                                    
                                    {/* Mini Context Badge */}
                                    {conv.bookingStatus && (
                                        <div className="pl-[52px] mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                                conv.bookingStatus === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 
                                                conv.bookingStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' : 
                                                'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {conv.bookingStatus === 'pending' ? 'Request' : conv.bookingStatus}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            {activeConversation ? (
                <div className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* Header */}
                    <div className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden p-2 -ml-2" onClick={() => setActiveConvId(null)}>
                                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <img src={getDisplayInfo(activeConversation).avatar || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{getDisplayInfo(activeConversation).name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span>{userRole === UserRole.HOST ? 'Guest' : 'Host'}</span>
                                        {activeConversation.propertyName && <span>• {activeConversation.propertyName}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><MoreVertical className="w-5 h-5"/></button>
                            </div>
                        </div>

                        {/* Booking Context Bar */}
                        {(activeConversation.startDate || activeConversation.bookingStatus) && (
                            <div className="px-4 pb-4 animate-slideUp">
                                <div className={`rounded-xl p-3 border flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-sm ${
                                    activeConversation.bookingStatus === 'confirmed' 
                                        ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900' 
                                        : activeConversation.bookingStatus === 'pending' 
                                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                 activeConversation.bookingStatus === 'confirmed' ? 'text-green-700 dark:text-green-400' : 
                                                 activeConversation.bookingStatus === 'pending' ? 'text-yellow-700 dark:text-yellow-400' :
                                                 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {activeConversation.bookingStatus === 'confirmed' ? 'Upcoming Trip' : 
                                                 activeConversation.bookingStatus === 'pending' ? 'Booking Request' : 'Inquiry'}
                                            </span>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white mt-0.5">
                                                {activeConversation.propertyName || 'Property'}
                                            </span>
                                        </div>
                                        {activeConversation.startDate && (
                                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
                                        )}
                                        {activeConversation.startDate && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span>{activeConversation.startDate} - {activeConversation.endDate}</span>
                                            </div>
                                        )}
                                        {activeConversation.guestCount && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Users className="w-4 h-4" />
                                                <span>{activeConversation.guestCount} guests</span>
                                            </div>
                                        )}
                                    </div>
                                    {activeConversation.totalPrice && (
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Total Price</span>
                                            <span className="font-bold text-gray-900 dark:text-white">₹{activeConversation.totalPrice.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-black/20">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] ${msg.senderId === currentUserId ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`px-5 py-3 rounded-2xl text-sm ${
                                        msg.senderId === currentUserId 
                                        ? 'bg-brand-600 text-white rounded-tr-sm' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-1">
                                        <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                                        {msg.senderId === currentUserId && (
                                            <>
                                                {msg.status === 'read' ? (
                                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                                ) : (
                                                    <Check className="w-3 h-3 text-gray-400" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        {moderationError && (
                            <div className="mb-3 flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {moderationError}
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <input 
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-brand-500 dark:focus:border-brand-500 rounded-xl px-4 py-3 outline-none transition-all text-gray-900 dark:text-white"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button 
                                onClick={handleSendMessage} 
                                disabled={isSending || !inputText.trim()}
                                className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-xl disabled:opacity-50 transition-colors"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Messages are monitored for safety
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
            )}
        </div>
    );
};
