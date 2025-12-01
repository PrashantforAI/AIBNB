
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Property } from '../types';

const COLLECTION_NAME = 'properties';

// Fetch all properties
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const properties: Property[] = [];
    querySnapshot.forEach((doc) => {
      properties.push(doc.data() as Property);
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

// Delete a property
export const deletePropertyFromDb = async (propertyId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, propertyId));
  } catch (error) {
    console.error("Error deleting property: ", error);
    throw error;
  }
};
