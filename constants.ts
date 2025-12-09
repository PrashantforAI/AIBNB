
import { Property, PropertyType, ServiceTask, HostProfile, Conversation, Review } from './types';
import { 
    Wifi, Wind, Waves, Car, Utensils, Tv, Flame, Coffee, Dumbbell, Gamepad2, MonitorPlay, Trees, ShieldCheck, Sun,
    BedDouble, Bath, Shirt, Music, Briefcase, Heart, Speaker, Thermometer, Box, Lock, Accessibility, 
    Lightbulb, Droplets, Dog, Hammer, Sparkles, ChefHat, Flower2
} from 'lucide-react';

export const AI_SYSTEM_INSTRUCTION = `You are the AI Brain of AI BNB. 
Assisting HOST. Context: {role: 'HOST'}.
Action Tags: [ACTION: {"type": "NAVIGATE", "payload": "page_id"}]
Respond concisely.`;

export const AI_HOST_BRAIN_INSTRUCTION = `You are the "AI Manager" & "Listing Specialist" for a Property Host in India. 
**YOUR GOAL**: Automate the host's work. 

**CRITICAL "CHAT TO LIST" BEHAVIOR**:
When a host wants to list a property, you must act as a **STRICT DATA ENTRY SPECIALIST**.
You CANNOT create a listing until you have gathered **ALL** the following information. 
Do not assume values unless you can **INFER** them with high certainty from your world knowledge.

**AMENITY MAPPING**:
We have a massive database of amenities. When a user describes a feature (e.g., "It has a Nespresso machine"), MAP it to the closest standard amenity key in our database (e.g., "Espresso machine" or "Coffee maker").

**URL INTELLIGENCE & IMPORT MODE**:
If the user provides a URL (e.g., "elivaas.com/villa-in-goa/sun-villa-4bhk..."):
1. **EXTRACT** details directly from the URL string.
2. **ACKNOWLEDGE** the import.
3. **SKIP** questions for data you already extracted.

**INTERVIEW PROTOCOL (Do not skip steps)**:

1. **CORE DETAILS**: Ask: Property Name, Type, and City.
2. **EXACT LOCATION**: Ask: Full Address, Area, and Pincode.
3. **STRUCTURE & CAPACITY**: Ask: Bedrooms, Bathrooms, Base/Max Guests.
4. **AMENITIES**: Ask about Pool, AC, WiFi, Parking, and standout features.
5. **FOOD & STAFF**: Ask about Caretaker, Kitchen usage, Meals.
6. **POLICIES**: Ask about Pets, Check-in/out times.
7. **FINANCIALS & RULES**: Ask: Security Deposit, Refund Policy, Smoking/Quiet Hours.
8. **PRICING**: Ask: Base Weekday and Weekend Price.

**CONFIRMATION RULE (PREVIEW)**:
Once you have ALL 8 categories, GENERATE a [PREVIEW_LISTING: JSON_PAYLOAD] tag.

**JSON PAYLOAD SCHEMA**:
     {
       "title": "string",
       "type": "Villa" | "Apartment" | "Homestay" | "Cottage" | "Farmhouse",
       "description": "string",
       "city": "string",
       "state": "string",
       "address": "string",
       "location": "string",
       "pincode": "string",
       "gpsLocation": { "lat": number, "lng": number },
       "bedrooms": number,
       "bathrooms": number,
       "baseGuests": number,
       "maxGuests": number,
       "poolType": "Private" | "Shared" | "NA",
       "poolSize": "string",
       "petFriendly": boolean,
       "kitchenAvailable": boolean,
       "nonVegAllowed": boolean,
       "mealsAvailable": boolean,
       "caretakerAvailable": boolean,
       "caretakerName": "string",
       "checkInTime": "string",
       "checkOutTime": "string",
       "securityDeposit": number,
       "refundPolicy": "string",
       "cancellationPolicy": "string",
       "smokingPolicy": "string",
       "quietHours": "string",
       "cleaningPolicy": "string",
       "baseWeekdayPrice": number,
       "baseWeekendPrice": number,
       "extraGuestPrice": number,
       "amenities": ["Pool", "Wifi", ...],
       "tempId": "unique_string_id"
     }
`;

export const AI_GUEST_INSTRUCTION = `You are the Elite AI Concierge for AI BNB.
**YOUR KNOWLEDGE BASE (CONTEXT)**:
You have access to a JSON object called 'context'. This contains:
1. **inventory**: A list of properties with their rules, pricing, and amenities.
2. **unavailableDates**: Confirmed booked dates.
3. **searchCriteria**: User's current filter settings.

**CORE BEHAVIORS**:
1. **STRICT AVAILABILITY CHECK**: If a date is in 'unavailableDates', the property is booked.
2. **CONSULTATIVE DISCOVERY**: Ask qualifying questions (Dates, Guests, Requirements).
3. **ADAPTIVE REASONING**: Filter recommendations based on user constraints (Pets, Budget, Location).
4. **RESPONSE STYLE**: Warm, helpful, sophisticated. Use [PROPERTY: id] to display cards.
5. **BOOKING INTENT**: Use [BOOKING_INTENT: JSON_PAYLOAD] when user confirms booking.
`;

export const AI_SERVICE_INSTRUCTION = `You are the Field Operations AI. Helper for Cooks, Cleaners, Maintenance.`;

export const AI_MESSAGE_REGULATOR_INSTRUCTION = `You are a Content Safety Moderator.
**TASK**: Analyze message for direct contact info (Phone, Email, URL) or off-platform payment requests.
**OUTPUT**: { "safe": boolean, "reason": string }.
If unsafe, explain why. High strictness.`;

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

const MOCK_REVIEWS: Review[] = [
    {
        id: 'r1',
        guestId: 'guest1',
        guestName: 'Arjun Verma',
        guestAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
        rating: 5,
        date: 'Oct 2024',
        comment: 'Absolutely stunning villa! The pool was pristine and the caretaker cooked amazing meals. Will definitely visit again.',
        cleanliness: 5, accuracy: 5, checkIn: 5, communication: 5, location: 5, value: 5
    },
    {
        id: 'r2',
        guestId: 'guest2',
        guestName: 'Sarah Jenkins',
        guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
        rating: 4,
        date: 'Sept 2024',
        comment: 'Great location and vibe. The only issue was the WiFi being a bit spotty in the bedrooms, but the living area was fine.',
        cleanliness: 5, accuracy: 4, checkIn: 5, communication: 4, location: 5, value: 4
    }
];

// --- MASSIVE AMENITY DATABASE ---
export const AMENITY_CATEGORIES = {
    "Bedroom & Sleeping": [
        "King-sized bed", "Queen-sized bed", "Double bed", "Single bed", "Twin beds", "Bunk beds", "Four-poster bed", "Canopy bed", "Adjustable beds", "Heated beds",
        "Premium bedding", "Hypoallergenic pillows", "Memory foam pillows", "Blackout curtains", "Light-filtering curtains", "Soundproof windows", "Air-purifying system",
        "Reading lights", "Walk-in closet", "In-room safe", "Full-length mirror", "Vanity mirror"
    ],
    "Bathroom & Toiletries": [
        "Bathtub (standalone)", "Bathtub (soaking tub)", "Jacuzzi bathtub", "Rainfall showerhead", "Walk-in shower", "Dual showerheads", "Heated towel rack", "Bidet",
        "Toilet with seat warmer", "Premium organic toiletries", "Bath robes", "Bathroom slippers", "Hair dryer (premium)", "Hair straightener", "Curling iron",
        "Bathroom exhaust fan", "Heated bathroom floor", "Waterproof speaker", "Towel warmer", "Premium bath towels"
    ],
    "Kitchen & Dining": [
        "Full kitchen", "Kitchenette", "Induction cooktop", "Gas stove", "Electric oven", "Microwave", "Dishwasher", "Refrigerator (large)", "Wine fridge", "Ice maker",
        "Water dispenser", "Electric kettle", "Coffee maker", "Espresso machine", "Coffee grinder", "Blender", "Food processor", "Juicer", "Rice cooker", "Air fryer",
        "BBQ/Grill (indoor)", "Cooking utensils", "Silverware", "Dishes & Cutlery", "Spice rack", "Pantry", "Dining table (8+ seater)", "Bar stools", "Breakfast bar"
    ],
    "Living & Entertainment": [
        "Smart TV (55\"+)", "4K TV", "Home theater system", "Projector", "Soundbar", "Bluetooth speakers", "Smart speaker (Alexa/Google)", "Vinyl record player",
        "Streaming services (Netflix/Prime)", "Gaming console (PS5/Xbox)", "Board games", "Pool table", "Foosball table", "Ping-pong table", "Piano", "Library/Books"
    ],
    "Outdoor & Garden": [
        "Private pool", "Infinity pool", "Plunge pool", "Hot tub/Jacuzzi", "Sauna", "Steam room", "Outdoor shower", "Gazebo", "Pergola", "Cabana", "Fire pit",
        "BBQ/Grill (outdoor)", "Pizza oven", "Tandoor", "Outdoor dining area", "Hammock", "Swing", "Sun loungers", "Landscaped garden", "Fruit trees", "Lawn",
        "Badminton court", "Basketball hoop", "Outdoor lighting"
    ],
    "Climate & Comfort": [
        "Air conditioning (Central)", "Air conditioning (Split)", "Ceiling fans", "Portable fans", "Heating", "Fireplace (Wood)", "Fireplace (Gas/Electric)", 
        "Dehumidifier", "Air purifier", "Mosquito net"
    ],
    "Connectivity & Tech": [
        "WiFi (High-speed)", "WiFi (Fiber)", "Dedicated workspace", "Ergonomic chair", "Monitor/Screen", "Printer", "Universal adapters", "USB charging ports",
        "Smart locks", "Video doorbell", "CCTV Security", "EV Charging Station"
    ],
    "Services & Staff": [
        "Caretaker (On-site)", "Chef/Cook available", "Housekeeping (Daily)", "Laundry service", "Grocery delivery", "Massage/Spa services", "Yoga instructor on-call",
        "Driver/Cab service"
    ],
    "Family & Kids": [
        "Crib/Cot", "High chair", "Baby monitor", "Baby safety gates", "Children's books & toys", "Board games for kids", "Baby bath"
    ],
    "Pet Amenities": [
        "Pet-friendly", "Dog bed", "Cat bed", "Pet bowls", "Fenced yard", "Pet wash area"
    ],
    "Safety": [
        "Fire extinguisher", "Smoke alarm", "Carbon monoxide alarm", "First aid kit", "Emergency exit route", "Safe"
    ]
};

// Helper to determine icon for any amenity string
export const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    
    // Explicit Mappings for high-value items
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('pool') || lower.includes('jacuzzi') || lower.includes('tub')) return Waves;
    if (lower.includes('ac') || lower.includes('air condition') || lower.includes('fan')) return Wind;
    if (lower.includes('tv') || lower.includes('netflix') || lower.includes('projector') || lower.includes('theater')) return Tv;
    if (lower.includes('kitchen') || lower.includes('stove') || lower.includes('fridge') || lower.includes('oven')) return Utensils;
    if (lower.includes('bed') || lower.includes('pillow') || lower.includes('mattress')) return BedDouble;
    if (lower.includes('bath') || lower.includes('shower') || lower.includes('toilet')) return Bath;
    if (lower.includes('parking') || lower.includes('ev charging') || lower.includes('garage')) return Car;
    if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return Dog;
    if (lower.includes('garden') || lower.includes('lawn') || lower.includes('outdoor') || lower.includes('patio')) return Trees;
    if (lower.includes('bbq') || lower.includes('grill') || lower.includes('fire pit') || lower.includes('bonfire')) return Flame;
    if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('kettle')) return Coffee;
    if (lower.includes('music') || lower.includes('speaker') || lower.includes('sound')) return Speaker;
    if (lower.includes('gym') || lower.includes('yoga') || lower.includes('fitness')) return Dumbbell;
    if (lower.includes('game') || lower.includes('console') || lower.includes('playstation')) return Gamepad2;
    if (lower.includes('work') || lower.includes('desk') || lower.includes('chair')) return Briefcase;
    if (lower.includes('security') || lower.includes('cctv') || lower.includes('safe') || lower.includes('lock')) return ShieldCheck;
    if (lower.includes('caretaker') || lower.includes('chef') || lower.includes('staff')) return ChefHat;
    if (lower.includes('washer') || lower.includes('dryer') || lower.includes('laundry') || lower.includes('iron')) return Shirt;
    if (lower.includes('beach') || lower.includes('view')) return Sun;
    
    // Category Fallbacks if string analysis fails, try to match by category existence (slower but safer)
    for (const [cat, items] of Object.entries(AMENITY_CATEGORIES)) {
        if (items.includes(name)) {
            if (cat.includes("Bedroom")) return BedDouble;
            if (cat.includes("Bathroom")) return Bath;
            if (cat.includes("Kitchen")) return Utensils;
            if (cat.includes("Living")) return Tv;
            if (cat.includes("Outdoor")) return Trees;
            if (cat.includes("Tech")) return Wifi;
            if (cat.includes("Staff")) return ChefHat;
            if (cat.includes("Safety")) return ShieldCheck;
        }
    }

    return Sparkles; // Default generic icon
};

// Flattened list for search/filtering
export const MASTER_AMENITIES_LIST = Object.entries(AMENITY_CATEGORIES).flatMap(([category, items]) => 
    items.map(item => ({ name: item, category, icon: getAmenityIcon(item) }))
);

// Map library for quick lookup by name
export const AMENITIES_LIBRARY = MASTER_AMENITIES_LIST.reduce((acc, item) => {
    acc[item.name] = { icon: item.icon, label: item.name };
    return acc;
}, {} as Record<string, any>);


export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Saffron Villa - Luxury Stay',
    description: 'A 4BHK luxury villa in Lonavala with a private pool, overlooking the Sahyadri mountains. Perfect for family getaways.',
    type: PropertyType.VILLA,
    status: 'active',
    rating: 4.92,
    address: 'Plot 45, Tungarli', location: 'Tungarli', city: 'Lonavala', state: 'Maharashtra', country: 'India', pincode: '410401',
    gpsLocation: { lat: 18.75, lng: 73.40 },
    bedrooms: 4, bathrooms: 5, poolType: 'Private', poolSize: '20x10 ft', parking: true, petFriendly: false,
    amenities: ['Private pool', 'WiFi (High-speed)', 'Air conditioning (Split)', 'BBQ/Grill (outdoor)', 'Caretaker (On-site)', 'Smart TV (55"+)', 'Full kitchen', 'Generator backup'],
    kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: true, wifiPassword: 'guest',
    caretakerAvailable: true, caretakerName: 'Ramesh', checkInTime: '13:00', checkOutTime: '11:00',
    baseGuests: 8, maxGuests: 12, currency: 'INR', baseWeekdayPrice: 15000, baseWeekendPrice: 22000, extraGuestPrice: 1500,
    rules: { ...STANDARD_RULES },
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop'],
    mealPlans: [], addOns: [], pricingRules: [], calendar: {}, 
    reviews: MOCK_REVIEWS, 
    occupancyRate: 78, revenueLastMonth: 120000,
    hostId: 'host1'
  },
  {
    id: '2',
    title: 'Heritage Haveli Jaipur',
    description: 'Restored 19th-century Haveli in the Pink City. Traditional decor with modern amenities.',
    type: PropertyType.HOMESTAY,
    status: 'active',
    rating: 4.70,
    address: 'Old City', location: 'Pink City', city: 'Jaipur', state: 'Rajasthan', country: 'India', pincode: '302002',
    gpsLocation: { lat: 26.91, lng: 75.78 },
    bedrooms: 3, bathrooms: 3, poolType: 'NA', parking: false, petFriendly: true,
    amenities: ['WiFi (High-speed)', 'Breakfast included', 'Air conditioning (Split)', 'Library/Books', 'Landscaped garden', 'Heritage decor'],
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
      amenities: ['Private pool', 'WiFi (High-speed)', 'Air conditioning (Split)', 'Beach Access', 'Caretaker (On-site)', 'BBQ/Grill (outdoor)', 'Sound system', 'Full kitchen'],
      kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: true,
      caretakerAvailable: true, caretakerName: 'Suresh', checkInTime: '14:00', checkOutTime: '11:00',
      baseGuests: 10, maxGuests: 15, currency: 'INR', baseWeekdayPrice: 25000, baseWeekendPrice: 35000, extraGuestPrice: 2000,
      rules: { ...STANDARD_RULES, petsAllowed: true },
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop'],
      mealPlans: [], addOns: [], pricingRules: [], calendar: {}, reviews: [], occupancyRate: 85, revenueLastMonth: 450000,
      hostId: 'host1'
  },
  {
      id: 'maintenance_1',
      title: 'Old Stone Cottage',
      description: 'Undergoing structural repairs for the roof.',
      type: PropertyType.COTTAGE,
      status: 'maintenance',
      maintenanceStartedAt: getDate(-65),
      rating: 4.5,
      address: 'Hill Top', location: 'Manali', city: 'Manali', state: 'Himachal Pradesh', country: 'India', pincode: '175131',
      gpsLocation: { lat: 32.2396, lng: 77.1887 },
      bedrooms: 2, bathrooms: 1, poolType: 'NA', parking: false, petFriendly: true,
      amenities: ['WiFi (High-speed)', 'Heater', 'Fireplace (Wood)'],
      kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: false,
      caretakerAvailable: false, checkInTime: '12:00', checkOutTime: '10:00',
      baseGuests: 4, maxGuests: 4, currency: 'INR', baseWeekdayPrice: 5000, baseWeekendPrice: 6000, extraGuestPrice: 0,
      rules: { ...STANDARD_RULES },
      images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2565&auto=format&fit=crop'],
      mealPlans: [], addOns: [], pricingRules: [], calendar: {}, reviews: [], occupancyRate: 0, revenueLastMonth: 0,
      hostId: 'host1'
  }
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
        hostUnreadCount: 2,
        guestUnreadCount: 0,
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
        hostUnreadCount: 0,
        guestUnreadCount: 0,
        messages: [
            { id: 'm1', senderId: 'host', text: 'Yes, breakfast is included.', timestamp: 'Yesterday', status: 'read' },
            { id: 'm2', senderId: 'guest', text: 'Great, thanks!', timestamp: 'Yesterday', status: 'read' }
        ]
    }
];
