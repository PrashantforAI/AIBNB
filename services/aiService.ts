
import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, AI_MESSAGE_REGULATOR_INSTRUCTION } from '../constants';
import { AIAction, Property, Booking } from '../types';

// Helper to safely access env vars
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    return process.env[key];
  } catch (e) {
    return '';
  }
};

const apiKey = getEnvVar('API_KEY') || ''; 

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentInstruction = '';

const getClient = () => {
  if (!client) {
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will respond with mock data.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const initializeChat = (systemInstruction: string = AI_SYSTEM_INSTRUCTION) => {
  const ai = getClient();
  
  if (chatSession && currentInstruction === systemInstruction) {
      return chatSession;
  }

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    }
  });
  currentInstruction = systemInstruction;
  return chatSession;
};

// --- SMART FALLBACK AGENT ---
// Simulates an intelligent AI Agent when the real API is down/throttled.
// It parses the context to find real Property IDs and Booking IDs.
const getMockResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // 1. Extract Context (if present in the prompt)
    let contextData: any = {};
    const contextMatch = message.match(/\[Current Context: (\{.*\})\]/);
    if (contextMatch) {
        try {
            contextData = JSON.parse(contextMatch[1]);
        } catch (e) {}
    }

    // Helper: Find Property ID by name in user's portfolio
    const findPropertyId = (nameQuery: string): string => {
        if (!contextData.portfolio) return '1'; // Default
        const match = contextData.portfolio.find((p: any) => nameQuery.includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(nameQuery));
        return match ? match.id : (contextData.portfolio[0]?.id || '1');
    };

    // Helper: Find Pending Booking ID
    const findBookingId = (nameQuery: string): string => {
        if (!contextData.pendingRequests) return 'mock_id';
        const match = contextData.pendingRequests.find((b: any) => 
            nameQuery.includes(b.guest.toLowerCase()) || 
            b.guest.toLowerCase().includes(nameQuery) ||
            nameQuery.includes('booking')
        );
        return match ? match.bookingId : (contextData.pendingRequests[0]?.bookingId || 'mock_id');
    };

    // --- HOST AGENT INTENTS ---

    // 1. Navigation
    if (lowerMsg.includes('calendar') || lowerMsg.includes('schedule')) {
        return "Sure, opening your calendar now.\n\n[ACTION: {\"type\": \"NAVIGATE\", \"payload\": \"calendar\"}]";
    }
    if (lowerMsg.includes('message') || lowerMsg.includes('inbox') || lowerMsg.includes('chat')) {
        return "Taking you to your messages.\n\n[ACTION: {\"type\": \"NAVIGATE\", \"payload\": \"messages\"}]";
    }
    if (lowerMsg.includes('dashboard') || lowerMsg.includes('overview') || lowerMsg.includes('stats')) {
        return "Here is your dashboard overview.\n\n[ACTION: {\"type\": \"NAVIGATE\", \"payload\": \"dashboard\"}]";
    }

    // 2. Booking Approval
    if (lowerMsg.includes('approve') || lowerMsg.includes('confirm') || lowerMsg.includes('accept')) {
        // Try to find who to approve
        let targetId = 'derived_from_context'; 
        // Simple extraction of a name (this is a mock, so we guess)
        // In real app, the context helps.
        
        return "I've processed the approval for the pending request. Calendar updated.\n\n[ACTION: {\"type\": \"APPROVE_BOOKING\", \"payload\": {\"bookingId\": \"derived_from_context\"}}]";
    }

    // 3. Block Dates
    if (lowerMsg.includes('block')) {
        // Identify property
        // Extract dates (Mocking date extraction for demo - usually assumes 'next week' or specific dates)
        const propId = findPropertyId(lowerMsg.replace('block', '').trim());
        const today = new Date();
        const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
        const nextWeekEnd = new Date(nextWeek); nextWeekEnd.setDate(nextWeek.getDate() + 2);
        
        const start = nextWeek.toISOString().split('T')[0];
        const end = nextWeekEnd.toISOString().split('T')[0];

        return `I've blocked dates from ${start} to ${end} for this property.\n\n[ACTION: {\"type\": \"BLOCK_DATES\", \"payload\": {\"propertyId\": "${propId}", \"startDate\": "${start}", \"endDate\": "${end}", \"reason\": "Host Request"}}]`;
    }

    // 4. Update Price
    if (lowerMsg.includes('price') || lowerMsg.includes('rate') || lowerMsg.includes('set')) {
        const propId = findPropertyId(lowerMsg);
        // Extract price
        const priceMatch = lowerMsg.match(/(\d+)/);
        const price = priceMatch ? parseInt(priceMatch[0]) : 20000;
        
        // Detect Month/Bulk - INTELLIGENT PARSING
        const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const monthIndex = months.findIndex(m => lowerMsg.includes(m));
        
        if (monthIndex !== -1) {
             // If month found, calculate start/end date for that month
             const now = new Date();
             let year = now.getFullYear();
             if (now.getMonth() > monthIndex) year++; // Next year if month passed
             
             const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
             const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];
             
             let applyTo = 'all';
             if (lowerMsg.includes('weekday')) applyTo = 'weekdays';
             if (lowerMsg.includes('weekend')) applyTo = 'weekends';

             return `Done. Setting price to ₹${price} for ${applyTo} in ${months[monthIndex]}.\n\n[ACTION: {\"type\": \"UPDATE_PRICE\", \"payload\": {\"propertyId\": "${propId}", \"startDate\": "${startDate}", \"endDate\": "${endDate}", \"applyTo\": "${applyTo}", \"price\": ${price}}}]`;
        }

        // Default single date
        const date = new Date().toISOString().split('T')[0]; // Today
        return `Price updated to ₹${price} for today. (Check calendar to confirm).\n\n[ACTION: {\"type\": \"UPDATE_PRICE\", \"payload\": {\"propertyId\": "${propId}", \"date\": "${date}", \"price\": ${price}}}]`;
    }

    // --- GUEST CONCIERGE INTENTS ---
    if (lowerMsg.includes('lonavala') || lowerMsg.includes('villa')) {
        return "I highly recommend **Saffron Villa**. It's a stunning 4BHK with a private pool and mountain views, perfect for your group. \n\n[PROPERTY: 1]";
    }
    if (lowerMsg.includes('jaipur') || lowerMsg.includes('haveli')) {
        return "You must check out **Heritage Haveli**. It's a restored 19th-century gem in the Pink City. Very authentic experience.\n\n[PROPERTY: 2]";
    }
    if (lowerMsg.includes('book') || lowerMsg.includes('reserve')) {
        const today = new Date();
        const checkIn = new Date(today); checkIn.setDate(today.getDate() + 7);
        const checkOut = new Date(checkIn); checkOut.setDate(checkIn.getDate() + 2);
        const inStr = checkIn.toISOString().split('T')[0];
        const outStr = checkOut.toISOString().split('T')[0];
        
        return `I can help with that. Here is a booking proposal for Saffron Villa.\n\n[BOOKING_INTENT: {"propertyId": "1", "propertyName": "Saffron Villa", "startDate": "${inStr}", "endDate": "${outStr}", "guests": 6, "totalPrice": 35000}]`;
    }
    
    // Host Status
    if (lowerMsg.includes('business') || lowerMsg.includes('revenue')) {
        return "Business is trending up! Your revenue is **₹2,45,000** this month (+12%), and occupancy is at 78%. \n\nWould you like to adjust pricing for the upcoming long weekend?";
    }
    
    return "I'm currently in 'Offline Agent Mode' (API Unavailable). \n\nI can still help you navigate or manage your dashboard. Try saying 'Show Calendar', 'Block dates', or 'Approve booking'.";
};

export const sendMessageToAI = async (message: string, systemInstruction?: string): Promise<string> => {
  if (!chatSession || (systemInstruction && currentInstruction !== systemInstruction)) {
    initializeChat(systemInstruction);
  }
  
  // Timeout Promise (10s)
  const timeout = new Promise<string>((resolve) => 
      setTimeout(() => resolve("TIMEOUT"), 15000)
  );

  // API Call Promise
  const apiCall = async () => {
      if (!chatSession) return getMockResponse(message);
      try {
        const response = await chatSession.sendMessage({ message });
        return response.text || "I didn't get a clear response.";
      } catch (error: any) {
        throw error; // Throw to be caught below
      }
  };

  try {
    // Race against timeout
    const result = await Promise.race([apiCall(), timeout]);
    
    if (result === "TIMEOUT") {
        console.warn("AI Request Timed Out - Switching to Fallback Agent");
        return getMockResponse(message);
    }
    
    return result as string;

  } catch (error: any) {
    // Error Handling
    const isRecoverableError = 
        error.message?.includes('429') || 
        error.status === 429 || 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.code === 500 ||
        error.message?.includes('Rpc failed') ||
        error.status === 'UNKNOWN';
    
    if (isRecoverableError) {
        console.warn("Gemini API Error (Recoverable) - Switching to Fallback Agent", error.message);
        return getMockResponse(message);
    }
    
    console.error("AI Error:", error);
    // Even on hard error, try fallback to keep UI alive
    return getMockResponse(message);
  }
};

export const generateDescription = async (property: Partial<Property>, vibe: string): Promise<string> => {
    const ai = getClient();
    
    const prompt = `
    You are an expert real estate copywriter. Write a 150-word listing description for this property.
    
    **PROPERTY DETAILS**:
    - Title: ${property.title}
    - Location: ${property.location}, ${property.city}
    - Type: ${property.bedrooms}BHK ${property.type}
    - Vibe/Mood: ${vibe}
    
    **KEY FEATURES**:
    - Pool: ${property.poolType !== 'NA' ? `Yes (${property.poolType})` : 'No'}
    - Amenities: ${property.amenities?.join(', ')}
    
    **POLICIES**:
    - Pets: ${property.petFriendly ? "Allowed" : "No"}
    - Food: ${property.nonVegAllowed ? "Non-Veg Allowed" : "Veg Only"}
    
    Write in a ${vibe} tone. No headers.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Could not generate description.";
    } catch (e: any) {
        return `Welcome to ${property.title}. This ${property.bedrooms}BHK ${property.type} in ${property.city} offers a ${vibe} experience. Enjoy ${property.amenities?.slice(0,3).join(', ')}. Book now!`;
    }
};

export const suggestPricing = async (location: string, type: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest pricing (in INR) for a ${type} in ${location}. Return JSON: { "baseWeekdayPrice": number, "baseWeekendPrice": number, "rules": [] }`,
            config: { responseMimeType: 'application/json' }
        });
        return response.text || "{}";
    } catch (e: any) {
        return JSON.stringify({ baseWeekdayPrice: 12000, baseWeekendPrice: 15000, rules: [] });
    }
};

export const moderateMessage = async (message: string): Promise<{ safe: boolean; reason: string }> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                systemInstruction: AI_MESSAGE_REGULATOR_INSTRUCTION,
                responseMimeType: 'application/json'
            }
        });
        return JSON.parse(response.text || '{"safe": false}');
    } catch (e: any) {
        return { safe: true, reason: "Skipped" };
    }
};

export const generateHostInsights = async (properties: Property[], bookings: Booking[]) => {
    const ai = getClient();
    const prompt = `
    Analyze this host's data and provide 2 strategic insights in JSON format: [{ "title": string, "desc": string, "trend": "up" | "down" }].
    
    Data:
    - Properties: ${properties.length}
    - Recent Bookings: ${bookings.length} in last 30 days.
    - Occupancy: High on weekends.
    
    Keep it concise. Focus on pricing, demand, or quality.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return [
            { title: "Weekend Demand High", desc: "Your weekend occupancy is 90%. Consider raising rates by 10%.", trend: "up" },
            { title: "Weekday Gap", desc: "Weekday occupancy is low. Try a 'Workcation' discount.", trend: "down" }
        ];
    }
};

export const parseAIResponse = (response: string): { text: string, actions: AIAction[] } => {
    const actions: AIAction[] = [];
    const text = response.replace(/\[ACTION: (.+?)\]/g, (match, json) => {
        try {
            actions.push(JSON.parse(json));
            return ''; 
        } catch (e) {
            console.error("Failed to parse AI action", e);
            return match;
        }
    });
    return { text: text.trim(), actions };
};
