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
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// CORS handler for cross-origin requests
const corsHandler = cors({ origin: true });

// --- INTERNAL HELPERS ---

/**
 * Validates and saves a new property to Firestore.
 * This is an internal tool called by the AI Router or other functions.
 */
const addProperty = async (uid: string, payload: AddPropertyPayload): Promise<any> => {
  // 1. Strict Validation
  if (!payload.title || !payload.pricePerNight || !payload.location) {
    throw new Error("Missing required property fields: title, price, or location.");
  }

  if (payload.pricePerNight < 0) {
    throw new Error("Price cannot be negative.");
  }

  // 2. Construct the Property Object
  const newProperty: Property = {
    hostId: uid,
    title: payload.title,
    description: payload.description || "",
    location: payload.location,
    pricePerNight: Number(payload.pricePerNight),
    currency: "USD", // Defaulting to USD for MVP
    maxGuests: payload.maxGuests || 1,
    bedrooms: 1, // Defaults, could be expanded in payload
    beds: 1,
    baths: 1,
    amenities: payload.amenities || [],
    images: [], // Images would be handled via Storage triggers usually
    rating: 0,
    reviewCount: 0,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // 3. Save to Firestore
  const docRef = await db.collection("properties").add(newProperty);
  
  return { 
    success: true, 
    propertyId: docRef.id, 
    message: "Property listed successfully." 
  };
};

/**
 * Uses Gemini to generate a catchy description for a property based on raw details.
 */
const generatePropertyDescription = async (details: any): Promise<string> => {
  const prompt = `Write a captivating rental listing description for a property with the following details: ${JSON.stringify(details)}. Keep it under 100 words.`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Beautiful property in a great location."; // Fallback
  }
};

// --- CLOUD FUNCTIONS ---

/**
 * AI Core Router
 * The central brain that receives intents from the frontend and routes to specific tools.
 */
export const aiCoreRouter = onRequest({ cors: true }, async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // 1. Authentication Check (Optional: verify ID token if needed strict security)
      // For this demo, we assume the frontend sends the UID in the payload or we rely on logic
      // In production, use: await admin.auth().verifyIdToken(req.headers.authorization...)
      
      const { userRole, intent, payload } = req.body as AICoreRequest;
      const uid = req.body.uid; // Assumed passed from frontend for context

      let result;

      switch (intent) {
        case 'generate_description':
          // AI Tool: Creative Writing
          result = await generatePropertyDescription(payload);
          res.status(200).json({ data: { description: result } });
          break;

        case 'add_property':
          // Logic Tool: Database Write
          if (userRole !== 'host') {
            throw new Error("Permission denied. Only hosts can add properties.");
          }
          result = await addProperty(uid, payload);
          res.status(200).json({ data: result });
          break;

        case 'ask_support':
          // AI Tool: General Support Chat
          const chat = model.startChat({ history: [] });
          const msg = `You are a helpful support agent for AI BNB. Answer this user question: ${payload.question}`;
          const chatResult = await chat.sendMessage(msg);
          res.status(200).json({ data: { reply: chatResult.response.text() } });
          break;

        default:
          res.status(400).json({ error: "Unknown intent" });
      }

    } catch (error: any) {
      console.error("AI Router Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Auth Trigger: onUserSignup
 * Automatically creates a user document in Firestore when a new user signs up.
 */
export const onUserSignup = beforeUserCreated(async (event) => {
  const user = event.data;
  
  if (!user) return;

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "New User",
    photoURL: user.photoURL || "",
    role: "guest", // Default role
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false,
  };

  try {
    await db.collection("users").doc(user.uid).set(userProfile);
    console.log(`User profile created for ${user.uid}`);
  } catch (error) {
    console.error("Error creating user profile:", error);
    // In blocking functions, throwing an error cancels the signup
    // We catch it here to allow signup even if db write fails (or re-throw to block)
  }
});
