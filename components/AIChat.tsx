
import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToAI, initializeChat, parseAIResponse } from '../services/aiService';
import { ChatMessage, Property, AIAction, UserRole } from '../types';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, ArrowRight, Star, CheckCircle, Calendar, MapPin, LayoutDashboard } from 'lucide-react';

interface AIChatProps {
  context?: string;
  systemInstruction?: string;
  nudgeMessage?: string;
  properties?: Property[];
  onPreview?: (property: Property) => void;
  onBook?: (booking: any) => Promise<void>;
  onAction?: (action: AIAction) => void;
  onEnterDashboard?: () => void;
  mode?: 'floating' | 'fullscreen';
  userRole?: UserRole;
}

// --- Property Card Component for Chat ---
const ChatPropertyCard: React.FC<{ property: Property; onPreview: (p: Property) => void }> = ({ property, onPreview }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg mt-4 mb-6 w-full max-w-md group cursor-pointer hover:ring-2 ring-brand-500 transition-all mx-auto md:mx-0">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm">
             <Star className="w-3 h-3 text-orange-400 fill-orange-400" /> 4.8
        </div>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1">
             <MapPin className="w-3 h-3" /> {property.city}
        </div>
      </div>
      <div className="p-5">
        <h4 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">{property.title}</h4>
        <div className="flex gap-2 mt-2 mb-4">
             {property.amenities.slice(0, 3).map(am => (
                 <span key={am} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">{am}</span>
             ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
          <div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">₹{property.baseWeekdayPrice.toLocaleString()}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
          </div>
          <button 
            onClick={() => onPreview(property)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
             View <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Booking Proposal Card ---
const BookingProposalCard: React.FC<{ proposal: any; onBook?: (b: any) => Promise<void> }> = ({ proposal, onBook }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed'>('idle');

    const handleConfirm = async () => {
        if (!onBook) return;
        setStatus('loading');
        try {
            await onBook({ ...proposal, thumbnail: 'https://via.placeholder.com/150' });
            setStatus('confirmed');
        } catch (e) {
            setStatus('idle');
            alert('Booking failed. Try again.');
        }
    };

    if (status === 'confirmed') {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-6 mt-4 mb-4 max-w-md flex flex-col items-center text-center mx-auto md:mx-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-green-800 dark:text-green-300 text-lg">Trip Confirmed!</h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">Pack your bags for {proposal.propertyName}.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-brand-200 dark:border-brand-900 shadow-xl mt-4 mb-4 max-w-md overflow-hidden mx-auto md:mx-0">
            <div className="bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/40 dark:to-gray-800 p-4 border-b border-brand-100 dark:border-brand-800 flex items-center gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-800 rounded-lg text-brand-600 dark:text-brand-300"><Calendar className="w-5 h-5" /></div>
                <h4 className="font-bold text-brand-900 dark:text-brand-100">Ready to book?</h4>
            </div>
            <div className="p-5 space-y-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{proposal.propertyName || 'Property'}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Check-in</span>
                        <div className="font-medium text-gray-900 dark:text-white">{proposal.startDate}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Check-out</span>
                        <div className="font-medium text-gray-900 dark:text-white">{proposal.endDate}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center px-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{proposal.guests} Guests</span>
                    <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">₹{proposal.totalPrice.toLocaleString()}</span>
                </div>
                <button 
                    onClick={handleConfirm}
                    disabled={status === 'loading'}
                    className="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reservation'}
                </button>
            </div>
        </div>
    );
};

const FormattedMessage = ({ text, properties, onPreview, onBook }: { text: string, properties?: Property[], onPreview?: (p: Property) => void, onBook?: (b: any) => Promise<void> }) => {
  const parts = text.split(/(\[PROPERTY: .+?\]|\[BOOKING_INTENT: .+?\])/g);

  return (
    <div className="text-[15px] leading-relaxed">
      {parts.map((part, index) => {
        const propMatch = part.match(/^\[PROPERTY: (.+?)\]$/);
        if (propMatch && properties && onPreview) {
          const propertyId = propMatch[1];
          const property = properties.find(p => p.id === propertyId);
          return property ? <ChatPropertyCard key={index} property={property} onPreview={onPreview} /> : null;
        }

        const bookingMatch = part.match(/^\[BOOKING_INTENT: (.+?)\]$/);
        if (bookingMatch) {
            try {
                return <BookingProposalCard key={index} proposal={JSON.parse(bookingMatch[1])} onBook={onBook} />;
            } catch (e) { return null; }
        }
        
        const lines = part.split('\n');
        return (
            <div key={index}>
                {lines.map((line, i) => {
                    if (!line.trim()) return <br key={i}/>;
                    if (line.trim().startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-gray-400 mb-1">{line.replace('- ', '')}</li>;
                    if (line.includes('**')) {
                        const chunks = line.split('**');
                        return <p key={i} className="mb-2">{chunks.map((c, j) => j % 2 === 1 ? <strong key={j} className="text-gray-900 dark:text-white font-bold">{c}</strong> : c)}</p>;
                    }
                    return <p key={i} className="mb-2">{line}</p>;
                })}
            </div>
        );
      })}
    </div>
  );
};

export const AIChat: React.FC<AIChatProps> = ({ 
    context, 
    systemInstruction, 
    nudgeMessage, 
    properties, 
    onPreview, 
    onBook, 
    onAction, 
    onEnterDashboard,
    mode = 'floating',
    userRole = UserRole.GUEST
}) => {
  const [isOpen, setIsOpen] = useState(mode === 'fullscreen');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current || messages.length === 0) {
        if (mode === 'fullscreen' && messages.length === 0) {
            // Zero State handles greeting
        } else {
            setMessages([{
                id: 'init',
                role: 'model',
                text: systemInstruction?.includes('HOST') ? 'Ready to assist.' : 'How can I help you plan your trip?',
                timestamp: new Date()
            }]);
        }
        initializeChat(systemInstruction);
        hasInitialized.current = true;
    }
  }, [systemInstruction, mode]);

  useEffect(() => {
      if (nudgeMessage) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: nudgeMessage!, timestamp: new Date() }]);
      }
  }, [nudgeMessage]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const prompt = context ? `[Current Context: ${context}] ${textToSend}` : textToSend;
    const rawResponse = await sendMessageToAI(prompt, systemInstruction);
    const { text, actions } = parseAIResponse(rawResponse);

    if (actions.length > 0 && onAction) actions.forEach(onAction);

    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  // --- FULLSCREEN MODE (ALL ROLES) ---
  if (mode === 'fullscreen') {
      const isZeroState = messages.length === 0;
      
      // Dynamic Role Config
      const roleConfig = {
          [UserRole.HOST]: {
              title: "Welcome back, Host.",
              subtitle: "I've analyzed your portfolio. What would you like to do?",
              prompts: ["How is my revenue this month?", "Edit Saffron Villa listing", "Check calendar availability", "Go to my dashboard"]
          },
          [UserRole.GUEST]: {
              title: "Where to next?",
              subtitle: "I'm your AI concierge. Tell me what you're dreaming of, and I'll find the perfect stay.",
              prompts: ["Plan a weekend in Lonavala for 6", "Find a pet-friendly villa with a pool", "Show me luxury heritage stays in Jaipur", "Budget trip to Goa"]
          },
          [UserRole.SERVICE_PROVIDER]: {
              title: "Ready for work?",
              subtitle: "I can help you find tasks, report issues, or manage your schedule.",
              prompts: ["Show today's cleaning tasks", "Mark Saffron Villa as cleaned", "Report maintenance issue", "Check my earnings"]
          }
      }[userRole];

      return (
          <div className="flex flex-col h-full w-full relative bg-white dark:bg-gray-950">
              {/* Top Bar for Fullscreen */}
              <div className="absolute top-0 right-0 p-6 z-50">
                  {onEnterDashboard && (
                      <button 
                        onClick={onEnterDashboard}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold text-gray-900 dark:text-white"
                      >
                          <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                      </button>
                  )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
                  <div className="max-w-4xl mx-auto w-full">
                  {isZeroState ? (
                      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-8 animate-fadeIn">
                          <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-4">
                              <Sparkles className="w-10 h-10 text-brand-600 dark:text-brand-400" />
                          </div>
                          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                              {roleConfig.title}
                          </h1>
                          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg">
                              {roleConfig.subtitle}
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                              {roleConfig.prompts.map((prompt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => prompt.includes('dashboard') && onEnterDashboard ? onEnterDashboard() : handleSend(prompt)}
                                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all text-left text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center justify-between group"
                                  >
                                      {prompt}
                                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                                  </button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-8 py-10">
                          {messages.map((msg) => (
                              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  {msg.role === 'model' && (
                                      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                          <Sparkles className="w-4 h-4 text-white" />
                                      </div>
                                  )}
                                  <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl px-5 py-3 text-gray-900 dark:text-white font-medium' : 'text-gray-800 dark:text-gray-200'}`}>
                                      {msg.role === 'user' ? (
                                          msg.text
                                      ) : (
                                          <FormattedMessage text={msg.text} properties={properties} onPreview={onPreview} onBook={onBook} />
                                      )}
                                  </div>
                              </div>
                          ))}
                          {isLoading && (
                              <div className="flex gap-4">
                                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  </div>
                                  <div className="text-gray-400 dark:text-gray-500 text-sm py-2 animate-pulse">Thinking...</div>
                              </div>
                          )}
                          <div ref={messagesEndRef} />
                      </div>
                  )}
                  </div>
              </div>

              {/* Sticky Input Bar */}
              <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-50">
                  <div className="w-full max-w-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-[2rem] shadow-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-2 ring-brand-500/50">
                      <div className="pl-4">
                          <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                      </div>
                      <input 
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 px-2 py-3 text-base"
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:scale-90 shadow-md"
                      >
                          <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- FLOATING MODE (DASHBOARD ASSISTANT) ---
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none font-sans">
      <div 
        className={`bg-white dark:bg-gray-900 shadow-2xl rounded-2xl w-[calc(100vw-2rem)] sm:w-[28rem] mb-4 overflow-hidden transition-all duration-300 ease-in-out pointer-events-auto border border-gray-100 dark:border-gray-800 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 h-0'}`}
        style={{ maxHeight: 'calc(80vh - 100px)', display: isOpen ? 'flex' : 'none', flexDirection: 'column' }}
      >
        <div className="bg-white dark:bg-gray-900 p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3">
             <Bot className="w-5 h-5 text-brand-600 dark:text-brand-400" />
             <span className="font-bold text-gray-900 dark:text-white">AI Assistant</span>
           </div>
           <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
             {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}>
                        {msg.role === 'user' ? msg.text : <FormattedMessage text={msg.text} properties={properties} />}
                    </div>
                </div>
             ))}
             {isLoading && <div className="text-xs text-gray-400 pl-2">AI is thinking...</div>}
             <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                <input 
                    className="bg-transparent flex-1 outline-none text-sm text-gray-900 dark:text-white"
                    placeholder="Ask..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={() => handleSend()}><Send className="w-4 h-4 text-brand-600" /></button>
            </div>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 pointer-events-auto flex items-center gap-2"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};
