import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToAI, initializeChat, parseAIResponse } from '../services/aiService';
import { ChatMessage, Property, AIAction, UserRole } from '../types';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, ArrowRight, Star, CheckCircle, Calendar, MapPin, LayoutDashboard, Zap, AlertTriangle } from 'lucide-react';

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
    <div className="glass-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl mt-4 mb-6 w-full max-w-sm group cursor-pointer transition-all duration-300 mx-auto md:mx-0 border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900">
      <div className="h-40 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        
        {/* Animated Guest Favorite Badge */}
        {(property.rating || 0) >= 4.8 && (
            <div className="absolute top-3 right-3 overflow-hidden rounded-full bg-white/90 dark:bg-black/80 backdrop-blur shadow-sm border border-white/20 z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200/50 dark:via-gold-400/20 to-transparent -translate-x-full animate-shimmer" />
                <div className="relative px-2.5 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold-500 fill-gold-500" /> 
                    <span className="text-[10px] font-bold text-gray-900 dark:text-white">Guest favorite</span>
                </div>
            </div>
        )}

      </div>
      <div className="p-5">
        <h4 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">{property.title}</h4>
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
             {property.amenities.slice(0, 3).map(am => (
                 <span key={am} className="text-[10px] font-semibold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{am}</span>
             ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5">
          <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">₹{property.baseWeekdayPrice?.toLocaleString() || '0'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400"> / night</span>
          </div>
          <button 
            onClick={() => onPreview(property)}
            className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
             View <ArrowRight className="w-3 h-3" />
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
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-3xl p-6 mt-4 mb-4 max-w-sm flex flex-col items-center text-center mx-auto md:mx-0">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">Trip Confirmed!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Pack your bags for {proposal.propertyName}.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl mt-4 mb-4 max-w-sm overflow-hidden mx-auto md:mx-0">
            <div className="bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-gray-900 p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-xl text-brand-600 dark:text-brand-300"><Calendar className="w-5 h-5" /></div>
                <h4 className="font-bold text-gray-900 dark:text-white">Ready to book?</h4>
            </div>
            <div className="p-5 space-y-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{proposal.propertyName || 'Property'}</div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Check-in</span>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{proposal.startDate}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Check-out</span>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{proposal.endDate}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{proposal.guests} Guests</span>
                    <span className="text-xl font-bold text-brand-600 dark:text-brand-400">₹{proposal.totalPrice?.toLocaleString() || '0'}</span>
                </div>
                <button 
                    onClick={handleConfirm}
                    disabled={status === 'loading'}
                    className="w-full mt-2 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reservation'}
                </button>
            </div>
        </div>
    );
};

const FormattedMessage = ({ text, properties, onPreview, onBook }: { text: string, properties?: Property[], onPreview?: (p: Property) => void, onBook?: (b: any) => Promise<void> }) => {
  const parts = text.split(/(\[PROPERTY: .+?\]|\[BOOKING_INTENT: .+?\])/g);
  const isDemo = text.includes('Offline Demo Mode');

  return (
    <div className="text-[15px] leading-relaxed relative">
      {isDemo && (
          <div className="absolute -top-3 right-0">
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> DEMO
              </span>
          </div>
      )}
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
      
      const roleConfig = {
          [UserRole.HOST]: {
              title: "Welcome back, Host.",
              subtitle: "I've analyzed your portfolio. What would you like to do?",
              prompts: ["Analyze my revenue trends", "Update Saffron Villa pricing", "Show upcoming bookings", "Go to Dashboard"]
          },
          [UserRole.GUEST]: {
              title: "Where to next?",
              subtitle: "I'm your AI concierge. Tell me what you're dreaming of.",
              prompts: ["Luxury villa in Lonavala for 6", "Pet-friendly stays with a pool", "Weekend getaway near Mumbai", "Budget homes in Jaipur"]
          },
          [UserRole.SERVICE_PROVIDER]: {
              title: "Field Ops",
              subtitle: "Ready to manage tasks and reports.",
              prompts: ["Show today's tasks", "Report maintenance issue", "Check schedule"]
          }
      }[userRole];

      return (
          <div className="flex flex-col h-full w-full relative bg-gray-50 dark:bg-black font-sans">
              {/* Top Bar for Fullscreen */}
              <div className="absolute top-0 right-0 p-6 z-50">
                  {onEnterDashboard && (
                      <button 
                        onClick={onEnterDashboard}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-white/10 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors text-sm font-semibold text-gray-900 dark:text-white"
                      >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                  )}
              </div>

              {/* Message Container - Removed scrollbar-hide to ensure usability on desktop */}
              <div className="flex-1 overflow-y-auto p-4 pb-40">
                  <div className="max-w-3xl mx-auto w-full">
                  {isZeroState ? (
                      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-8 animate-fadeIn">
                          <div className="w-20 h-20 bg-gradient-to-tr from-brand-400 to-gray-500 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-brand-500/30 rotate-3">
                              <Sparkles className="w-10 h-10 text-white" />
                          </div>
                          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400 tracking-tighter">
                              {roleConfig.title}
                          </h1>
                          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg font-light leading-relaxed">
                              {roleConfig.subtitle}
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mt-8">
                              {roleConfig.prompts.map((prompt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => prompt.includes('Dashboard') && onEnterDashboard ? onEnterDashboard() : handleSend(prompt)}
                                    className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-left group"
                                  >
                                      <div className="flex justify-between items-center mb-1">
                                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{prompt}</span>
                                         <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-brand-500" />
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-10 py-10">
                          {messages.map((msg) => (
                              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                                  {msg.role === 'model' && (
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-lg mt-1">
                                          <Sparkles className="w-4 h-4 text-white" />
                                      </div>
                                  )}
                                  <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'bg-gray-100 dark:bg-white/10 rounded-2xl rounded-tr-sm px-6 py-4 text-gray-900 dark:text-white font-medium' : 'text-gray-800 dark:text-gray-200 px-1'}`}>
                                      {msg.role === 'user' ? (
                                          msg.text
                                      ) : (
                                          <FormattedMessage text={msg.text} properties={properties} onPreview={onPreview} onBook={onBook} />
                                      )}
                                  </div>
                              </div>
                          ))}
                          {isLoading && (
                              <div className="flex gap-4 animate-fadeIn">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-lg">
                                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-sm h-8">
                                      <span className="animate-pulse">Thinking</span>
                                      <span className="animate-pulse delay-75">.</span>
                                      <span className="animate-pulse delay-150">.</span>
                                      <span className="animate-pulse delay-300">.</span>
                                  </div>
                              </div>
                          )}
                          <div ref={messagesEndRef} />
                      </div>
                  )}
                  </div>
              </div>

              {/* Minimal Floating Input */}
              {/* pointer-events-none ensures clicking outside input falls through to list below */}
              <div className="absolute bottom-8 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                  {/* pointer-events-auto ensures the input itself works */}
                  <div className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500/50 hover:border-gray-300 dark:hover:border-white/20 pointer-events-auto">
                      <div className="pl-4 pr-2">
                          <Zap className="w-5 h-5 text-brand-500" />
                      </div>
                      <input 
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 px-2 py-3 text-base font-medium"
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="bg-black dark:bg-white hover:opacity-80 text-white dark:text-black p-3 rounded-full transition-all disabled:opacity-50 disabled:scale-90 shadow-md flex items-center justify-center"
                      >
                          <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- FLOATING MODE ---
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none font-sans">
      <div 
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl rounded-3xl w-[calc(100vw-2rem)] sm:w-[26rem] mb-4 overflow-hidden transition-all duration-400 ease-in-out pointer-events-auto border border-white/20 dark:border-white/10 ring-1 ring-black/5 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 h-0'}`}
        style={{ maxHeight: 'calc(80vh - 100px)', display: isOpen ? 'flex' : 'none', flexDirection: 'column' }}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-gray-900 dark:text-white">AI Assistant</span>
           </div>
           <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200'}`}>
                        {msg.role === 'user' ? msg.text : <FormattedMessage text={msg.text} properties={properties} />}
                    </div>
                </div>
             ))}
             {isLoading && <div className="text-xs text-gray-400 pl-2 animate-pulse">Thinking...</div>}
             <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-2xl px-2 py-1 border border-transparent focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <input 
                    className="bg-transparent flex-1 outline-none text-sm text-gray-900 dark:text-white px-2 py-2.5"
                    placeholder="Ask..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={() => handleSend()} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity"><ArrowRight className="w-4 h-4" /></button>
            </div>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-black dark:bg-white hover:scale-105 text-white dark:text-black p-4 rounded-full shadow-2xl transition-all pointer-events-auto flex items-center gap-2 z-50"
      >
        <div className="absolute inset-0 bg-brand-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
        <div className="relative flex items-center justify-center">
            {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </div>
      </button>
    </div>
  );
};