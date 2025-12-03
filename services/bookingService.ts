
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, query, getDocs, where } from 'firebase/firestore';
import { Booking, Property, DaySettings } from '../types';

const BOOKING_COLLECTION = 'bookings';
const PROPERTY_COLLECTION = 'properties';

// Helper to get array of date strings between start and end
export const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    // Normalize to midnight to avoid timezone offset issues
    const dt = new Date(startDate); 
    const end = new Date(endDate);
    
    while (dt < end) {
        dates.push(new Date(dt).toISOString().split('T')[0]);
        dt.setDate(dt.getDate() + 1);
    }
    return dates;
};

// --- CENTRALIZED AVAILABILITY LOGIC ---

/**
 * Checks if a property is available for a given date range.
 * Returns true if ALL dates in the range are available (not booked/blocked).
 */
export const isDateRangeAvailable = (property: Property, startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true; // If no dates selected, it's "available" for browsing
    
    const requestedDates = getDatesInRange(startDate, endDate);
    const calendar = property.calendar || {};

    for (const dateStr of requestedDates) {
        const daySettings = calendar[dateStr];
        // If a setting exists AND it's not available, return false
        if (daySettings && (daySettings.status === 'booked' || daySettings.status === 'blocked')) {
            return false;
        }
    }
    return true;
};

/**
 * Returns a Set of all unavailable date strings for a property.
 * Used for UI Calendar disabling.
 */
export const getUnavailableDates = (property: Property): Set<string> => {
    const unavailable = new Set<string>();
    const calendar = property.calendar || {};
    
    Object.values(calendar).forEach((day: unknown) => {
        const d = day as DaySettings;
        if (d.status === 'booked' || d.status === 'blocked') {
            unavailable.add(d.date);
        }
    });
    return unavailable;
};

// --------------------------------------

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
    try {
        const docRef = doc(db, BOOKING_COLLECTION, bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Booking;
        }
        return null;
    } catch (error) {
        console.error("Error fetching booking:", error);
        return null;
    }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'bookingCode' | 'paymentStatus' | 'createdAt'>): Promise<string> => {
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
        const bookingCode = `#RES-${Math.floor(1000 + Math.random() * 9000)}`;
        const rawBooking = {
            ...bookingData,
            thumbnail: bookingData.thumbnail || 'https://via.placeholder.com/300?text=No+Image',
            id: '', // Will be set by firestore
            status: 'pending', // Default to pending for approval workflow
            bookingCode,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            // Sanitize potential undefineds
            notes: bookingData.notes || '',
            paymentMethod: bookingData.paymentMethod || 'pay_at_property'
        };

        const safeBooking = JSON.parse(JSON.stringify(rawBooking));
        
        const docRef = await addDoc(collection(db, BOOKING_COLLECTION), safeBooking);
        const bookingId = docRef.id;

        // 4. Update Property Calendar
        // We block the dates as 'booked' but note it is Pending. We LINK the bookingId.
        const updatedCalendar: any = { ...currentCalendar };
        datesToBlock.forEach(dateStr => {
            updatedCalendar[dateStr] = {
                date: dateStr,
                status: 'booked',
                price: currentCalendar[dateStr]?.price, // Keep existing price if set
                guestName: 'Pending Request', 
                note: `Pending Booking ${bookingCode}`,
                bookingId: bookingId // LINKING HERE
            };
        });

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

export const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled', propertyId: string, startDate: string, endDate: string) => {
    try {
        const bookingRef = doc(db, BOOKING_COLLECTION, bookingId);
        await updateDoc(bookingRef, { status });

        const propertyRef = doc(db, PROPERTY_COLLECTION, propertyId);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
             const property = propertySnap.data() as Property;
             const calendar = { ...property.calendar };
             const dates = getDatesInRange(startDate, endDate);

             if (status === 'cancelled') {
                 // Free up dates
                 dates.forEach(dateStr => {
                     // Check if this date is indeed held by this booking
                     const day = calendar[dateStr];
                     if (day && (day.bookingId === bookingId || day.note?.includes(bookingId))) {
                        calendar[dateStr] = {
                            date: dateStr,
                            status: 'available',
                            price: day.price // Preserve price
                            // Remove guestName, note, bookingId
                        };
                     }
                 });
             } else if (status === 'confirmed') {
                 // Update note to remove "Pending"
                 const booking = await getBookingById(bookingId);
                 dates.forEach(dateStr => {
                     if (calendar[dateStr]) {
                         calendar[dateStr].note = `Booking ${booking?.bookingCode}`;
                         calendar[dateStr].guestName = 'Confirmed Guest';
                         calendar[dateStr].status = 'booked';
                         calendar[dateStr].bookingId = bookingId;
                     }
                 });
             }
             
             await updateDoc(propertyRef, { calendar });
        }
    } catch (error) {
        console.error("Error updating booking status:", error);
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

export const fetchPendingBookings = async (): Promise<Booking[]> => {
    try {
        const q = query(collection(db, BOOKING_COLLECTION), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const bookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() } as Booking);
        });
        return bookings;
    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        return [];
    }
};
