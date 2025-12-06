
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Property, DaySettings } from '../types';

const COLLECTION_NAME = 'properties';

// Fetch all properties
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const properties: Property[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Property;
      
      // SHIM: Inject ratings for demo consistency if missing in DB
      // This ensures the "Guest Favorite" badge appears for premium properties
      if (data.rating === undefined) {
          if (data.title?.includes('Saffron') || (data.baseWeekdayPrice && data.baseWeekdayPrice > 12000)) {
              data.rating = 4.92; // Guest Favorite
          } else {
              data.rating = 4.65; // Standard
          }
      }

      // Ensure doc.id takes precedence
      properties.push({ ...data, id: doc.id });
    });
    return properties;
  } catch (error) {
    console.error("Error fetching properties: ", error);
    return [];
  }
};

// Save or Update a property
export const savePropertyToDb = async (property: Property) => {
  try {
    if (!property.id) {
        property.id = Date.now().toString();
    }
    
    // CRITICAL FIX: Firestore throws an error if fields are 'undefined'. 
    // We sanitize the object by stringifying and parsing it, which removes undefined keys.
    const safeData = JSON.parse(JSON.stringify(property));

    // Check payload size roughly
    const size = new Blob([JSON.stringify(safeData)]).size;
    if (size > 950000) { // 950KB limit (Firestore limit is 1MB)
        throw new Error("Property data is too large. Please reduce the number or size of images.");
    }

    await setDoc(doc(db, COLLECTION_NAME, property.id), safeData);
    return property;
  } catch (error) {
    console.error("Error saving property: ", error);
    throw error;
  }
};

// Update specific calendar days (Used by AI Agent)
export const updateCalendarDay = async (propertyId: string, updates: DaySettings[]) => {
    try {
        const propRef = doc(db, COLLECTION_NAME, propertyId);
        const propSnap = await getDoc(propRef);
        
        if (!propSnap.exists()) throw new Error("Property not found");
        
        const property = propSnap.data() as Property;
        const currentCalendar = property.calendar || {};
        
        updates.forEach(update => {
            currentCalendar[update.date] = {
                ...(currentCalendar[update.date] || {}),
                ...update
            };
        });
        
        await updateDoc(propRef, { calendar: currentCalendar });
        return true;
    } catch (e) {
        console.error("Failed to update calendar day", e);
        throw e;
    }
};

// Delete a property
export const deletePropertyFromDb = async (propertyId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
  } catch (error) {
    console.error("Error deleting property: ", error);
    throw error;
  }
};
