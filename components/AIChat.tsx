
import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToAI, initializeChat, parseAIResponse } from '../services/aiService';
import { ChatMessage, Property, AIAction, UserRole } from '../types';
import { Sparkles, Loader2, ArrowRight, Minus, Plus, Mic, Hotel, CheckCircle, Menu, Home, List, Calendar, Settings, LogOut, UserCircle, MessageSquare, RefreshCw, Sun, Moon } from 'lucide-react';
import { CalendarPopup } from './CalendarPopup';
import { getUnavailableDates } from '../services/bookingService';

interface AIChatProps {
  context?: string;
  systemInstruction?: string;
  properties?: Property[];
  onPreview?: (property: Property) => void;
  onBook?: (booking: any) => Promise<void>;
  onAction?: (action: AIAction) => void;
  onEnterDashboard?: () => void; // Used to exit chat mode
  mode?: 'floating' | 'fullscreen';
  userRole?: UserRole;
  userName?: string;
  userAvatar?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  onNavigate?: (page: string) => void; // Navigation handler
  onToggleTheme?: () => void;
  onSwitchRole?: () => void;
  isDarkMode?: boolean;
  showMenuButton?: boolean; // New prop to control header visibility
}

const ChatPropertyCard: React.FC<{ property: Property; onPreview: (p: Property) => void }> = ({ property, onPreview }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 w-full max-w-sm my-2 group cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex h-24">
        <div className="w-24 h-full relative shrink-0">
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{property.title}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="truncate">{property.city}</span>
                </div>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="font-medium text-xs text-gray-900 dark:text-white">₹{property.baseWeekdayPrice?.toLocaleString()} <span className="text-gray-500 font-normal">/ night</span></span>
                <button 
                    onClick={() => onPreview(property)}
                    className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    View
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const BookingProposalCard: React.FC<{ proposal: any; onBook?: (b: any) => Promise<void>; properties?: Property[] }> = ({ proposal, onBook, properties }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed'>('idle');
    const propertyDetails = properties?.find(p => p.id === proposal.propertyId);
    
    // State
    const [checkIn, setCheckIn] = useState(proposal.startDate);
    const [checkOut, setCheckOut] = useState(proposal.endDate);
    const [guests, setGuests] = useState<number>(proposal.guests || 2);
    const [currentPrice, setCurrentPrice] = useState<number>(proposal.totalPrice || 0);
    const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | null>(null);

    const displayTitle = propertyDetails?.title || proposal.propertyName || 'Property';
    const maxGuests = propertyDetails?.maxGuests || 10;
    const unavailableDates = propertyDetails ? getUnavailableDates(propertyDetails) : new Set<string>();

    useEffect(() => {
        if (!propertyDetails || !checkIn || !checkOut) return;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end) { setCurrentPrice(0); return; }

        const days = [];
        let dt = new Date(start);
        while (dt < end) {
            days.push(new Date(dt));
            dt.setDate(dt.getDate() + 1);
        }
        
        let baseTotal = 0;
        days.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            const daySettings = propertyDetails.calendar?.[dateStr];
            
            if (daySettings?.price) {
                baseTotal += daySettings.price;
            } else {
                const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
                baseTotal += isWeekend ? propertyDetails.baseWeekendPrice : propertyDetails.baseWeekdayPrice;
            }
        });
        const extraFee = Math.max(0, guests - propertyDetails.baseGuests) * (propertyDetails.extraGuestPrice || 0) * days.length;
        const fees = Math.round((baseTotal + extraFee) * 0.26); // Taxes
        setCurrentPrice(baseTotal + extraFee + fees);
    }, [checkIn, checkOut, guests, propertyDetails]);

    const handleConfirm = async () => {
        if (!onBook || !checkIn || !checkOut) return;
        setStatus('loading');
        try {
            await onBook({ 
                propertyId: proposal.propertyId,
                propertyName: displayTitle,
                startDate: checkIn,
                endDate: checkOut,
                guests: guests,
                totalPrice: currentPrice,
                thumbnail: propertyDetails?.images[0] 
            });
            setStatus('confirmed');
        } catch (e) { setStatus('idle'); }
    };

    if (status === 'confirmed') return (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center my-2 max-w-sm flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Booking request sent</span>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm my-3 max-w-sm overflow-visible relative z-10 p-4">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Hotel className="w-4 h-4 text-gray-600 dark:text-gray-300"/></div>
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ready to book?</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{displayTitle}</div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 relative">
                    <div onClick={() => setActivePicker('checkIn')} className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer">
                        <label className="text-[9px] text-gray-500 uppercase font-bold block">Check-in</label>
                        <div className="text-xs font-semibold dark:text-white truncate">{checkIn || 'Select'}</div>
                    </div>
                    <div onClick={() => setActivePicker('checkOut')} className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer">
                        <label className="text-[9px] text-gray-500 uppercase font-bold block">Check-out</label>
                        <div className="text-xs font-semibold dark:text-white truncate">{checkOut || 'Select'}</div>
                    </div>
                    {activePicker && (
                        <div className="absolute top-[110%] left-0 right-0 z-50">
                            <CalendarPopup 
                                selectedDate={activePicker === 'checkIn' ? checkIn : checkOut}
                                startDate={checkIn} endDate={checkOut}
                                minDate={activePicker === 'checkOut' ? (checkIn || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}
                                unavailableDates={unavailableDates}
                                onSelect={(d) => {
                                    if (activePicker === 'checkIn') { setCheckIn(d); setActivePicker('checkOut'); } 
                                    else { setCheckOut(d); setActivePicker(null); }
                                }}
                                onClose={() => setActivePicker(null)}
                                className="shadow-xl border border-gray-200 dark:border-gray-700"
                            />
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Minus className="w-3 h-3"/></button>
                        <span className="text-xs font-bold w-4 text-center dark:text-white">{guests}</span>
                        <button onClick={() => setGuests(Math.min(maxGuests, guests + 1))} className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><Plus className="w-3 h-3"/></button>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Total: ₹{currentPrice?.toLocaleString()}</span>
                </div>

                <button onClick={handleConfirm} disabled={status === 'loading'} className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                    {status === 'loading' ? 'Processing...' : 'Confirm Request'}
                </button>
            </div>
        </div>
    );
};

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div>
            {text.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                const bolded = line.split(/(\*\*.*?\*\*)/g).map((chunk, j) => 
                    chunk.startsWith('**') && chunk.endsWith('**') 
                    ? <strong key={j} className="font-semibold text-gray-900 dark:text-white">{chunk.slice(2, -2)}</strong> 
                    : chunk
                );
                return <p key={i} className="mb-1">{bolded}</p>;
            })}
        </div>
    );
};

const FormattedMessage = ({ text, properties, onPreview, onBook, onAction }: { text: string, properties?: Property[], onPreview?: (p: Property) => void, onBook?: (b: any) => Promise<void>, onAction?: (a: AIAction) => void }) => {
  const segments: React.ReactNode[] = [];
  let remaining = text;
  
  const markers = ['[PROPERTY:', '[BOOKING_INTENT:', '[PREVIEW_LISTING:', '[ACTION:'];
  
  while (remaining.length > 0) {
      let firstMarkerIndex = -1;
      let foundMarker = '';
      
      for (const m of markers) {
          const idx = remaining.indexOf(m);
          if (idx !== -1 && (firstMarkerIndex === -1 || idx < firstMarkerIndex)) {
              firstMarkerIndex = idx;
              foundMarker = m;
          }
      }
      
      if (firstMarkerIndex === -1) {
          segments.push(<MarkdownText key={segments.length} text={remaining} />);
          break;
      }
      
      if (firstMarkerIndex > 0) {
          segments.push(<MarkdownText key={segments.length} text={remaining.substring(0, firstMarkerIndex)} />);
      }
      
      let open = 1;
      let endIndex = -1;
      const contentStart = firstMarkerIndex + foundMarker.length;
      
      for (let i = contentStart; i < remaining.length; i++) {
          if (remaining[i] === '[') open++;
          if (remaining[i] === ']') open--;
          if (open === 0) {
              endIndex = i;
              break;
          }
      }
      
      if (endIndex !== -1) {
          const jsonStr = remaining.substring(contentStart, endIndex).trim();
          try {
              if (foundMarker === '[PROPERTY:') {
                  const id = jsonStr.replace(/['"]/g, ''); 
                  const prop = properties?.find(p => p.id === id);
                  if (prop) {
                      segments.push(<ChatPropertyCard key={segments.length} property={prop} onPreview={onPreview!} />);
                  }
              } else if (foundMarker === '[BOOKING_INTENT:') {
                  const data = JSON.parse(jsonStr);
                  segments.push(<BookingProposalCard key={segments.length} proposal={data} onBook={onBook} properties={properties} />);
              } else if (foundMarker === '[ACTION:') {
                   // Hidden from UI
              }
          } catch (e) { console.warn("Error parsing chat component payload", e); }
          remaining = remaining.substring(endIndex + 1);
      } else {
          segments.push(<MarkdownText key={segments.length} text={remaining.substring(firstMarkerIndex, firstMarkerIndex + foundMarker.length)} />);
          remaining = remaining.substring(firstMarkerIndex + foundMarker.length);
      }
  }
  return <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2 leading-relaxed">{segments}</div>;
};

export const AIChat: React.FC<AIChatProps> = ({ 
    context, 
    systemInstruction, 
    properties, 
    onPreview, 
    onBook, 
    onAction, 
    onEnterDashboard,
    mode = 'floating',
    userRole = UserRole.GUEST,
    userName = 'Guest',
    userAvatar,
    isOpen: isOpenProp,
    onToggle,
    onNavigate,
    onToggleTheme,
    onSwitchRole,
    isDarkMode,
    showMenuButton = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(mode === 'fullscreen');
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  
  // Menu State for Fullscreen
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
        if (mode !== 'fullscreen' && messages.length === 0) {
             setMessages([{ id: 'init', role: 'model', text: 'How can I assist you?', timestamp: new Date() }]);
        }
        initializeChat(systemInstruction);
        hasInitialized.current = true;
    }
  }, [systemInstruction, mode]);

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);
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

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    } else {
        alert("Voice input not supported in this browser.");
    }
  };

  const suggestions = userRole === UserRole.HOST 
    ? ["Analyze revenue", "Update pricing", "Show bookings", "Upcoming check-ins"]
    : ["Luxury villa", "Pet-friendly stays", "Weekend ideas", "Budget homes"];

  const handleMenuNavigate = (page: string) => {
      setIsMenuOpen(false);
      if (onEnterDashboard) onEnterDashboard(); // Exit Chat Mode
      if (onNavigate) onNavigate(page); // Go to Page
  };

  // --- MINIMAL FULLSCREEN UI (Google AI Studio Style) ---
  if (mode === 'fullscreen') {
      const isZeroState = messages.length === 0;

      // Define Menu Items based on Role
      const menuItems = userRole === UserRole.HOST ? [
        { id: 'dashboard', icon: Home, label: 'Overview' },
        { id: 'listings', icon: List, label: 'Properties' },
        { id: 'calendar', icon: Calendar, label: 'Calendar' },
        { id: 'messages', icon: MessageSquare, label: 'Messages' },
        { id: 'profile', icon: UserCircle, label: 'Profile' },
        { id: 'settings', icon: Settings, label: 'Settings' },
      ] : [
        { id: 'explore', icon: Home, label: 'Explore' },
        { id: 'trips', icon: Calendar, label: 'Trips' },
        { id: 'messages', icon: MessageSquare, label: 'Inbox' },
        { id: 'profile', icon: UserCircle, label: 'Profile' }
      ];

      return (
          <div className="flex flex-col h-full w-full relative bg-white dark:bg-black font-sans">
              {/* TOP RIGHT HAMBURGER MENU */}
              {showMenuButton && (
                  <div className="absolute top-6 right-6 z-[2000]">
                       <div className="relative">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 p-1 pl-3 pr-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full hover:shadow-md transition-all group relative"
                            >
                                <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
                                {userAvatar ? (
                                    <img src={userAvatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                        {userName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </button>
    
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-[1999]" onClick={() => setIsMenuOpen(false)}></div>
                                    <div className="absolute top-12 right-0 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[2000] animate-fadeIn origin-top-right">
                                        <div className="py-2">
                                            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName || 'User'}</p>
                                                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                                            </div>
                                            {menuItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleMenuNavigate(item.id)}
                                                    className="w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    {item.label}
                                                </button>
                                            ))}
                                            
                                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                                            
                                            {onToggleTheme && (
                                                <button onClick={() => { onToggleTheme(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                                                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                                    Appearance: {isDarkMode ? 'Dark' : 'Light'}
                                                </button>
                                            )}
                                            
                                            {onSwitchRole && (
                                                <button onClick={() => { onSwitchRole(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                                                    <RefreshCw className="w-4 h-4" /> Switch Role
                                                </button>
                                            )}
    
                                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                                            <button className="w-full text-left px-6 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-center gap-3">
                                                <LogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                       </div>
                  </div>
              )}

              {/* Chat Area - Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-4 w-full">
                  <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col justify-center">
                    {isZeroState ? (
                        <div className="flex flex-col items-center justify-center text-center opacity-0 animate-fadeIn my-auto" style={{ animationDelay: '0.1s', opacity: 1 }}>
                            <div className="mb-4">
                                <Sparkles className="w-8 h-8 text-brand-500" />
                            </div>
                            <h1 className="text-3xl font-medium text-gray-900 dark:text-white tracking-tight mb-2">
                                Welcome, <span className="text-brand-600 dark:text-brand-400">{userName}</span>
                            </h1>
                            <p className="text-gray-400 dark:text-gray-500">How can I help you today?</p>
                        </div>
                    ) : (
                        <div className="space-y-10 py-10 w-full">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-1">
                                            <Sparkles className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl px-5 py-3 text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-100 pt-1 leading-relaxed'}`}>
                                        {msg.role === 'user' ? msg.text : <FormattedMessage text={msg.text} properties={properties} onPreview={onPreview} onBook={onBook} onAction={onAction} />}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 animate-pulse">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    </div>
                                    <div className="text-sm text-gray-400 pt-1.5">Thinking...</div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                  </div>
              </div>

              {/* Bottom Input Area - Fixed Footer */}
              <div className="shrink-0 bg-white dark:bg-black pb-8 pt-4 px-4 z-40 w-full">
                  <div className="max-w-3xl mx-auto w-full space-y-3">
                      
                      {/* Suggestions Pills (Above Input) */}
                      {isZeroState && (
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
                              {suggestions.map((prompt, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSend(prompt)}
                                    className="whitespace-nowrap px-4 py-1.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors"
                                  >
                                      {prompt}
                                  </button>
                              ))}
                          </div>
                      )}

                      {/* Clean Input Box */}
                      <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl px-2 py-2 transition-all focus-within:bg-white dark:focus-within:bg-black focus-within:ring-1 focus-within:ring-brand-500/20 shadow-sm">
                          <textarea 
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 px-3 py-3 text-sm resize-none min-h-[48px] max-h-[120px]"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            rows={1}
                            autoFocus
                          />
                          
                          <button
                            onClick={startListening}
                            className={`mb-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
                            title="Voice Chat"
                          >
                              <Mic className="w-5 h-5" />
                          </button>

                          <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="mb-1 w-10 h-10 bg-black dark:bg-white hover:opacity-80 text-white dark:text-black rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                          >
                              <ArrowRight className="w-5 h-5" />
                          </button>
                      </div>
                      <p className="text-[10px] text-center text-gray-400 dark:text-gray-600">
                          AI can make mistakes. Check important info.
                      </p>
                  </div>
              </div>
          </div>
      );
  }

  // --- FLOATING MODE (Sidebar/Modal) ---
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${isOpen ? 'flex' : 'hidden'} md:flex`}>
        {/* Simple Header for Sidebar Mode */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-brand-500" />
             <span className="font-bold text-sm text-gray-900 dark:text-white">AI Assistant</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.length === 0 && (
                 <div className="text-center py-10 text-gray-400 text-sm">
                     <p>How can I help you manage your property today?</p>
                 </div>
             )}
             {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                        {msg.role === 'user' ? msg.text : <FormattedMessage text={msg.text} properties={properties} onAction={onAction} />}
                    </div>
                </div>
             ))}
             {isLoading && <div className="text-xs text-gray-400 pl-1">Thinking...</div>}
             <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-2 py-1 border border-gray-200 dark:border-gray-700">
                <input 
                    className="bg-transparent flex-1 outline-none text-sm text-gray-900 dark:text-white px-2 py-2"
                    placeholder="Message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={() => handleSend()} className="p-1.5 text-gray-500 hover:text-black dark:hover:text-white"><ArrowRight className="w-4 h-4" /></button>
            </div>
        </div>
    </div>
  );
};
