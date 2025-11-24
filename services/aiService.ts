import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from '../constants';

// Helper to safely access env vars in browser without crashing if process is undefined
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
      console.warn("Gemini API Key is missing. AI features will respond with mock data or fail.");
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

export const sendMessageToAI = async (message: string, systemInstruction?: string): Promise<string> => {
  if (!chatSession || (systemInstruction && currentInstruction !== systemInstruction)) {
    initializeChat(systemInstruction);
  }
  if (!chatSession) {
      return "AI Service Unavailable (Check API Key)";
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "I didn't get a clear response. Can you try asking differently?";
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again.";
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
    } catch (e) {
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
    } catch (e) {
        console.error("GenAI Error", e);
        return "{}";
    }
};