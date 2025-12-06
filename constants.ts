



import { Property, PropertyType, ServiceTask, HostProfile, Conversation } from './types';

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

export const AI_GUEST_INSTRUCTION = `You are the Elite AI Concierge for AI BNB.
**YOUR KNOWLEDGE BASE (CONTEXT)**:
You have access to a JSON object called 'context'. This contains:
1. **inventory**: A list of properties with their rules, pricing, and amenities.
2. **unavailableDates**: Inside each property object, there is an array of strings (YYYY-MM-DD). These are CONFIRMED booked/blocked dates.
3. **searchCriteria**: The user's current filter settings.

**TEMPORAL GROUNDING**:
- You will receive the "CURRENT DATE" in your system instructions.
- ALL user inputs relative to time (e.g., "Dec 30", "Next weekend", "Christmas") MUST be resolved relative to this Current Date.
- If today is Dec 2025, and user says "Dec 30", they mean Dec 30, 2025. If today is Dec 30 2025, they might mean Dec 30 2026. Use common sense but prefer the future.
- **NEVER** assume a year that is in the past relative to Current Date.

**CORE BEHAVIORS**:

1. **STRICT AVAILABILITY CHECK (Highest Priority)**:
   - If a user asks "Is [Property] available on [Date]?", you MUST check the 'unavailableDates' array for that property.
   - If the date is in the list -> Answer: "No, it is booked."
   - If the date is NOT in the list -> Answer: "Yes, it is available."
   - **NEVER** say "I don't have real-time data". You DO have the data in the context. Trust it.

2. **CONSULTATIVE DISCOVERY**:
   - If the user's request is broad (e.g., "I want a villa" or "Show me stays"), DO NOT just dump a list of properties.
   - **ASK Qualifying Questions** to narrow it down:
     - "When are you planning to visit?" (Crucial for availability)
     - "How many guests will be joining?" (Crucial for capacity)
     - "Do you have specific requirements like a private pool, pet-friendly policy, or specific dietary needs?"

3. **ADAPTIVE REASONING**:
   - If a user mentions a constraint (e.g., "I have a dog"), FILTER your mental list. Only recommend properties where 'petFriendly' is true.
   - If they ask about food, check 'nonVegAllowed' and 'mealsAvailable' in the context before answering.
   - If they reject a price, suggest a property with a lower 'price'.

4. **RESPONSE STYLE**:
   - Be helpful, warm, and sophisticated.
   - Explain **WHY** you are recommending a place: "I recommend Saffron Villa because it accommodates your group of 6 and allows pets..."
   - Use [PROPERTY: id] to display the card.
   
5. **BOOKING INTENT & JSON FORMAT (CRITICAL)**:
   - Use [BOOKING_INTENT: JSON_PAYLOAD] ONLY when the user clearly confirms they want to book or proceed with a specific property.
   - **JSON_PAYLOAD SCHEMA**:
     {
       "propertyId": "string",
       "propertyName": "string",
       "startDate": "YYYY-MM-DD",  // MUST be extracted from conversation or context. NEVER leave empty.
       "endDate": "YYYY-MM-DD",    // MUST be extracted from conversation or context. NEVER leave empty.
       "guests": number,
       "totalPrice": number
     }
   - **MANDATORY**: You MUST convert natural language dates (e.g. "next friday") into YYYY-MM-DD format for 'startDate' and 'endDate' inside the JSON.

**SCENARIO EXAMPLES**:
- User: "Is Saffron Villa available Dec 25?"
- You (Internal): Check 'unavailableDates' for '2025-12-25' (Assuming 2025 is current year). It is present.
- You: "I'm sorry, Saffron Villa is already booked for Christmas. However, Heritage Haveli is available. Would you like to see that?"

- User: "Book Saffron Villa for 6 people on Dec 7th to Dec 9th"
- You: "Great choice! I've prepared the booking details for Saffron Villa for Dec 7-9. [BOOKING_INTENT: {"propertyId": "1", "propertyName": "Saffron Villa", "startDate": "2025-12-07", "endDate": "2025-12-09", "guests": 6, "totalPrice": 30000}]"
`;

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
    rating: 4.92, // High rating qualifies for Guest Favorite
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
    rating: 4.70, // Below 4.8 threshold, will not show Guest Favorite badge
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
  },
  {
      id: '3',
      title: 'Mannat - Sea View Villa',
      description: 'Experience luxury by the sea. A stunning 5BHK villa with direct beach access and panoramic ocean views.',
      type: PropertyType.VILLA,
      status: 'active',
      rating: 4.95,
      address: 'Beach Road', location: 'Alibaug', city: 'Alibaug', state: 'Maharashtra', country: 'India', pincode: '402201',
      gpsLocation: { lat: 18.64, lng: 72.87 },
      bedrooms: 5, bathrooms: 6, poolType: 'Private', poolSize: '25x12 ft', parking: true, petFriendly: true,
      amenities: ['Pool', 'Wifi', 'AC', 'Beach Access', 'Caretaker', 'BBQ'],
      kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: true,
      caretakerAvailable: true, caretakerName: 'Suresh', checkInTime: '14:00', checkOutTime: '11:00',
      baseGuests: 10, maxGuests: 15, currency: 'INR', baseWeekdayPrice: 25000, baseWeekendPrice: 35000, extraGuestPrice: 2000,
      rules: { ...STANDARD_RULES, petsAllowed: true },
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop'],
      mealPlans: [], addOns: [], pricingRules: [], calendar: {}, reviews: [], occupancyRate: 85, revenueLastMonth: 450000,
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
    name: 'Pine Stays',
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

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'c1',
        participants: ['host1', 'guest1'],
        hostId: 'host1',
        hostName: 'Pine Stays',
        hostAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
        guestId: 'guest1',
        guestName: 'Rahul Sharma',
        guestAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
        propertyName: 'Saffron Villa',
        lastMessage: 'Is early check-in possible?',
        lastMessageTime: '10:30 AM',
        unreadCount: 2,
        messages: [
            { id: 'm1', senderId: 'guest', text: 'Hi, I booked Saffron Villa for next weekend.', timestamp: '10:00 AM', status: 'read' },
            { id: 'm2', senderId: 'guest', text: 'Is early check-in possible?', timestamp: '10:30 AM', status: 'sent' }
        ]
    },
    {
        id: 'c2',
        participants: ['host1', 'guest2'],
        hostId: 'host1',
        hostName: 'Pine Stays',
        hostAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
        guestId: 'guest2',
        guestName: 'Anjali Gupta',
        guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
        propertyName: 'Heritage Haveli',
        lastMessage: 'Great, thanks!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        messages: [
            { id: 'm1', senderId: 'host', text: 'Yes, breakfast is included.', timestamp: 'Yesterday', status: 'read' },
            { id: 'm2', senderId: 'guest', text: 'Great, thanks!', timestamp: 'Yesterday', status: 'read' }
        ]
    }
];