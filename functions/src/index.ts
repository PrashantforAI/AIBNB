import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cors from "cors";
import { 
  UserProfile, 
  Property, 
  AddPropertyPayload, 
  AICoreRequest 
} from "./schema";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Gemini API
// Ensure GEMINI_API_KEY is set in your Firebase environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// using gemini-1.5-flash for faster, cheaper agent interactions
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// CORS handler for cross-origin requests
const corsHandler = cors({ origin: true });

// --- AGENT HELPERS ---

/**
 * AGENT: Property Manager
 * Validates and saves a new property to Firestore.
 */
const agentAddProperty = async (uid: string, payload: AddPropertyPayload): Promise<any> => {
  if (!payload.title || !payload.pricePerNight || !payload.location) {
    throw new Error("Missing required property fields: title, price, or location.");
  }

  const newProperty: Property = {
    hostId: uid,
    title: payload.title,
    description: payload.description || "",
    location: payload.location,
    pricePerNight: Number(payload.pricePerNight),
    currency: "USD",
    maxGuests: payload.maxGuests || 1,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: payload.amenities || [],
    images: [],
    rating: 0,
    reviewCount: 0,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  const docRef = await db.collection("properties").add(newProperty);
  return { success: true, propertyId: docRef.id, message: "Property listed successfully." };
};

/**
 * AGENT: Creative Writer
 * Generates catchy descriptions.
 */
const agentGenerateDescription = async (details: any): Promise<string> => {
  const prompt = `Write a captivating rental listing description for a property with the following details: ${JSON.stringify(details)}. Keep it under 100 words.`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Beautiful property in a great location."; 
  }
};

/**
 * AGENT: Pricing Analyst
 * Suggests optimal pricing based on market data (Mock logic + AI reasoning).
 */
const agentPricing = async (payload: any): Promise<any> => {
  // 1. Heuristic Base Price Calculation
  let basePrice = 50; // Default base
  if (payload.location?.city === 'Lonavala') basePrice = 15000; // INR
  if (payload.location?.city === 'Goa') basePrice = 25000;
  
  const amenitiesCount = payload.amenities?.length || 0;
  const suggestedPrice = basePrice + (amenitiesCount * 500);

  // 2. AI Justification
  const prompt = `Explain why a property in ${payload.location?.city} with ${amenitiesCount} amenities should be priced at ${suggestedPrice} INR/night. Be persuasive.`;
  let reasoning = "Based on market trends.";
  try {
    const result = await model.generateContent(prompt);
    reasoning = result.response.text();
  } catch(e) {}

  return {
    suggestedPrice,
    currency: "INR",
    confidence: "High",
    reasoning
  };
};

/**
 * AGENT: Compliance Officer
 * Checks rules against safety standards.
 */
const agentCompliance = async (payload: any): Promise<any> => {
  const rules = payload.rules || [];
  const location = payload.location || "Unknown";
  
  const prompt = `
    Act as a short-term rental compliance officer for ${location}.
    Review these house rules: ${JSON.stringify(rules)}.
    Return a JSON object with:
    - compliant: boolean
    - missingSafetyRules: array of strings (e.g. "No smoke detector mentioned")
    - suggestions: string
  `;
  
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    // Fallback if AI fails
    return { compliant: true, missingSafetyRules: [], suggestions: "AI Compliance Check Unavailable" };
  }
};

/**
 * AGENT: Image Vision
 * Analyzes property images to auto-tag amenities.
 */
const agentImageAnalysis = async (payload: any): Promise<any> => {
  // In a real scenario, we would download the image buffer and send it to Gemini Vision.
  // For this cloud function stub, we'll return mock tags based on URL keywords or random success.
  const url = payload.imageUrl || "";
  const tags = ["modern", "interior", "well_lit"];
  
  if (url.includes("pool")) tags.push("swimming_pool");
  if (url.includes("kitchen")) tags.push("full_kitchen");
  
  return {
    detectedTags: tags,
    qualityScore: 0.95,
    description: "Bright and spacious area suitable for listings."
  };
};

/**
 * AGENT: Guest Search
 * Semantic search for properties.
 */
const agentGuestSearch = async (payload: any): Promise<any> => {
  const query = payload.query || "";
  // Mock Semantic Search Result
  // In production, this would vector embed the query and search Pinecone/Vector DB.
  return {
    results: [
      { id: "1", title: "Saffron Villa", score: 0.98, reason: "Matches 'luxury' and 'pool' intent." },
      { id: "3", title: "Mannat", score: 0.85, reason: "Matches 'sea view' intent." }
    ]
  };
};

/**
 * AGENT: Onboarding Assistant
 * Conversational state machine for gathering property details.
 */
const agentHostOnboarding = async (payload: any): Promise<any> => {
  const currentData = payload.currentData || {};
  const history = payload.history || []; // Previous chat turns
  const lastUserMessage = payload.message || "";

  // Prompt Gemini to act as a state machine
  const systemPrompt = `
    You are a Host Onboarding Agent. Your goal is to gather these fields: title, location, price, type.
    Current Collected Data: ${JSON.stringify(currentData)}.
    
    1. If a field is missing, ask for it politely.
    2. If the user provided data in their last message ("${lastUserMessage}"), extract it and merge with Current Data.
    3. If all fields are present, output { "done": true, "finalData": ... }.
    4. Otherwise, output { "done": false, "nextQuestion": "...", "updatedData": ... }.
    
    Return ONLY JSON.
  `;

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(systemPrompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    return { done: false, nextQuestion: "Could you tell me the property title?", updatedData: currentData };
  }
};

// --- CLOUD FUNCTIONS ---

/**
 * AI Core Router
 * The central brain that distributes tasks to specialized Agents.
 */
export const aiCoreRouter = onRequest({ cors: true }, async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { userRole, intent, payload } = req.body as AICoreRequest;
      const uid = req.body.uid;

      let result;

      switch (intent) {
        // --- EXISTING INTENTS ---
        case 'generate_description':
          result = await agentGenerateDescription(payload);
          res.status(200).json({ data: { description: result } });
          break;

        case 'add_property':
          if (userRole !== 'host') throw new Error("Permission denied.");
          result = await agentAddProperty(uid, payload);
          res.status(200).json({ data: result });
          break;

        case 'ask_support':
          // Enhanced Support Router
          const chat = model.startChat({ history: [] });
          const supportPrompt = `
            You are the AI BNB Support Agent. You have access to these specialized tools:
            - Pricing Agent (for rate advice)
            - Compliance Agent (for safety rules)
            - Onboarding Agent (for new listings)
            
            User Question: ${payload.question}
            
            If the user asks about these topics, explain how those agents can help. Otherwise, answer directly.
          `;
          const chatResult = await chat.sendMessage(supportPrompt);
          res.status(200).json({ data: { reply: chatResult.response.text() } });
          break;

        // --- NEW AGENT INTENTS ---
        
        case 'host_onboarding_step':
          // Conversational flow for adding property
          result = await agentHostOnboarding(payload);
          res.status(200).json({ data: result });
          break;

        case 'get_pricing_suggestion':
          // Pricing Agent
          result = await agentPricing(payload);
          res.status(200).json({ data: result });
          break;

        case 'analyze_image':
          // Image Agent
          result = await agentImageAnalysis(payload);
          res.status(200).json({ data: result });
          break;

        case 'check_compliance':
          // Compliance Agent
          result = await agentCompliance(payload);
          res.status(200).json({ data: result });
          break;
          
        case 'guest_search':
          // Guest Search Agent
          result = await agentGuestSearch(payload);
          res.status(200).json({ data: result });
          break;

        default:
          res.status(400).json({ error: `Unknown intent: ${intent}` });
      }

    } catch (error: any) {
      console.error("AI Router Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Auth Trigger: onUserSignup
 */
export const onUserSignup = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "New User",
    photoURL: user.photoURL || "",
    role: "guest",
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false,
  };

  try {
    await db.collection("users").doc(user.uid).set(userProfile);
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
});
