
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, query, getDocs } from 'firebase/firestore';
import { Booking, Property } from '../types';

const BOOKING_COLLECTION = 'bookings';
const PROPERTY_COLLECTION = 'properties';

// Helper to get array of date strings between start and end
const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    const dt = new Date(startDate);
    const end = new Date(endDate);
    
    while (dt < end) {
        dates.push(new Date(dt).toISOString().split('T')[0]);
        dt.setDate(dt.getDate() + 1);
    }
    return dates;
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'status'>): Promise<string> => {
    try {
        const datesToBlock = getDatesInRange(bookingData.startDate, bookingData.endDate);
        const propertyRef = doc(db, PROPERTY_COLLECTION, bookingData.propertyId);

        // 1. Transactional-like Check: Fetch latest property data
        const propertySnap = await getDoc(propertyRef);
        if (!propertySnap.exists()) {
            throw new Error("Property not found");
        }
        
        const property = propertySnap.data() as Property;
        const currentCalendar = property.calendar || {};

        // 2. Server-side Availability Validation
        for (const dateStr of datesToBlock) {
            const day = currentCalendar[dateStr];
            if (day && (day.status === 'booked' || day.status === 'blocked')) {
                throw new Error(`Date ${dateStr} is no longer available.`);
            }
        }

        // 3. Add Booking Record
        // Ensure thumbnail has a value and sanitize undefined fields
        const rawBooking = {
            ...bookingData,
            thumbnail: bookingData.thumbnail || 'https://via.placeholder.com/300?text=No+Image',
            id: '', // Will be set by firestore
            status: 'confirmed'
        };

        // Remove undefined values to prevent Firestore "Unsupported field value: undefined" error
        const safeBooking = JSON.parse(JSON.stringify(rawBooking));
        
        const docRef = await addDoc(collection(db, BOOKING_COLLECTION), safeBooking);
        const bookingId = docRef.id;

        // 4. Update Property Calendar
        const updatedCalendar: any = { ...currentCalendar };
        datesToBlock.forEach(dateStr => {
            updatedCalendar[dateStr] = {
                date: dateStr,
                status: 'booked',
                price: currentCalendar[dateStr]?.price, // Keep existing price if set
                guestName: 'Guest', // In real app, use auth user name
                note: `Booking ID: ${bookingId}`
            };
        });

        // CRITICAL FIX: Sanitize calendar to remove any undefined keys (like price if not set)
        const safeCalendar = JSON.parse(JSON.stringify(updatedCalendar));

        await updateDoc(propertyRef, {
            calendar: safeCalendar
        });

        return bookingId;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const fetchGuestBookings = async (): Promise<Booking[]> => {
    try {
        const q = query(collection(db, BOOKING_COLLECTION));
        const querySnapshot = await getDocs(q);
        const bookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() } as Booking);
        });
        return bookings;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
};
