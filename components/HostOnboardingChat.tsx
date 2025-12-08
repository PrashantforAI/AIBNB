
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Loader2, ArrowRight, Bot, User } from 'lucide-react';
import { callAICore } from '../services/api';
import { Property } from '../types';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface HostOnboardingChatProps {
    onClose: () => void;
    onFinish: (data: Partial<Property>) => void;
}

export const HostOnboardingChat: React.FC<HostOnboardingChatProps> = ({ onClose, onFinish }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [collectedData, setCollectedData] = useState<Partial<Property>>({});
    const [isComplete, setIsComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Initial Greeting from AI
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            handleSend('', true); // Trigger initial AI message
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string, isInit = false) => {
        if (!text.trim() && !isInit) return;

        // 1. Add User Message
        if (!isInit) {
            const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
            setMessages(prev => [...prev, userMsg]);
            setInputText('');
        }

        setIsLoading(true);

        try {
            // 2. Call Backend Agent
            // We pass the history (excluding the current new message which is passed separately if needed by backend, 
            // but typical agent pattern uses full history or just current message + state)
            // Based on previous backend logic, it expects 'message' and 'currentData'.
            const historyText = messages.map(m => `${m.role}: ${m.text}`).join('\n');
            
            const response = await callAICore('host_onboarding_step', {
                message: text,
                currentData: collectedData,
                history: historyText // Optional context
            }, 'host', 'host1');

            if (response.data) {
                const { nextQuestion, updatedData, done } = response.data;

                // 3. Update State
                if (updatedData) {
                    setCollectedData(prev => ({ ...prev, ...updatedData }));
                }

                if (done) {
                    setIsComplete(true);
                    setMessages(prev => [...prev, { 
                        id: (Date.now()+1).toString(), 
                        role: 'model', 
                        text: "Great! I have all the details. You can now review the listing draft and add photos." 
                    }]);
                } else if (nextQuestion) {
                    setMessages(prev => [...prev, { 
                        id: (Date.now()+1).toString(), 
                        role: 'model', 
                        text: nextQuestion 
                    }]);
                }
            } else {
                throw new Error("Invalid response from AI Agent");
            }

        } catch (error) {
            console.error("Onboarding Error:", error);
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                role: 'model', 
                text: "I'm having trouble connecting. Please try again or switch to the manual editor." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-tr from-brand-500 to-purple-600 rounded-lg text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Listing Assistant</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Step-by-step onboarding</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                                    <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                                    <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    {isComplete ? (
                        <button 
                            onClick={() => onFinish(collectedData)}
                            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                        >
                            Review & Publish Listing <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                                placeholder="Type your answer..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                                autoFocus
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => handleSend(inputText)}
                                disabled={!inputText.trim() || isLoading}
                                className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
