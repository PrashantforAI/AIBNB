
export enum PropertyType {
  VILLA = 'Villa',
  APARTMENT = 'Apartment',
  HOMESTAY = 'Homestay',
  FARMHOUSE = 'Farmhouse',
  COTTAGE = 'Cottage'
}

export enum UserRole {
  HOST = 'host',
  GUEST = 'guest',
  SERVICE_PROVIDER = 'service_provider'
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface MealPlan {
  type: 'Veg' | 'Non-Veg' | 'Jain' | 'Mixed';
  pricePerHead: number;
  description: string;
  items: string[];
}

export interface AddOnService {
  id: string;
  name: string;
  price: number;
  unit: 'per_stay' | 'per_day' | 'per_person';
  description: string;
}

export interface PricingRule {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[]; // 0 = Sunday
  priceModifier: number; // Percentage or fixed amount logic could be applied
  type: 'seasonal' | 'weekend' | 'festival';
}

export interface DaySettings {
  date: string; // YYYY-MM-DD
  price?: number;
  status: 'available' | 'booked' | 'blocked';
  minStay?: number;
  note?: string; // e.g., "Blocked for painting"
  guestName?: string; // For booked dates
}

export interface Review {
    id: string;
    guestName: string;
    rating: number;
    date: string;
    comment: string;
}

export interface Booking {
    id: string;
    propertyId: string;
    propertyName: string;
    location: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    guestCount: number;
    totalPrice: number;
    status: 'confirmed' | 'pending' | 'cancelled';
    thumbnail: string;
    userId?: string; // Optional for now
}

export interface PropertyRules {
    // I. Check-in/out
    checkInTime: string;
    checkOutTime: string;
    standardOccupancy: number;
    maxOccupancy: number;
    extraGuestPolicy: string;

    // II. Meals & Kitchen
    chefAvailable: boolean;
    kitchenUsagePolicy: string; // e.g. "Reheating only"
    
    // III. Security
    securityDeposit: number;
    refundPolicy: string;
    cancellationPolicy: string;

    // IV. Pets
    petsAllowed: boolean;
    petDeposit: number; // 10k/15k logic
    petSanitationFee: number;
    petPoolPolicy: string; // "Strictly not allowed"

    // V. General
    quietHours: string; // "10:00 PM to 7:00 AM"
    smokingPolicy: string;
    cleaningPolicy: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: 'active' | 'draft' | 'maintenance';
  rating?: number; // Optional rating field
  hostId?: string; // Link to host profile
  
  // Location Details
  address: string;
  location: string; // General area name (e.g. "Koregaon Park")
  city: string;
  state: string;
  country: string;
  pincode: string;
  gpsLocation: { lat: number; lng: number };

  // Structure & Facilities
  bedrooms: number;
  bathrooms: number;
  poolType: 'Private' | 'Shared' | 'NA';
  poolSize?: string;
  parking: boolean;
  petFriendly: boolean;
  
  // Amenities & Rules
  amenities: string[];
  kitchenAvailable: boolean; // Can guests use kitchen?
  nonVegAllowed: boolean; // Is non-veg cooking allowed?
  mealsAvailable: boolean; // Does host provide meals?
  wifiPassword?: string;
  
  // Detailed Rules Object
  rules?: PropertyRules;

  // Staff & Logistics
  caretakerAvailable: boolean;
  caretakerName?: string;
  caretakerNumber?: string;
  checkInTime: string;
  checkOutTime: string;

  // Guests
  baseGuests: number;
  maxGuests: number;
  
  // Pricing
  currency: string;
  baseWeekdayPrice: number;
  baseWeekendPrice: number;
  extraGuestPrice: number;
  pricingRules: PricingRule[];
  
  // Calendar Overrides (Key: YYYY-MM-DD)
  calendar?: Record<string, DaySettings>;

  // Content & Services
  images: string[];
  mealPlans: MealPlan[];
  addOns: AddOnService[];
  reviews?: Review[];

  // Stats
  occupancyRate: number; // 0-100 for stats
  revenueLastMonth: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface SearchCriteria {
    location: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
}

export interface ServiceTask {
    id: string;
    type: 'cleaning' | 'cooking' | 'maintenance' | 'meet_greet';
    propertyId: string;
    propertyName: string;
    bookingId?: string;
    date: string;
    time: string;
    status: 'pending' | 'completed' | 'cancelled';
    details: string;
    assignedTo: string;
}

export interface AIAction {
    type: 'NAVIGATE' | 'UPDATE_SEARCH' | 'SET_ROLE';
    payload: any;
}

export interface HostProfile {
    id: string;
    name: string;
    avatar: string;
    isSuperhost: boolean;
    joinedDate: string;
    bio: string;
    languages: string[];
    responseRate: number;
    responseTime: string;
    reviewsCount: number;
    rating: number;
    verified: boolean;
}
