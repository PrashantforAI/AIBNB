import { Timestamp } from 'firebase-admin/firestore';

// User Roles supported in the application
export type UserRole = 'guest' | 'host' | 'agent';

// Interface for User documents stored in 'users' collection
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  isVerified: boolean;
}

// Interface for Property documents stored in 'properties' collection
export interface Property {
  id?: string;
  hostId: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input payload for the addProperty helper
export interface AddPropertyPayload {
  title: string;
  description: string;
  location: Property['location'];
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
}

// Expected structure for AI Router requests
export interface AICoreRequest {
  userRole: UserRole;
  intent: 
    | 'generate_description' 
    | 'add_property' 
    | 'ask_support' 
    | 'host_onboarding_step' 
    | 'get_pricing_suggestion' 
    | 'analyze_image' 
    | 'check_compliance' 
    | 'guest_search';
  payload: any;
  uid?: string;
}