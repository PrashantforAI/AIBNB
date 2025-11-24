
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HostDashboard } from './pages/HostDashboard';
import { PropertyList } from './pages/PropertyList';
import { PropertyEditor } from './pages/PropertyEditor';
import { CalendarManager } from './pages/CalendarManager';
import { GuestPropertyDetails } from './pages/GuestPropertyDetails';
import { GuestDashboard } from './pages/GuestDashboard';
import { AIChat } from './components/AIChat';
import { MOCK_PROPERTIES, AI_SYSTEM_INSTRUCTION, AI_GUEST_INSTRUCTION } from './constants';
import { Property, DaySettings, Booking, SearchCriteria } from './types';
import { fetchProperties, savePropertyToDb } from './services/propertyService';
import { createBooking } from './services/bookingService';
import { Loader2, AlertTriangle, User, ShieldCheck } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebaseConfig';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
  const [previewProperty, setPreviewProperty] = useState<Property | undefined>(undefined);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  
  // User Mode: 'host' or 'guest'
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host');

  // Search State (Lifted)
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
      location: '',
      checkIn: '',
      checkOut: '',
      adults: 2,
      children: 0
  });

  // Load properties from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setPermissionError(false);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firebase Connection Timeout")), 5000)
      );

      try {
        try {
            await signInAnonymously(auth);
        } catch (authErr) {
            console.warn("Auth failed, trying guest access", authErr);
        }

        const data: any = await Promise.race([fetchProperties(), timeoutPromise]);
        
        if (data && data.length > 0) {
            setProperties(data);
        } else {
            await Promise.all(MOCK_PROPERTIES.map(p => savePropertyToDb(p)));
            setProperties(MOCK_PROPERTIES);
        }
      } catch (e: any) {
        console.warn("Fallback to mock data.", e);
        if (e?.code === 'permission-denied' || e?.message?.includes('permissions')) {
            setPermissionError(true);
        }
        setProperties(MOCK_PROPERTIES);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setIsEditorOpen(false);
    setPreviewProperty(undefined);
  };

  const handleEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setIsEditorOpen(true);
  };

  const handlePreviewProperty = (prop: Property) => {
    setPreviewProperty(prop);
    // When previewing, switch to guest mode context implicitly if not already
    // but we can keep the userMode as 'host' if they are just previewing.
    // However, if they want to chat as a guest, we should probably treat it as guest view.
    // For now, let's keep it simple: preview = guest view.
    setActivePage('guest-view');
  };

  const handleAddNew = () => {
    setEditingProperty(undefined);
    setIsEditorOpen(true);
  };

  const handleSaveProperty = async (prop: Property) => {
    const newId = prop.id || Date.now().toString();
    const propertyToSave = { ...prop, id: newId };
    
    if (editingProperty) {
      setProperties(prev => prev.map(p => p.id === propertyToSave.id ? propertyToSave : p));
    } else {
      setProperties(prev => [...prev, propertyToSave]);
    }
    
    setIsEditorOpen(false);
    setActivePage('listings');

    try {
        await savePropertyToDb(propertyToSave);
    } catch (e: any) {
        if (e?.code === 'permission-denied') setPermissionError(true);
    }
  };

  const handleUpdateProperty = async (updatedProp: Property) => {
      setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
      try {
          await savePropertyToDb(updatedProp);
      } catch (e: any) {
          if (e?.code === 'permission-denied') setPermissionError(true);
      }
  };

  // AI Booking Handler
  const handleAiBooking = async (bookingProposal: any) => {
      // The AI proposes a booking, here we finalize it
      // Find the property to get thumbnail
      const prop = properties.find(p => p.id === bookingProposal.propertyId);
      await createBooking({
          ...bookingProposal,
          location: prop?.city || '',
          thumbnail: prop?.images[0] || '',
          status: 'confirmed'
      });
      // Optionally refresh properties to reflect calendar block? 
      // For now, local state might lag until refresh, but that's okay for MVP.
  };

  const toggleUserMode = () => {
      const newMode = userMode === 'host' ? 'guest' : 'host';
      setUserMode(newMode);
      if (newMode === 'guest') {
          setActivePage('guest-dashboard');
      } else {
          setActivePage('dashboard');
      }
  };

  // Helper: Check Availability
  const checkAvailability = (property: Property, start: string, end: string): boolean => {
      if (!start || !end) return true; // Available if no dates selected
      if (!property.calendar) return true;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const loop = new Date(startDate);
      while(loop < endDate) {
          const dateStr = loop.toISOString().split('T')[0];
          const day = property.calendar[dateStr];
          if (day && (day.status === 'booked' || day.status === 'blocked')) {
              return false;
          }
          loop.setDate(loop.getDate() + 1);
      }
      return true;
  };

  // Filter properties based on search
  const filteredProperties = properties.filter(p => {
      // 1. Location Match
      if (searchCriteria.location && !p.city.toLowerCase().includes(searchCriteria.location.toLowerCase()) && !p.location.toLowerCase().includes(searchCriteria.location.toLowerCase())) {
          return false;
      }
      // 2. Guest Capacity
      const totalGuests = searchCriteria.adults + searchCriteria.children;
      if (p.maxGuests < totalGuests) return false;
      
      // 3. Calendar Availability
      if (searchCriteria.checkIn && searchCriteria.checkOut) {
          if (!checkAvailability(p, searchCriteria.checkIn, searchCriteria.checkOut)) return false;
      }
      
      return true;
  });

  // --- AI CONTEXT GENERATION ---
  const generateGlobalContext = () => {
    // HOST CONTEXT: Full Access
    if (userMode === 'host') {
        const portfolioSummary = properties.map(p => {
            const upcomingBookings = (Object.values(p.calendar || {}) as DaySettings[])
                .filter(d => d.status === 'booked' && d.date >= new Date().toISOString().split('T')[0])
                .map(d => ({ date: d.date, guest: d.guestName, price: d.price }))
                .sort((a, b) => a.date.localeCompare(b.date));

            return {
                id: p.id,
                title: p.title,
                location: `${p.city}, ${p.state}`,
                financials: { revenueLastMonth: p.revenueLastMonth, occupancyRate: p.occupancyRate },
                pricing: { weekday: p.baseWeekdayPrice, weekend: p.baseWeekendPrice },
                upcomingBookings: upcomingBookings.slice(0, 5),
                staff: { caretaker: p.caretakerAvailable ? p.caretakerName : 'None' }
            };
        });

        return JSON.stringify({
            role: 'HOST',
            navigation: { currentPage: activePage, viewMode: isEditorOpen ? 'Editor' : 'Dashboard' },
            userPortfolio: { totalProperties: properties.length, properties: portfolioSummary },
            activeItemDetail: editingProperty || previewProperty || null 
        });
    } 
    
    // GUEST CONTEXT: Sanitized Access
    else {
        // Only expose the property currently being viewed or summary list
        const activeProp = previewProperty;
        
        // If viewing a specific property, give detailed info but hide financials/other bookings
        if (activeProp) {
            return JSON.stringify({
                role: 'GUEST',
                currentSearch: searchCriteria,
                viewingProperty: {
                    id: activeProp.id,
                    title: activeProp.title,
                    description: activeProp.description,
                    amenities: activeProp.amenities,
                    meals: activeProp.mealPlans,
                    addOns: activeProp.addOns,
                    pricing: { weekday: activeProp.baseWeekdayPrice, weekend: activeProp.baseWeekendPrice },
                    houseRules: { petFriendly: activeProp.petFriendly, checkIn: activeProp.checkInTime },
                    location: activeProp.location,
                    calendarAvailability: activeProp.calendar // AI needs this to check dates
                },
                navigation: 'PropertyDetails'
            });
        }

        // If on dashboard, give generic list for search
        return JSON.stringify({
            role: 'GUEST',
            currentSearch: searchCriteria, // Pass search state to AI
            availableProperties: filteredProperties.map(p => ({ 
                id: p.id,
                title: p.title, 
                city: p.city, 
                price: p.baseWeekdayPrice, 
                amenities: p.amenities 
            })),
            navigation: 'GuestDashboard'
        });
    }
  };

  const aiContext = generateGlobalContext();
  const systemInstruction = userMode === 'host' ? AI_SYSTEM_INSTRUCTION : AI_GUEST_INSTRUCTION;
  
  // Proactive Nudge logic
  let nudgeMessage = undefined;
  if (userMode === 'guest') {
      if (activePage === 'guest-view' && previewProperty) {
         nudgeMessage = `Namaste! Welcome to ${previewProperty.title}. Would you like to check availability or see the dinner menu?`;
      } else if (activePage === 'guest-dashboard' && searchCriteria.location) {
          const totalGuests = searchCriteria.adults + searchCriteria.children;
          nudgeMessage = `I see you're looking for a stay in ${searchCriteria.location} for ${totalGuests} guests. Are you planning a celebration or just relaxing?`;
      }
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500 gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
              <p className="animate-pulse">Loading AI BNB...</p>
          </div>
      );
  }

  return (
    <div className="text-gray-900 font-sans flex flex-col min-h-screen relative">
      
      {/* Permission Error */}
      {permissionError && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-start gap-3 shadow-lg z-50">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                  <p className="font-bold">Database Access Blocked</p>
                  <p className="opacity-90 mt-1">Check Firebase Security Rules.</p>
              </div>
              <button onClick={() => setPermissionError(false)} className="ml-auto">✕</button>
          </div>
      )}

      {/* Mode Toggle (Floating Debug/Demo Control) */}
      <div className="fixed bottom-6 left-6 z-50">
          <button 
            onClick={toggleUserMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border text-sm font-bold transition-all ${
                userMode === 'host' 
                ? 'bg-gray-900 text-white border-gray-800' 
                : 'bg-white text-brand-600 border-brand-200'
            }`}
          >
              {userMode === 'host' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {userMode === 'host' ? 'Host Mode' : 'Guest Mode'}
          </button>
      </div>

      {userMode === 'host' ? (
        <Layout activePage={activePage} onNavigate={handleNavigate}>
            {isEditorOpen ? (
            <PropertyEditor 
                initialData={editingProperty} 
                onSave={handleSaveProperty} 
                onCancel={() => setIsEditorOpen(false)} 
            />
            ) : (
            <>
                {activePage === 'dashboard' && <HostDashboard properties={properties} onNavigate={handleNavigate} />}
                {activePage === 'listings' && <PropertyList properties={properties} onEdit={handleEditProperty} onAddNew={handleAddNew} onPreview={handlePreviewProperty} />}
                {activePage === 'calendar' && <CalendarManager properties={properties} onUpdateProperty={handleUpdateProperty} />}
                {activePage === 'guest-view' && previewProperty && (
                    // Host previewing guest view
                     <div className="text-gray-900 font-sans">
                        <GuestPropertyDetails 
                            property={previewProperty} 
                            onBack={() => handleNavigate('listings')} 
                        />
                    </div>
                )}
            </>
            )}
        </Layout>
      ) : (
        // GUEST MODE LAYOUT
        <>
            {activePage === 'guest-dashboard' && (
                <GuestDashboard 
                    properties={filteredProperties} 
                    onNavigate={handleNavigate} 
                    onPreview={handlePreviewProperty}
                    searchCriteria={searchCriteria}
                    setSearchCriteria={setSearchCriteria}
                />
            )}
            {activePage === 'guest-view' && previewProperty && (
                <GuestPropertyDetails 
                    property={previewProperty} 
                    onBack={() => setActivePage('guest-dashboard')} 
                />
            )}
        </>
      )}
      
      <AIChat 
        context={aiContext} 
        systemInstruction={systemInstruction}
        nudgeMessage={nudgeMessage}
        properties={properties}
        onPreview={handlePreviewProperty}
        onBook={handleAiBooking}
      />
    </div>
  );
}

export default App;
