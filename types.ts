
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
    checkInTime: string;
    checkOutTime: string;
    standardOccupancy: number;
    maxOccupancy: number;
    extraGuestPolicy: string;
    chefAvailable: boolean;
    kitchenUsagePolicy: string;
    securityDeposit: number;
    refundPolicy: string;
    cancellationPolicy: string;
    petsAllowed: boolean;
    petDeposit: number; 
    petSanitationFee: number;
    petPoolPolicy: string;
    quietHours: string;
    smokingPolicy: string;
    cleaningPolicy: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: 'active' | 'draft' | 'maintenance';
  rating?: number;
  hostId?: string;
  address: string;
  location: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gpsLocation: { lat: number; lng: number };
  bedrooms: number;
  bathrooms: number;
  poolType: 'Private' | 'Shared' | 'NA';
  poolSize?: string;
  parking: boolean;
  petFriendly: boolean;
  amenities: string[];
  kitchenAvailable: boolean;
  nonVegAllowed: boolean;
  mealsAvailable: boolean;
  wifiPassword?: string;
  rules?: PropertyRules;
  caretakerAvailable: boolean;
  caretakerName?: string;
  caretakerNumber?: string;
  checkInTime: string;
  checkOutTime: string;
  baseGuests: number;
  maxGuests: number;
  currency: string;
  baseWeekdayPrice: number;
  baseWeekendPrice: number;
  extraGuestPrice: number;
  pricingRules: PricingRule[];
  calendar?: Record<string, DaySettings>;
  images: string[];
  mealPlans: MealPlan[];
  addOns: AddOnService[];
  reviews?: Review[];
  occupancyRate: number;
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

export interface Message {
    id: string;
    senderId: string;
    senderRole: UserRole; // 'host' | 'guest' | 'service_provider'
    text: string;
    timestamp: any; // Firestore Timestamp
    status: 'sent' | 'delivered' | 'read' | 'blocked';
}

export interface Conversation {
    id: string;
    participants: string[]; // [hostId, guestId]
    propertyId?: string;
    propertyName?: string;
    
    // Denormalized data for list view
    guestId: string;
    guestName: string;
    guestAvatar: string;
    
    hostId: string;
    hostName: string;
    hostAvatar: string;

    lastMessage: string;
    lastMessageTime: any;
    unreadCount: number;
    messages?: any[];
}
