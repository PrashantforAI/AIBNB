
import { Property, PropertyType, ServiceTask, HostProfile } from './types';

export const AI_SYSTEM_INSTRUCTION = `You are the AI Brain of AI BNB. 
Assisting HOST. Context: {role: 'HOST'}.
Action Tags: [ACTION: {"type": "NAVIGATE", "payload": "page_id"}]
Respond concisely.`;

export const AI_HOST_LANDING_INSTRUCTION = `You are the AI Business Manager for a Short-Term Rental Host.
**GOAL**: Give the host a high-level overview of their business immediately.
**CONTEXT**: You have access to their portfolio revenue, occupancy, and upcoming bookings.
**INTERACTION**:
- If they ask "How's business?", summarize revenue trends and occupancy.
- If they want to edit a property, output: [ACTION: {"type": "NAVIGATE", "payload": "listings"}]
- If they want to see the calendar, output: [ACTION: {"type": "NAVIGATE", "payload": "calendar"}]
- Keep it professional, data-driven, and concise.`;

export const AI_GUEST_INSTRUCTION = `You are the AI Concierge for AI BNB.
**ROLE**: Luxury travel agent.
**GOAL**: Help the user find the perfect stay.
**INTERACTION**:
- **ONE CARD RULE**: Only show ONE property card at a time. Do NOT list multiple properties unless explicitly asked to compare.
- **TAG USAGE**: NEVER write the property name as text. ALWAYS use [PROPERTY: id] to render the card.
- **PERSUASION**: Describe the "vibe" and experience (e.g., "Imagine waking up to the Sahyadri mountains..."). Don't just list features.
- **UPSELL**: If 'mealsAvailable' is true, pitch the private chef or meal packages. "Shall I include a bespoke meal package to make your stay utterly effortless?"
- **CLOSING**: End with a call to action. "Does this look like the perfect getaway for your group?"
- **BOOKING**: If the user agrees, output [BOOKING_INTENT: {...}].
**TONE**: Warm, helpful, sophisticated, brief.`;

export const AI_SERVICE_INSTRUCTION = `You are the Field Operations AI.
**ROLE**: Assistant for Cooks, Cleaners, and Maintenance staff.
**GOAL**: Help them find their next task or report completion.
**INTERACTION**:
- If they ask "What's next?", show the next pending task.
- If they say "I finished the cleaning at Saffron Villa", mark it as done (mock response).
**TONE**: Direct, clear, efficient.`;

export const AI_MESSAGE_REGULATOR_INSTRUCTION = `You are a Content Safety Moderator for a travel platform.
**TASK**: Analyze the user's message for any attempts to share direct contact information (Phone numbers, Email addresses, Social handles, External URLs) or requests to pay off-platform.
**OUTPUT**: Return a JSON object: { "safe": boolean, "reason": string }.
- If safe, reason is "Message looks good.".
- If unsafe, reason explains what was blocked (e.g., "Phone number detected", "Email detected").
**STRICTNESS**: High. We want to keep communication on the platform.`;

// Helper to generate a date string YYYY-MM-DD
const getDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
};

const STANDARD_RULES = {
    checkInTime: '14:00', checkOutTime: '10:00', standardOccupancy: 6, maxOccupancy: 8, extraGuestPolicy: 'Chargeable',
    chefAvailable: true, kitchenUsagePolicy: 'Reheating only', securityDeposit: 15000, refundPolicy: '4-7 days',
    cancellationPolicy: 'Moderate', petsAllowed: false, petDeposit: 10000, petSanitationFee: 2000, petPoolPolicy: 'No',
    quietHours: '10PM - 7AM', smokingPolicy: 'Outdoors', cleaningPolicy: 'Daily'
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Saffron Villa - Luxury Stay',
    description: 'A 4BHK luxury villa in Lonavala with a private pool, overlooking the Sahyadri mountains. Perfect for family getaways.',
    type: PropertyType.VILLA,
    status: 'active',
    address: 'Plot 45, Tungarli', location: 'Tungarli', city: 'Lonavala', state: 'Maharashtra', country: 'India', pincode: '410401',
    gpsLocation: { lat: 18.75, lng: 73.40 },
    bedrooms: 4, bathrooms: 5, poolType: 'Private', poolSize: '20x10 ft', parking: true, petFriendly: false,
    amenities: ['Pool', 'Wifi', 'AC', 'Parking', 'Caretaker', 'TV', 'Bonfire'],
    kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: true, wifiPassword: 'guest',
    caretakerAvailable: true, caretakerName: 'Ramesh', checkInTime: '13:00', checkOutTime: '11:00',
    baseGuests: 8, maxGuests: 12, currency: 'INR', baseWeekdayPrice: 15000, baseWeekendPrice: 22000, extraGuestPrice: 1500,
    rules: { ...STANDARD_RULES },
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop'],
    mealPlans: [], addOns: [], pricingRules: [], calendar: {}, reviews: [], occupancyRate: 78, revenueLastMonth: 120000,
    hostId: 'host1'
  },
  {
    id: '2',
    title: 'Heritage Haveli Jaipur',
    description: 'Restored 19th-century Haveli in the Pink City. Traditional decor with modern amenities.',
    type: PropertyType.HOMESTAY,
    status: 'active',
    address: 'Old City', location: 'Pink City', city: 'Jaipur', state: 'Rajasthan', country: 'India', pincode: '302002',
    gpsLocation: { lat: 26.91, lng: 75.78 },
    bedrooms: 3, bathrooms: 3, poolType: 'NA', parking: false, petFriendly: true,
    amenities: ['Wifi', 'Breakfast', 'AC', 'Library'],
    kitchenAvailable: false, nonVegAllowed: false, mealsAvailable: true,
    caretakerAvailable: true, caretakerName: 'Singh', checkInTime: '12:00', checkOutTime: '10:00',
    baseGuests: 6, maxGuests: 6, currency: 'INR', baseWeekdayPrice: 8500, baseWeekendPrice: 10000, extraGuestPrice: 0,
    rules: { ...STANDARD_RULES, petsAllowed: true },
    images: ['https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=2574&auto=format&fit=crop'],
    mealPlans: [], addOns: [], pricingRules: [], calendar: {}, reviews: [], occupancyRate: 65, revenueLastMonth: 85000,
    hostId: 'host1'
  }
];

export const AMENITIES_LIST = [
    { id: 'wifi', name: 'WiFi', icon: 'Wifi' }, { id: 'ac', name: 'AC', icon: 'Wind' }, { id: 'pool', name: 'Pool', icon: 'Waves' }
];

export const MOCK_TASKS: ServiceTask[] = [
    { id: 't1', type: 'cleaning', propertyId: '1', propertyName: 'Saffron Villa', date: getDate(2), time: '11:00 AM', status: 'pending', details: 'Deep Clean', assignedTo: 'sp1' }
];

export const MOCK_HOST_PROFILE: HostProfile = {
    id: 'host1',
    name: 'AI BNB',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    isSuperhost: true,
    joinedDate: 'March 2020',
    bio: "Hi, I'm the AI Manager for this property! I love automating hospitality to ensure you have a seamless, perfect stay. I'm available 24/7 to answer your questions and help you plan your trip. We specialize in luxury villas and heritage stays across India.",
    languages: ['English', 'Hindi', 'Marathi'],
    responseRate: 100,
    responseTime: 'within a few minutes',
    reviewsCount: 124,
    rating: 4.9,
    verified: true
};
