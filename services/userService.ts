
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { HostProfile, UserRole, Property, DaySettings } from '../types';

const PROFILE_COLLECTION = 'profiles';
const BOOKING_COLLECTION = 'bookings';
const CONV_COLLECTION = 'conversations';
const PROP_COLLECTION = 'properties';

export const fetchUserProfile = async (userId: string): Promise<HostProfile | null> => {
    try {
        const docRef = doc(db, PROFILE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as HostProfile;
        }
        return null;
    } catch (e) {
        console.error("Error fetching profile", e);
        return null;
    }
};

export const saveUserProfile = async (userId: string, role: UserRole, profile: HostProfile) => {
    try {
        const batch = writeBatch(db);

        // 1. Update Main Profile Document
        const profileRef = doc(db, PROFILE_COLLECTION, userId);
        batch.set(profileRef, profile, { merge: true });

        // 2. Propagate to BOOKINGS (Active/Pending)
        // We update the denormalized name/avatar in booking docs to ensure history reflects current details
        const bookingQueryField = role === UserRole.HOST ? 'hostId' : 'guestId';
        const bookingUpdateData = role === UserRole.HOST 
            ? { hostName: profile.name, hostAvatar: profile.avatar }
            : { guestName: profile.name, guestAvatar: profile.avatar };

        const bookingsQ = query(collection(db, BOOKING_COLLECTION), where(bookingQueryField, '==', userId));
        const bookingSnaps = await getDocs(bookingsQ);
        
        bookingSnaps.forEach(doc => {
            batch.update(doc.ref, bookingUpdateData);
        });

        // 3. Propagate to CONVERSATIONS
        // Conversations store participant names/avatars for list view performance
        const convQueryField = role === UserRole.HOST ? 'hostId' : 'guestId';
        const convUpdateData = role === UserRole.HOST
            ? { hostName: profile.name, hostAvatar: profile.avatar }
            : { guestName: profile.name, guestAvatar: profile.avatar };

        const convQ = query(collection(db, CONV_COLLECTION), where(convQueryField, '==', userId));
        const convSnaps = await getDocs(convQ);

        convSnaps.forEach(doc => {
            batch.update(doc.ref, convUpdateData);
        });

        // Commit Batch for Profile, Bookings, and Conversations
        await batch.commit();

        // 4. Propagate to HOST CALENDARS (If the updated user is a GUEST)
        // The Host Calendar Grid displays 'guestName'. This is stored inside the complex 'calendar' map on Property documents.
        // We cannot use batch for this easily because we need to read the property first to get the current calendar object.
        if (role === UserRole.GUEST && bookingSnaps.size > 0) {
            // Find unique properties involved in this guest's bookings
            const propIds = new Set<string>();
            const bookingsMap: Record<string, any[]> = {}; // propId -> [bookings]

            bookingSnaps.forEach(b => {
                const data = b.data();
                // Only update active bookings references on the calendar
                if (data.status === 'confirmed' || data.status === 'pending') {
                    propIds.add(data.propertyId);
                    if (!bookingsMap[data.propertyId]) bookingsMap[data.propertyId] = [];
                    bookingsMap[data.propertyId].push({ ...data, id: b.id });
                }
            });

            // For each property, update the specific days in the calendar map
            for (const propId of Array.from(propIds)) {
                try {
                    const propRef = doc(db, PROP_COLLECTION, propId);
                    const propSnap = await getDoc(propRef);
                    if (propSnap.exists()) {
                        const propData = propSnap.data() as Property;
                        const calendar = propData.calendar || {};
                        let hasChange = false;

                        bookingsMap[propId].forEach(booking => {
                            // Calculate range and update days
                            const start = new Date(booking.startDate);
                            const end = new Date(booking.endDate);
                            
                            // Loop through dates of the booking
                            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                                const dateStr = d.toISOString().split('T')[0];
                                
                                // Check if this calendar day belongs to the booking (by ID or legacy note matching)
                                if (calendar[dateStr] && (calendar[dateStr].bookingId === booking.id || calendar[dateStr].note?.includes(booking.bookingCode))) {
                                    // Update the name
                                    calendar[dateStr].guestName = profile.name; 
                                    hasChange = true;
                                }
                            }
                        });

                        if (hasChange) {
                            await setDoc(propRef, { calendar }, { merge: true });
                        }
                    }
                } catch (err) {
                    console.error(`Failed to propagate guest name to property ${propId}`, err);
                }
            }
        }

        return true;
    } catch (e) {
        console.error("Failed to propagate profile updates", e);
        throw e;
    }
};
