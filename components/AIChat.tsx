import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToAI, initializeChat } from '../services/aiService';
import { ChatMessage, Property, Booking } from '../types';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, ArrowRight, Star, Calendar, CheckCircle } from 'lucide-react';

interface AIChatProps {
  context?: string;
  systemInstruction?: string;
  nudgeMessage?: string;
  properties?: Property[];
  onPreview?: (property: Property) => void;
  onBook?: (booking: any) => Promise<void>;
}

interface ChatPropertyCardProps {
  property: Property;
  onPreview: (p: Property) => void;
}

// --- Property Card Component for Chat ---
const ChatPropertyCard: React.FC<ChatPropertyCardProps> = ({ property, onPreview }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm mt-2 mb-2 max-w-xs group cursor-pointer hover:shadow-md transition-all" onClick={() => onPreview(property)}>
      <div className="h-32 bg-gray-200 relative">
        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-bold text-gray-800 shadow-sm">
             <Star className="w-3 h-3 text-orange-400 fill-orange-400" /> 4.8
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{property.title}</h4>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-gray-500">{property.city}</div>
          <div className="font-bold text-gray-900 text-sm">₹{property.baseWeekdayPrice}</div>
        </div>
        <button className="w-full mt-3 bg-brand-50 text-brand-700 hover:bg-brand-100 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
           View Details <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// --- Booking Proposal Card ---
interface BookingProposalCardProps {
    proposal: any;
    onBook?: (b: any) => Promise<void>;
}

const BookingProposalCard: React.FC<BookingProposalCardProps> = ({ proposal, onBook }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed'>('idle');

    const handleConfirm = async () => {
        if (!onBook) return;
        setStatus('loading');
        try {
            await onBook({
                ...proposal,
                thumbnail: 'https://via.placeholder.com/150' // AI doesn't pass image usually
            });
            setStatus('confirmed');
        } catch (e) {
            setStatus('idle');
            alert('Booking failed. Try again.');
        }
    };

    if (status === 'confirmed') {
        return (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-2 mb-2 max-w-xs flex flex-col items-center text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-bold text-green-800 text-sm">Booking Confirmed!</h4>
                <p className="text-xs text-green-700 mt-1">Check your dashboard for details.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-brand-200 shadow-md mt-2 mb-2 max-w-xs overflow-hidden">
            <div className="bg-brand-50 p-3 border-b border-brand-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h4 className="font-bold text-brand-900 text-sm">Booking Proposal</h4>
            </div>
            <div className="p-3 space-y-2">
                <div className="text-sm font-semibold text-gray-900">{proposal.propertyName || 'Property'}</div>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Check-in:</span>
                    <span className="font-medium text-gray-900">{proposal.startDate}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Check-out:</span>
                    <span className="font-medium text-gray-900">{proposal.endDate}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Guests:</span>
                    <span className="font-medium text-gray-900">{proposal.guests}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">TOTAL</span>
                    <span className="text-lg font-bold text-brand-600">₹{proposal.totalPrice}</span>
                </div>
                <button 
                    onClick={handleConfirm}
                    disabled={status === 'loading'}
                    className="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Booking'}
                </button>
            </div>
        </div>
    );
};


interface MarkdownTextProps {
  text: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 mb-3 text-gray-700">{[...listBuffer]}</ul>);
      listBuffer = [];
    }
  };

  const parseInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(<li key={`li-${i}`} className="pl-1">{parseInline(trimmed.substring(2))}</li>);
    } else {
      flushList();
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`} className="font-bold text-gray-900 mt-4 mb-2 text-base">{parseInline(trimmed.substring(4))}</h3>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i}`} className="font-bold text-lg text-gray-900 mt-5 mb-2">{parseInline(trimmed.substring(3))}</h2>);
      } else {
        elements.push(<p key={`p-${i}`} className="mb-2 leading-relaxed text-gray-700">{parseInline(trimmed)}</p>);
      }
    }
  });

  flushList();

  return <>{elements}</>;
};

const FormattedMessage = ({ text, properties, onPreview, onBook }: { text: string, properties?: Property[], onPreview?: (p: Property) => void, onBook?: (b: any) => Promise<void> }) => {
  // Regex to detect [PROPERTY: id] tags AND [BOOKING_INTENT: json]
  // Complex regex to match either
  const parts = text.split(/(\[PROPERTY: .+?\]|\[BOOKING_INTENT: .+?\])/g);

  return (
    <div className="text-[14px]">
      {parts.map((part, index) => {
        // Check for Property Tag
        const propMatch = part.match(/^\[PROPERTY: (.+?)\]$/);
        if (propMatch && properties && onPreview) {
          const propertyId = propMatch[1];
          const property = properties.find(p => p.id === propertyId);
          if (property) {
            return <ChatPropertyCard key={index} property={property} onPreview={onPreview} />;
          }
          return null;
        }

        // Check for Booking Intent Tag
        const bookingMatch = part.match(/^\[BOOKING_INTENT: (.+?)\]$/);
        if (bookingMatch) {
            try {
                const proposal = JSON.parse(bookingMatch[1]);
                return <BookingProposalCard key={index} proposal={proposal} onBook={onBook} />;
            } catch (e) {
                console.error("Failed to parse booking proposal", e);
                return null;
            }
        }

        return <MarkdownText key={index} text={part} />;
      })}
    </div>
  );
};


export const AIChat: React.FC<AIChatProps> = ({ context, systemInstruction, nudgeMessage, properties, onPreview, onBook }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Namaste! I am your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevInstructionRef = useRef(systemInstruction);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
      if (systemInstruction !== prevInstructionRef.current) {
          setMessages([{
              id: Date.now().toString(),
              role: 'model',
              text: systemInstruction?.includes('HOST') 
                    ? 'Namaste Host! Ready to manage your portfolio?' 
                    : 'Namaste! Looking for a perfect stay? I can help you book.',
              timestamp: new Date()
          }]);
          initializeChat(systemInstruction);
          prevInstructionRef.current = systemInstruction;
      }
  }, [systemInstruction]);

  useEffect(() => {
      if (nudgeMessage && isOpen) {
          setMessages(prev => {
              if (prev[prev.length - 1].text === nudgeMessage) return prev;
              return [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: nudgeMessage,
                  timestamp: new Date()
              }];
          });
      }
  }, [nudgeMessage, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const promptWithContext = context 
        ? `[Current Context: ${context}] ${input}` 
        : input;

    const aiResponseText = await sendMessageToAI(promptWithContext, systemInstruction);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiResponseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
      <div 
        className={`bg-white shadow-2xl rounded-2xl w-[90vw] sm:w-[28rem] mb-4 overflow-hidden transition-all duration-300 ease-in-out pointer-events-auto border border-gray-100 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 h-0'}`}
        style={{ maxHeight: '650px', display: isOpen ? 'flex' : 'none', flexDirection: 'column' }}
      >
        <div className="bg-white p-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
                <Sparkles className="w-4 h-4" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm">AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-500 font-medium">Online</span>
                </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 h-[400px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'model' && (
                 <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                     <Bot className="w-4 h-4 text-brand-600" />
                 </div>
              )}

              <div 
                className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                    <div className="leading-relaxed">{msg.text}</div>
                ) : (
                    <FormattedMessage 
                        text={msg.text} 
                        properties={properties} 
                        onPreview={onPreview}
                        onBook={onBook}
                    />
                )}
              </div>

              {msg.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                     <User className="w-4 h-4 text-brand-700" />
                 </div>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
               </div>
               <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 text-gray-400 text-xs flex items-center gap-2 shadow-sm">
                 Thinking...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-brand-100 focus-within:bg-white transition-all border border-transparent focus-within:border-brand-200">
            <input 
              type="text" 
              className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
              placeholder={systemInstruction?.includes('GUEST') ? "Ask about amenities, booking..." : "Ask for pricing advice, descriptions..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors p-1"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-xl shadow-brand-200 transition-transform hover:scale-105 active:scale-95 pointer-events-auto flex items-center gap-3 group relative"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        {!isOpen && <span className="font-semibold pr-1">Ask AI</span>}
        
        {nudgeMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
        )}
      </button>
    </div>
  );
};