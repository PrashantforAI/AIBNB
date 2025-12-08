
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, query, getDocs, where, orderBy } from 'firebase/firestore';
import { Booking, Property, DaySettings } from '../types';
import { startConversation, updateConversationBooking } from './chatService';
import { sanitizeForFirestore } from './propertyService';

const BOOKING_COLLECTION = 'bookings';
const PROPERTY_COLLECTION = 'properties';
const CONV_COLLECTION = 'conversations';

export const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    const dt = new Date(startDate); 
    const end = new Date(endDate);
    
    // Iterate until BEFORE end date (Nights logic)
    // If you book 22 to 24, you occupy night of 22 and 23. You leave morning of 24.
    while (dt < end) {
        dates.push(new Date(dt).toISOString().split('T')[0]);
        dt.setDate(dt.getDate() + 1);
    }
    return dates;
};

// --- CENTRALIZED AVAILABILITY LOGIC ---
export const isDateRangeAvailable = (property: Property, startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true; 
    
    // We check availability for the NIGHTS of the stay.
    // [Start, End) -> Start Inclusive, End Exclusive.
    const requestedNights = getDatesInRange(startDate, endDate);
    const calendar = property.calendar || {};

    for (const dateStr of requestedNights) {
        const daySettings = calendar[dateStr];
        // If a night is booked or blocked, the range is unavailable
        if (daySettings && (daySettings.status === 'booked' || daySettings.status === 'blocked')) {
            return false;
        }
    }
    return true;
};

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
        if (!bookingId) return null;
        const docRef = doc(db, BOOKING_COLLECTION, bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Booking;
        }
        return null;
    } catch (error) {
        console.error("Error fetching booking:", error);
        return null;
    }
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'bookingCode' | 'paymentStatus' | 'createdAt'>): Promise<string> => {
    try {
        const nightsToBlock = getDatesInRange(bookingData.startDate, bookingData.endDate);
        const propertyRef = doc(db, PROPERTY_COLLECTION, bookingData.propertyId);

        // 1. Check Property Data & Availability
        const propertySnap = await getDoc(propertyRef);
        if (!propertySnap.exists()) {
            throw new Error("Property not found");
        }
        
        const property = propertySnap.data() as Property;
        const currentCalendar = property.calendar || {};

        for (const dateStr of nightsToBlock) {
            const day = currentCalendar[dateStr];
            if (day && (day.status === 'booked' || day.status === 'blocked')) {
                throw new Error(`Date ${dateStr} is no longer available.`);
            }
        }

        // 2. Prepare Booking Object
        const bookingCode = `#RES-${Math.floor(1000 + Math.random() * 9000)}`;
        const rawBooking = {
            ...bookingData,
            guestName: bookingData.guestName || 'Guest',
            guestAvatar: bookingData.guestAvatar || '',
            
            // Explicitly save host details for the receipt
            hostId: bookingData.hostId || property.hostId || 'host1',
            hostName: bookingData.hostName || 'Pine Stays',
            hostAvatar: bookingData.hostAvatar || '',

            propertyName: property.title, // Cache for receipts
            propertyImage: property.images[0] || '', // Save main image for the receipt

            thumbnail: bookingData.thumbnail || property.images[0] || 'https://via.placeholder.com/300',
            id: '', 
            status: 'pending', 
            bookingCode,
            paymentStatus: 'paid', // Simulating successful payment
            createdAt: new Date().toISOString(),
            notes: bookingData.notes || '',
            paymentMethod: bookingData.paymentMethod || 'credit_card'
        };

        const safeBooking = sanitizeForFirestore(rawBooking);
        
        const docRef = await addDoc(collection(db, BOOKING_COLLECTION), safeBooking);
        const bookingId = docRef.id;

        // 3. Update Property Calendar (Yellow/Pending state)
        const updatedCalendar: any = { ...currentCalendar };
        nightsToBlock.forEach(dateStr => {
            // Check for existing price, fallback to base price logic if missing
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
            const fallbackPrice = isWeekend ? (property.baseWeekendPrice || 0) : (property.baseWeekdayPrice || 0);
            
            const existingPrice = currentCalendar[dateStr]?.price;
            const priceToSet = existingPrice !== undefined ? existingPrice : fallbackPrice;

            updatedCalendar[dateStr] = {
                date: dateStr,
                status: 'booked',
                price: priceToSet,
                guestName: bookingData.guestName || 'Guest',
                isPending: true, // FLAG: Yellow in Calendar
                note: `Pending: ${bookingCode}`,
                bookingId: bookingId
            };
        });

        await updateDoc(propertyRef, {
            calendar: updatedCalendar
        });

        // 4. Update Chat Context
        try {
            await startConversation(
                rawBooking.hostId,
                rawBooking.userId || 'guest_user_1',
                rawBooking.guestName,
                rawBooking.guestAvatar,
                rawBooking.hostName,
                rawBooking.hostAvatar,
                property.title,
                {
                    bookingId: bookingId,
                    bookingStatus: 'pending',
                    startDate: rawBooking.startDate,
                    endDate: rawBooking.endDate,
                    guestCount: rawBooking.guestCount,
                    totalPrice: rawBooking.totalPrice
                }
            );
        } catch (chatError) {
            console.warn("Failed to sync booking to chat", chatError);
        }

        return bookingId;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled', propertyId: string, startDate: string, endDate: string) => {
    try {
        if (!bookingId) throw new Error("Invalid booking ID");

        // 1. Update Booking Document
        const bookingRef = doc(db, BOOKING_COLLECTION, bookingId);
        await updateDoc(bookingRef, { status });

        // 2. Update Property Calendar
        const propertyRef = doc(db, PROPERTY_COLLECTION, propertyId);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
             const property = propertySnap.data() as Property;
             const calendar = { ...property.calendar };
             // Use getDatesInRange which returns NIGHTS
             const nights = getDatesInRange(startDate, endDate);
             
             // Fetch booking to get codes/names if confirming
             let bookingDetails: Booking | null = null;
             if (status === 'confirmed') {
                 bookingDetails = await getBookingById(bookingId);
             }

             nights.forEach(dateStr => {
                 const currentDay = calendar[dateStr];
                 
                 // Fallback price logic for safety
                 const dateObj = new Date(dateStr);
                 const dayOfWeek = dateObj.getDay();
                 const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
                 const fallbackPrice = isWeekend ? (property.baseWeekendPrice || 0) : (property.baseWeekdayPrice || 0);

                 if (status === 'cancelled') {
                     // Only clear if it belongs to THIS booking
                     if (currentDay && (currentDay.bookingId === bookingId || currentDay.note?.includes(bookingId))) {
                        calendar[dateStr] = {
                            date: dateStr,
                            status: 'available',
                            price: currentDay.price !== undefined ? currentDay.price : fallbackPrice
                        };
                     }
                 } else if (status === 'confirmed') {
                     // Confirm: Turn Yellow -> Red
                     if (currentDay && currentDay.bookingId === bookingId) {
                         calendar[dateStr] = {
                             ...currentDay,
                             status: 'booked',
                             isPending: false, // FLAG: Red in Calendar
                             guestName: bookingDetails?.guestName || currentDay.guestName,
                             note: `Confirmed: ${bookingDetails?.bookingCode}`
                         };
                     } else if (!currentDay) {
                         // Fallback creation (should rarely happen if flow is correct)
                         calendar[dateStr] = {
                             date: dateStr,
                             status: 'booked',
                             isPending: false,
                             bookingId: bookingId,
                             price: fallbackPrice,
                             guestName: bookingDetails?.guestName || 'Guest',
                             note: `Confirmed: ${bookingDetails?.bookingCode}`
                         };
                     }
                 }
             });
             
             await updateDoc(propertyRef, { calendar });
        }

        // 3. Update Chat Context
        try {
            // Find the conversation related to this booking (if any)
            const q = query(
                collection(db, CONV_COLLECTION),
                where('bookingId', '==', bookingId)
            );
            const snaps = await getDocs(q);
            snaps.forEach(async (docSnap) => {
                await updateConversationBooking(docSnap.id, {
                    bookingStatus: status
                });
            });
        } catch (chatError) {
            console.warn("Failed to sync booking status to chat", chatError);
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
            bookings.push({ ...doc.data(), id: doc.id } as Booking);
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
            bookings.push({ ...doc.data(), id: doc.id } as Booking);
        });
        return bookings;
    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        return [];
    }
};

export const fetchHostBookings = async (hostId: string): Promise<Booking[]> => {
    try {
        // In a real app we'd filter by hostId, but here we'll fetch all and filter client side 
        // to match the demo data structure where hostId might be 'host1'
        const q = query(collection(db, BOOKING_COLLECTION));
        const querySnapshot = await getDocs(q);
        const bookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Booking;
            if (data.hostId === hostId) {
                bookings.push({ ...data, id: doc.id });
            }
        });
        return bookings;
    } catch (error) {
        console.error("Error fetching host bookings:", error);
        return [];
    }
};
