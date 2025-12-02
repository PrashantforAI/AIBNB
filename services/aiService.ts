
import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, AI_MESSAGE_REGULATOR_INSTRUCTION } from '../constants';
import { AIAction } from '../types';

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
// Ensures the app works for demo purposes even if API quota is hit (429)
const getMockResponse = (message: string, context?: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // Guest/Concierge Scenarios
    if (lowerMsg.includes('lonavala') || lowerMsg.includes('villa')) {
        return "I highly recommend **Saffron Villa**. It's a stunning 4BHK with a private pool and mountain views, perfect for your group. \n\n[PROPERTY: 1]";
    }
    if (lowerMsg.includes('jaipur') || lowerMsg.includes('haveli')) {
        return "You must check out **Heritage Haveli**. It's a restored 19th-century gem in the Pink City. Very authentic experience.\n\n[PROPERTY: 2]";
    }
    if (lowerMsg.includes('book') || lowerMsg.includes('reserve')) {
        return "I can help with that. Here is a booking proposal for Saffron Villa.\n\n[BOOKING_INTENT: {\"propertyId\": \"1\", \"propertyName\": \"Saffron Villa\", \"startDate\": \"2024-11-20\", \"endDate\": \"2024-11-22\", \"guests\": 6, \"totalPrice\": 35000}]";
    }
    
    // Host Scenarios
    if (lowerMsg.includes('business') || lowerMsg.includes('revenue')) {
        return "Business is trending up! Your revenue is **₹2,45,000** this month (+12%), and occupancy is at 78%. \n\nWould you like to adjust pricing for the upcoming Diwali weekend?";
    }
    
    return "I'm currently in 'Offline Demo Mode' (API Limit Reached). \n\nHowever, I can still help you navigate! Try asking about 'Saffron Villa' or 'Revenue'.";
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
    const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
    
    if (isRateLimit) {
        console.warn("Gemini Rate Limit Hit - Switching to Mock Response");
        return getMockResponse(message);
    }
    
    console.error("AI Error:", error);
    return "I'm having trouble connecting right now. Please check your internet connection.";
  }
};

export const generateDescription = async (details: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a catchy, warm, and inviting description (max 100 words) for an Indian homestay with these details: ${details}. Format it as plain text ready to paste.`,
        });
        return response.text || "Could not generate description.";
    } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
            return "Experience the charm of India in this beautiful stay. Perfect for families and groups looking for a serene getaway with top-notch amenities. (Auto-generated placeholder due to rate limit)";
        }
        console.error("GenAI Error", e);
        return "Error generating description.";
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
        if (e.message?.includes('429') || e.status === 429) {
            return JSON.stringify({
                baseWeekdayPrice: 12000,
                baseWeekendPrice: 15000,
                rules: [{ name: 'Weekend Surge', modifier: 20, type: 'weekend' }]
            });
        }
        console.error("GenAI Error", e);
        return "{}";
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
        // Fail safe: If AI is down (429), allow message but log it
        if (e.message?.includes('429') || e.status === 429) {
             console.warn("Moderation skipped due to rate limit");
             return { safe: true, reason: "Moderation skipped (Rate Limit)" };
        }
        console.error("Moderation Error", e);
        return { safe: false, reason: "Unable to verify message safety at this time." };
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
