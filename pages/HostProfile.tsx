
import React, { useState } from 'react';
import { HostProfile } from '../types';
import { Star, ShieldCheck, MapPin, Globe, Clock, Award, Camera, Save, ChevronLeft, X, Send, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { moderateMessage } from '../services/aiService';
import { startConversation, sendMessage } from '../services/chatService';
import { UserRole } from '../types';

interface HostProfileProps {
    profile: HostProfile;
    isEditable?: boolean;
    onSave?: (profile: HostProfile) => void;
    onBack?: () => void;
    currentUserId?: string;
    currentUserName?: string;
    currentUserAvatar?: string;
}

export const HostProfilePage: React.FC<HostProfileProps> = ({ 
    profile, 
    isEditable = false, 
    onSave, 
    onBack, 
    currentUserId = 'guest_user_1',
    currentUserName = 'Guest',
    currentUserAvatar = 'https://via.placeholder.com/100'
}) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<HostProfile>(profile);
    
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [moderationStatus, setModerationStatus] = useState<'idle' | 'checking' | 'safe' | 'unsafe'>('idle');
    const [moderationReason, setModerationReason] = useState('');

    const handleSave = () => {
        if (onSave) onSave(formData);
        setEditMode(false);
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        setModerationStatus('checking');
        
        const result = await moderateMessage(messageText);
        
        if (result.safe) {
            setModerationStatus('safe');
            try {
                const convId = await startConversation(
                    profile.id, 
                    currentUserId, 
                    currentUserName || 'Guest', 
                    currentUserAvatar || '', 
                    profile.name, 
                    profile.avatar,
                    'General Inquiry'
                );
                await sendMessage(convId, currentUserId, UserRole.GUEST, messageText);

                setTimeout(() => {
                    setMessageModalOpen(false);
                    setMessageText('');
                    setModerationStatus('idle');
                }, 1500);
            } catch (e) {
                setModerationStatus('idle');
                alert("Failed to send message. Try again.");
            }
        } else {
            setModerationStatus('unsafe');
            setModerationReason(result.reason);
        }
    };

    if (isEditable && editMode) {
        return (
            <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={() => setEditMode(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Cancel</button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={formData.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md" />
                            <div className="absolute bottom-0 right-0 p-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full cursor-pointer hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                            <input 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea 
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none min-h-[120px] dark:text-white"
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Languages (comma separated)</label>
                        <input 
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                            value={formData.languages.join(', ')}
                            onChange={(e) => setFormData({...formData, languages: e.target.value.split(',').map(s => s.trim())})}
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fadeIn relative pb-24">
            {onBack && (
                <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Back
                </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden sticky top-24">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-full object-cover" />
                                {profile.isSuperhost && (
                                    <div className="absolute bottom-0 right-0 bg-rose-500 text-white p-1.5 rounded-full border-4 border-white dark:border-gray-900 shadow-sm" title="Superhost">
                                        <Award className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {profile.isSuperhost && <span className="font-medium text-gray-900 dark:text-white">Superhost</span>}
                                <span>•</span>
                                <span>Joined {profile.joinedDate}</span>
                            </div>

                            {isEditable && (
                                <button 
                                    onClick={() => setEditMode(true)}
                                    className="w-full py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Star className="w-5 h-5 text-gray-900 dark:text-white" />
                                <span className="font-medium text-gray-900 dark:text-white">{profile.reviewsCount} Reviews</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-gray-900 dark:text-white">Identity Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About {profile.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Globe className="w-6 h-6 text-gray-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Languages spoken</h3>
                                <p className="text-gray-600 dark:text-gray-300">{profile.languages.join(', ')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Clock className="w-6 h-6 text-gray-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Response time</h3>
                                <p className="text-gray-600 dark:text-gray-300">Responds {profile.responseTime}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-gray-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Response rate</h3>
                                <p className="text-gray-600 dark:text-gray-300">{profile.responseRate}%</p>
                            </div>
                        </div>
                    </div>
                    
                    {!isEditable && (
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                            <button 
                                onClick={() => setMessageModalOpen(true)}
                                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                Message Host
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {messageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transform transition-all scale-100">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white">Message {profile.name}</h3>
                            <button onClick={() => setMessageModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-900">
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    <ShieldCheck className="w-4 h-4 inline mr-1" />
                                    For your safety, never share personal info (email, phone) before booking. Our AI protects you by moderating messages.
                                </p>
                            </div>

                            <textarea 
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-4 resize-none"
                                placeholder={`Hi ${profile.name}, I'm interested in...`}
                                value={messageText}
                                onChange={(e) => { setMessageText(e.target.value); setModerationStatus('idle'); }}
                            />

                            {moderationStatus === 'unsafe' && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Message Blocked</p>
                                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">{moderationReason}</p>
                                    </div>
                                </div>
                            )}

                            {moderationStatus === 'safe' && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Message Sent Successfully</p>
                                </div>
                            )}

                            <button 
                                onClick={handleSendMessage}
                                disabled={!messageText.trim() || moderationStatus === 'checking' || moderationStatus === 'safe'}
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {moderationStatus === 'checking' ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Send Message</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
