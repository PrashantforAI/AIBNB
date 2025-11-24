
export enum PropertyType {
  VILLA = 'Villa',
  APARTMENT = 'Apartment',
  HOMESTAY = 'Homestay',
  FARMHOUSE = 'Farmhouse',
  COTTAGE = 'Cottage'
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

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: 'active' | 'draft' | 'maintenance';
  
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
