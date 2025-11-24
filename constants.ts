
import { Property, PropertyType } from './types';

export const AI_SYSTEM_INSTRUCTION = `You are the AI Brain of AI BNB, an intelligent, chat-first short-term rental platform designed for the Indian hospitality market.
You are currently assisting a HOST in the Host Dashboard.

**YOUR SUPERPOWER:**
You have FULL ACCESS to the user's application state (Context). You can see their properties, specific calendar bookings, revenue stats, and current navigation screen.
Always check the [Current Context] JSON before answering.

**YOUR RESPONSIBILITIES:**
1. **Business Intelligence**: Answer questions like "Which property is doing best?", "How much did I earn last month?", "Who is checking in next?". Analyze the JSON data to provide accurate numbers.
2. **Navigator & Guide**: If the user asks "How do I add a property?", guide them to the 'Properties' page and the 'Add New' button.
3. **Content Creator**: If editing a property, suggest descriptions, amenities, or pricing rules based on the specific location and type provided in the context.
4. **Cultural Expert**: Use Indian context (Diwali, Holi, Monsoon, local food names) to make suggestions relevant.

**RESPONSE FORMATTING GUIDELINES (CRITICAL):**
- Use **Bold** for key figures, prices, guest names, or important terms.
- Use Bullet points (-) for lists of amenities, suggestions, or steps.
- Use ### Headers for section titles (e.g., "### Pricing Strategy").
- Keep paragraphs short and concise.
- Add newlines between sections for readability.
- Do not use code blocks unless specifically asked for code.

If asked to draft a description, provide plain text ready to paste.
`;

export const AI_GUEST_INSTRUCTION = `You are the AI Concierge for AI BNB, a luxury short-term rental platform in India. 
You are assisting a GUEST who is looking to book a stay or is currently staying at one of our properties.

**YOUR CONTEXT AWARENESS:**
- You have access to the guest's **Current Search Criteria** (Location, Dates, Guest Count) via the context. Use this immediately. 
- If the user has searched for "Lonavala" and "6 guests", DO NOT ask "Where do you want to go?". Instead, ask "I see you're planning a trip to Lonavala for 6. Are you celebrating a special occasion?"
- If the user filters return 0 results, suggest similar alternatives or nearby locations.

**YOUR PERSONALITY:**
- Warm, polite, and hospitable (Use "Namaste", "Welcome").
- Knowledgeable about the specific property in the context.
- Sales-oriented but subtle: Suggest meal plans, bonfires, or upgrades when relevant.

**YOUR RESPONSIBILITIES:**
1. **Booking Assistant**: Help guests check availability. If they ask "Is it available next weekend?", check the provided [Context] for calendar availability.
2. **Upsell Specialist**: If a guest books a villa, suggest adding a "Maharashtrian Veg Thali" or "BBQ Setup" from the 'addOns' or 'mealPlans' list in the context.
3. **Local Guide**: Suggest nearby attractions based on the property's location (e.g., Lonavala -> Bushi Dam).
4. **Recommender**: If the guest is looking for a place to stay, suggest properties from the "availableProperties" list in the context.

**INTERACTIVE TOOLS (CRITICAL):**

1. **Property Cards**: When you recommend a specific property, output: 
   [PROPERTY: id]

2. **Booking Proposals**: If the guest says "I want to book", "Let's do it", or confirms dates and price, you MUST output a Booking Intent tag.
   Calculate the approximate price based on the weekday/weekend rates in the context.
   Format:
   [BOOKING_INTENT: {"propertyId": "id", "propertyName": "Name", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "guests": number, "totalPrice": number}]

**RESPONSE FORMATTING:**
- Short, conversational, mobile-friendly responses.
- Use emojis sparingly 🌿 🏡.
`;

// Helper to generate a date string YYYY-MM-DD for current month + offset days
const getDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Saffron Villa - Luxury Stay',
    description: 'A 4BHK luxury villa in Lonavala with a private pool, overlooking the Sahyadri mountains. Perfect for family getaways, corporate offsites, and intimate celebrations. The villa features spacious balconies, a lush green lawn, and modern interiors blended with rustic charm.',
    type: PropertyType.VILLA,
    status: 'active',
    
    // Location
    address: 'Plot 45, Tungarli Road',
    location: 'Tungarli',
    city: 'Lonavala',
    state: 'Maharashtra',
    country: 'India',
    pincode: '410401',
    gpsLocation: { lat: 18.75, lng: 73.40 },

    // Structure
    bedrooms: 4,
    bathrooms: 5,
    poolType: 'Private',
    poolSize: '20x10 ft',
    parking: true,
    petFriendly: false,

    // Amenities/Rules
    amenities: ['Pool', 'Wifi', 'AC', 'Parking', 'Caretaker', 'TV', 'Inverter', 'Bonfire', 'Music System'],
    kitchenAvailable: true,
    nonVegAllowed: true,
    mealsAvailable: true,
    wifiPassword: 'saffron_guest',

    // Staff
    caretakerAvailable: true,
    caretakerName: 'Ramesh Bhau',
    caretakerNumber: '+919876543210',
    checkInTime: '13:00',
    checkOutTime: '11:00',

    // Guests & Pricing
    baseGuests: 8,
    maxGuests: 12,
    currency: 'INR',
    baseWeekdayPrice: 15000,
    baseWeekendPrice: 22000,
    extraGuestPrice: 1500,

    images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=2574&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2670&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop'
    ],
    
    mealPlans: [
      {
        type: 'Veg',
        pricePerHead: 500,
        description: 'Pure vegetarian Maharashtrian thali with local spices.',
        items: ['Pithla Bhakri', 'Indrayani Rice', 'Solkadhi', 'Shrikhand', 'Thecha']
      },
      {
        type: 'Non-Veg',
        pricePerHead: 750,
        description: 'Authentic Gavran chicken handi and fry.',
        items: ['Chicken Sukka', 'Chicken Rassa', 'Bhakri', 'Jeera Rice']
      }
    ],
    addOns: [
      { id: 'c1', name: 'Private Bonfire', price: 1000, unit: 'per_stay', description: 'Wood & setup for evening.' },
      { id: 'c2', name: 'BBQ Setup', price: 1500, unit: 'per_stay', description: 'Grill and coal provided.' }
    ],
    pricingRules: [
      { id: 'r1', name: 'Diwali Peak', daysOfWeek: [], priceModifier: 50, type: 'festival' }
    ],

    // Calendar Data
    calendar: {
        [getDate(2)]: { date: getDate(2), status: 'booked', price: 15000, guestName: 'Rahul K.' },
        [getDate(3)]: { date: getDate(3), status: 'booked', price: 15000, guestName: 'Rahul K.' },
        [getDate(10)]: { date: getDate(10), status: 'blocked', note: 'Maintenance' },
        [getDate(11)]: { date: getDate(11), status: 'blocked', note: 'Maintenance' },
        [getDate(20)]: { date: getDate(20), status: 'available', price: 25000, minStay: 2 } // Peak pricing override
    },

    reviews: [
        { id: 'rev1', guestName: 'Anjali Desai', rating: 5, date: '2023-10-15', comment: 'Absolutely stunning villa! The pool was clean and the caretaker Ramesh was very helpful.' },
        { id: 'rev2', guestName: 'Vikram Singh', rating: 4, date: '2023-09-22', comment: 'Great location. The food was amazing, especially the chicken curry.' }
    ],

    occupancyRate: 78,
    revenueLastMonth: 120000,
  },
  {
    id: '2',
    title: 'Heritage Haveli Jaipur',
    description: 'Experience royalty in this restored 19th-century Haveli in the heart of the Pink City. Intricate architecture, traditional decor, and modern amenities make for a perfect cultural stay.',
    type: PropertyType.HOMESTAY,
    status: 'active',

    // Location
    address: 'Old City Wall Road',
    location: 'Pink City',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    pincode: '302002',
    gpsLocation: { lat: 26.91, lng: 75.78 },

    // Structure
    bedrooms: 3,
    bathrooms: 3,
    poolType: 'NA',
    parking: false,
    petFriendly: true,

    // Amenities
    amenities: ['Wifi', 'Breakfast', 'Cultural Walk', 'AC', 'Library'],
    kitchenAvailable: false,
    nonVegAllowed: false,
    mealsAvailable: true,

    // Staff
    caretakerAvailable: true,
    caretakerName: 'Singh Ji',
    checkInTime: '12:00',
    checkOutTime: '10:00',

    // Guests & Pricing
    baseGuests: 6,
    maxGuests: 6,
    currency: 'INR',
    baseWeekdayPrice: 8500,
    baseWeekendPrice: 10000,
    extraGuestPrice: 0,

    images: [
        'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=2574&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582647509711-28adba13a17e?q=80&w=2670&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2676&auto=format&fit=crop'
    ],
    mealPlans: [],
    addOns: [],
    pricingRules: [],
    
    calendar: {
        [getDate(1)]: { date: getDate(1), status: 'booked', guestName: 'Sarah J.' },
        [getDate(5)]: { date: getDate(5), status: 'blocked' }
    },
    
    reviews: [
        { id: 'rev1', guestName: 'John Doe', rating: 5, date: '2023-11-01', comment: 'Magical place. Felt like a king.' }
    ],

    occupancyRate: 65,
    revenueLastMonth: 85000,
  }
];

export const FESTIVALS_INDIA = [
  { name: 'Diwali', month: 'November' },
  { name: 'Holi', month: 'March' },
  { name: 'Christmas/New Year', month: 'December' },
  { name: 'Independence Day Long Weekend', month: 'August' }
];

export const AMENITIES_LIST = [
    { id: 'wifi', name: 'WiFi', icon: 'Wifi' },
    { id: 'ac', name: 'AC', icon: 'Wind' },
    { id: 'tv', name: 'TV', icon: 'Tv' },
    { id: 'kitchen', name: 'Kitchen', icon: 'Utensils' },
    { id: 'parking', name: 'Parking', icon: 'Car' },
    { id: 'pool', name: 'Pool', icon: 'Waves' },
    { id: 'caretaker', name: 'Caretaker', icon: 'UserCheck' },
    { id: 'bonfire', name: 'Bonfire', icon: 'Flame' },
    { id: 'pet', name: 'Pet Friendly', icon: 'Dog' },
];
