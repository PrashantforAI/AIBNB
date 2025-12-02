

import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, AI_MESSAGE_REGULATOR_INSTRUCTION } from '../constants';
import { AIAction, Property } from '../types';

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

// --- MOCK FALLBACK SYSTEM ---
// Ensures the app works for demo purposes even if API quota is hit (429) or Service Down (500)
const getMockResponse = (message: string, context?: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // Helper to generate a future date string
    const getFutureDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    // Guest/Concierge Scenarios
    if (lowerMsg.includes('lonavala') || lowerMsg.includes('villa')) {
        return "I highly recommend **Saffron Villa**. It's a stunning 4BHK with a private pool and mountain views, perfect for your group. \n\n[PROPERTY: 1]";
    }
    if (lowerMsg.includes('jaipur') || lowerMsg.includes('haveli')) {
        return "You must check out **Heritage Haveli**. It's a restored 19th-century gem in the Pink City. Very authentic experience.\n\n[PROPERTY: 2]";
    }
    if (lowerMsg.includes('book') || lowerMsg.includes('reserve')) {
        const checkIn = getFutureDate(7); // Next week
        const checkOut = getFutureDate(9); // 2 days later
        return `I can help with that. Here is a booking proposal for Saffron Villa.\n\n[BOOKING_INTENT: {"propertyId": "1", "propertyName": "Saffron Villa", "startDate": "${checkIn}", "endDate": "${checkOut}", "guests": 6, "totalPrice": 35000}]`;
    }
    
    // Host Scenarios
    if (lowerMsg.includes('business') || lowerMsg.includes('revenue')) {
        return "Business is trending up! Your revenue is **₹2,45,000** this month (+12%), and occupancy is at 78%. \n\nWould you like to adjust pricing for the upcoming long weekend?";
    }
    
    return "I'm currently in 'Offline Demo Mode' (API Unavailable). \n\nHowever, I can still help you navigate! Try asking about 'Saffron Villa' or 'Revenue'.";
};

export const sendMessageToAI = async (message: string, systemInstruction?: string): Promise<string> => {
  if (!chatSession || (systemInstruction && currentInstruction !== systemInstruction)) {
    initializeChat(systemInstruction);
  }
  if (!chatSession) {
      return getMockResponse(message);
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "I didn't get a clear response.";
  } catch (error: any) {
    // Silent handling of expected errors to keep UI clean
    // Handles 429 (Rate Limit) and 500 (Server Error/RPC fail)
    const isRecoverableError = 
        error.message?.includes('429') || 
        error.status === 429 || 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.code === 500 ||
        error.message?.includes('Rpc failed') ||
        error.status === 'UNKNOWN';
    
    if (isRecoverableError) {
        console.warn("Gemini API Error (Recoverable) - Switching to Mock Response", error.message);
        return getMockResponse(message);
    }
    
    console.error("AI Error:", error);
    return "I'm having trouble connecting right now. Please check your internet connection.";
  }
};

export const generateDescription = async (property: Partial<Property>, vibe: string): Promise<string> => {
    const ai = getClient();
    
    // Construct a rich prompt that forces the AI to look at the specific data points
    const prompt = `
    You are an expert real estate copywriter. Write a 150-word listing description for this property.
    
    **PROPERTY DETAILS**:
    - Title: ${property.title}
    - Location: ${property.location}, ${property.city}
    - Type: ${property.bedrooms}BHK ${property.type}
    - Vibe/Mood: ${vibe}
    
    **KEY FEATURES (Must Mention)**:
    - Pool: ${property.poolType !== 'NA' ? `Yes (${property.poolType})` : 'No'}
    - Amenities: ${property.amenities?.join(', ')}
    
    **CRITICAL POLICIES (Integrate naturally)**:
    - Pet Policy: ${property.petFriendly ? "Pet Friendly (Highlight this!)" : "No Pets Allowed"}
    - Food: ${property.nonVegAllowed ? "Non-Veg Allowed" : "Pure Veg Only (Strict)"}
    - Staff: ${property.caretakerAvailable ? "Caretaker on-site" : "Self check-in"}
    
    **INSTRUCTIONS**:
    - Write in a ${vibe} tone.
    - Do not use markdown headers.
    - Be inviting but accurate based on the policies above.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Could not generate description.";
    } catch (e: any) {
        // Fallback for any error in demo to prevent blocking user flow
        return `Welcome to ${property.title} in ${property.city}. This ${property.bedrooms} bedroom ${property.type} is perfect for a ${vibe} getaway. Enjoy amenities like ${property.amenities?.slice(0,3).join(', ')}. Book your stay today! (Generated offline)`;
    }
};

export const suggestPricing = async (location: string, type: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest pricing (in INR) for a ${type} in ${location}. 
            Return valid JSON with: 
            { 
                "baseWeekdayPrice": number, 
                "baseWeekendPrice": number, 
                "rules": [{ "name": string, "modifier": number, "type": string }] 
            }`,
            config: { responseMimeType: 'application/json' }
        });
        return response.text || "{}";
    } catch (e: any) {
        // Fallback for any error in demo
        return JSON.stringify({
            baseWeekdayPrice: 12000,
            baseWeekendPrice: 15000,
            rules: [{ name: 'Weekend Surge', modifier: 20, type: 'weekend' }]
        });
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
        const text = response.text;
        if (!text) return { safe: false, reason: "AI Check Failed" };
        
        return JSON.parse(text);
    } catch (e: any) {
        // Fail safe: If AI is down (429/500), allow message but log it
        console.warn("Moderation skipped due to API error");
        return { safe: true, reason: "Moderation skipped (API Error)" };
    }
};

export const parseAIResponse = (response: string): { text: string, actions: AIAction[] } => {
    const actions: AIAction[] = [];
    const text = response.replace(/\[ACTION: (.+?)\]/g, (match, json) => {
        try {
            actions.push(JSON.parse(json));
            return ''; // Remove action tag from text
        } catch (e) {
            console.error("Failed to parse AI action", e);
            return match; // Keep if failed
        }
    });
    return { text: text.trim(), actions };
};
