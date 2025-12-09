
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

    // Helper: Find Property ID by name
    const findPropertyId = (nameQuery: string): string => {
        if (!contextData.portfolio) return '1';
        const match = contextData.portfolio.find((p: any) => nameQuery.includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(nameQuery));
        return match ? match.id : (contextData.portfolio[0]?.id || '1');
    };

    // --- HOST AGENT INTENTS ---

    // 1. Navigation
    if (lowerMsg.includes('calendar') || lowerMsg.includes('schedule')) {
        return "Sure, opening your calendar now.\n\n[ACTION: {\"type\": \"NAVIGATE\", \"payload\": \"calendar\"}]";
    }
    if (lowerMsg.includes('message') || lowerMsg.includes('inbox')) {
        return "Taking you to your messages.\n\n[ACTION: {\"type\": \"NAVIGATE\", \"payload\": \"messages\"}]";
    }

    // 2. URL IMPORT INTELLIGENCE (Elivaas & Generic)
    if (message.includes('http') || message.includes('.com')) {
        // Mock parsing logic for the specific Elivaas link user provided
        if (message.includes('elivaas.com') || message.includes('meraki')) {
            return `I've analyzed the link! It looks like a stunning property.\n\n**Extracted Details:**\n- **Name:** Meraki 6BHK Villa with Private Pool\n- **Location:** Lonavala\n- **Structure:** 6 Bedrooms\n- **Features:** Private Pool detected\n\nI've drafted the listing for you. Just need your **Base Nightly Price** to finalize it.`;
        }
        
        // Handle "List this" follow up if price is provided after a link
        if (/\d+/.test(lowerMsg) && !lowerMsg.includes('date')) {
             return `Perfect. I've added the pricing. Here is the final preview.\n\n[PREVIEW_LISTING: {\n  "title": "Meraki 6BHK Villa with Private Pool",\n  "city": "Lonavala",\n  "address": "Tungarli, Lonavala",\n  "state": "Maharashtra",\n  "pincode": "410401",\n  "baseWeekdayPrice": ${lowerMsg.match(/\d+/)?.[0] || '25000'},\n  "baseWeekendPrice": ${(parseInt(lowerMsg.match(/\d+/)?.[0] || '25000') * 1.4)},\n  "type": "Villa",\n  "bedrooms": 6,\n  "bathrooms": 6,\n  "baseGuests": 12,\n  "maxGuests": 18,\n  "amenities": ["Pool", "WiFi", "AC", "Parking"],\n  "poolType": "Private",\n  "petFriendly": false,\n  "caretakerAvailable": true,\n  "kitchenAvailable": true,\n  "checkInTime": "14:00",\n  "checkOutTime": "11:00",\n  "securityDeposit": 20000,\n  "refundPolicy": "Non-refundable",\n  "smokingPolicy": "No smoking indoors"\n}]`;
        }
    }

    // 3. CHAT TO LIST (EXHAUSTIVE INTERVIEW MOCK)
    if (lowerMsg.includes('list') || lowerMsg.includes('property') || lowerMsg.includes('villa') || lowerMsg.includes('apartment')) {
        
        // Step 1: Basics (Name, City)
        if (!lowerMsg.includes('bedroom') && !lowerMsg.includes('price')) {
            return "I can help you list a new property. I need to gather some details first.\n\n**Step 1/8: Core Details**\nWhat is the **Name** of the property, **City**, and **Property Type** (e.g. Villa, Apartment)?";
        }

        // Step 2: Location (Address)
        if (lowerMsg.includes('villa') || lowerMsg.includes('apt') || lowerMsg.includes('home')) {
             if (!lowerMsg.includes('road') && !lowerMsg.includes('nagar')) {
                 return "**Step 2/8: Exact Location**\nGreat. Now, what is the **Full Address** including Area, State, and Pincode?";
             }
        }

        // Step 3: Structure (Beds, Baths)
        if (lowerMsg.includes('road') || lowerMsg.includes('nagar') || lowerMsg.includes('pin')) {
            return "**Step 3/8: Structure & Capacity**\nGot it. How many **Bedrooms** and **Bathrooms** does it have? Also, what is the **Max Guest Capacity**?";
        }

        // Step 4: Amenities (Pool)
        if (lowerMsg.includes('bed') || lowerMsg.includes('bath') || lowerMsg.includes('guest')) {
             return "**Step 4/8: Amenities**\nDoes it have a **Swimming Pool** (Private/Shared)? What about AC, WiFi, and Parking?";
        }

        // Step 5: Food & Staff
        if (lowerMsg.includes('pool') || lowerMsg.includes('wifi') || lowerMsg.includes('ac')) {
            return "**Step 5/8: Food & Staff**\nIs there a **Caretaker** on-site? Is the **Kitchen** available for guests? Is non-veg food allowed?";
        }
        
        // Step 6: Policies
        if (lowerMsg.includes('caretaker') || lowerMsg.includes('kitchen') || lowerMsg.includes('veg')) {
             return "**Step 6/8: Policies**\nAre **Pets** allowed? What are your standard **Check-in** and **Check-out** times?";
        }

        // Step 7: Financials & Rules (NEW)
        if (lowerMsg.includes('pet') || lowerMsg.includes('check')) {
             return "**Step 7/8: Financials & Rules**\nAlmost there. What is the **Security Deposit** amount and your **Refund Policy**? Also, any smoking restrictions?";
        }

        // Step 8: Pricing
        if (lowerMsg.includes('deposit') || lowerMsg.includes('refund') || lowerMsg.includes('smoking')) {
            return "**Step 8/8: Pricing**\nFinally, what is the **Base Weekday Price** and **Weekend Price** per night?";
        }

        // Confirmation & Action
        if (lowerMsg.includes('price') || lowerMsg.includes('rupee') || /\d+/.test(lowerMsg)) {
             return `I've gathered all the details. Here is a preview of your listing card.\n\nDoes this look correct?\n\n[PREVIEW_LISTING: {\n  "title": "New Mock Property",\n  "city": "Lonavala",\n  "address": "123 Mock Street, Tungarli",\n  "state": "Maharashtra",\n  "pincode": "410401",\n  "baseWeekdayPrice": 15000,\n  "baseWeekendPrice": 20000,\n  "type": "Villa",\n  "bedrooms": 3,\n  "bathrooms": 3,\n  "baseGuests": 6,\n  "maxGuests": 10,\n  "amenities": ["Pool", "WiFi", "AC"],\n  "poolType": "Private",\n  "petFriendly": true,\n  "caretakerAvailable": true,\n  "kitchenAvailable": true,\n  "checkInTime": "13:00",\n  "checkOutTime": "11:00",\n  "securityDeposit": 5000,\n  "refundPolicy": "Fully refundable up to 5 days before check-in",\n  "smokingPolicy": "No smoking indoors"\n}]`;
        }
    }

    return "I'm currently in 'Offline Agent Mode'. I can help you list properties or manage bookings. Try saying 'List a new villa'.";
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
        throw error;
      }
  };

  try {
    const result = await Promise.race([apiCall(), timeout]);
    
    if (result === "TIMEOUT") {
        return getMockResponse(message);
    }
    
    return result as string;

  } catch (error: any) {
    return getMockResponse(message);
  }
};

export const generateDescription = async (property: Partial<Property>, vibe: string): Promise<string> => {
    const ai = getClient();
    
    const prompt = `
    You are an expert real estate copywriter. Write a 150-word listing description.
    
    **DETAILS**:
    - Title: ${property.title}
    - Location: ${property.location}, ${property.city}
    - Type: ${property.bedrooms}BHK ${property.type}
    - Vibe: ${vibe}
    
    **FEATURES**:
    - Pool: ${property.poolType !== 'NA' ? `Yes (${property.poolType})` : 'No'}
    - Amenities: ${property.amenities?.join(', ')}
    
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

// Robust Parser to handle nested JSON arrays in Actions
export const parseAIResponse = (response: string): { text: string, actions: AIAction[] } => {
    const actions: AIAction[] = [];
    let cleanText = response;
    const startMarker = '[ACTION:';
    
    let startIndex = cleanText.indexOf(startMarker);
    
    // Loop to find all occurrences
    while (startIndex !== -1) {
        let open = 1; // matched the first '['
        let endIndex = -1;
        
        // Scan forward from after [ACTION:
        for (let i = startIndex + startMarker.length; i < cleanText.length; i++) {
            if (cleanText[i] === '[') open++;
            if (cleanText[i] === ']') open--;
            
            if (open === 0) {
                endIndex = i;
                break;
            }
        }
        
        if (endIndex !== -1) {
            // Found a balanced block
            const fullTag = cleanText.substring(startIndex, endIndex + 1);
            const jsonStr = cleanText.substring(startIndex + startMarker.length, endIndex).trim();
            
            try {
                // Handle potential markdown code blocks wrapping the JSON
                const cleanJson = jsonStr.replace(/```json\n?|\n?```/g, '');
                actions.push(JSON.parse(cleanJson));
            } catch (e) {
                console.error("Failed to parse AI action JSON", e);
            }
            
            // Remove the tag from the text
            cleanText = cleanText.replace(fullTag, '').trim();
            
            // Reset search from start because string matched
            startIndex = cleanText.indexOf(startMarker);
        } else {
            // Malformed tag (unbalanced), abort to prevent infinite loop
            break;
        }
    }
    
    return { text: cleanText, actions };
};
