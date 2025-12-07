
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HostDashboard } from './pages/HostDashboard';
import { PropertyList } from './pages/PropertyList';
import { PropertyEditor } from './pages/PropertyEditor';
import { CalendarManager } from './pages/CalendarManager';
import { GuestPropertyDetails } from './pages/GuestPropertyDetails';
import { GuestDashboard } from './pages/GuestDashboard';
import { ServiceProviderDashboard } from './pages/ServiceProviderDashboard';
import { HostProfilePage } from './pages/HostProfile';
import { Messages } from './pages/Messages'; 
import { AIChat } from './components/AIChat';
import { MOCK_PROPERTIES, AI_SYSTEM_INSTRUCTION, AI_GUEST_INSTRUCTION, AI_HOST_BRAIN_INSTRUCTION, AI_SERVICE_INSTRUCTION, MOCK_TASKS, MOCK_HOST_PROFILE } from './constants';
import { Property, DaySettings, Booking, SearchCriteria, UserRole, ServiceTask, AIAction, HostProfile } from './types';
import { fetchProperties, savePropertyToDb, updateCalendarDay } from './services/propertyService';
import { createBooking, fetchGuestBookings, fetchPendingBookings, updateBookingStatus } from './services/bookingService';
import { startConversation, sendMessage } from './services/chatService'; 
import { fetchUserProfile, saveUserProfile } from './services/userService';
import { Loader2, AlertTriangle, User, ShieldCheck, Sun, Moon, Briefcase } from 'lucide-react';
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
  
  const [viewMode, setViewMode] = useState<'landing-chat' | 'dashboard'>('landing-chat');
  
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST); 
  const [tasks, setTasks] = useState<ServiceTask[]>(MOCK_TASKS);
  
  // HOST PROFILE STATE
  const [hostProfile, setHostProfile] = useState<HostProfile>(MOCK_HOST_PROFILE);
  
  // GUEST PROFILE STATE
  const [guestProfile, setGuestProfile] = useState<HostProfile>({
      id: 'guest_user_1',
      name: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
      isSuperhost: false,
      joinedDate: 'December 2024',
      bio: 'Travel enthusiast looking for unique stays.',
      languages: ['English', 'Hindi'],
      responseRate: 100,
      responseTime: 'within an hour',
      reviewsCount: 0,
      rating: 5.0,
      verified: true
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // New state to hold user bookings for AI context
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  const currentUserId = userRole === UserRole.HOST ? 'host1' : userRole === UserRole.GUEST ? 'guest_user_1' : 'sp1';
  
  const currentUserName = userRole === UserRole.HOST ? hostProfile.name : guestProfile.name;
  const currentUserAvatar = userRole === UserRole.HOST 
      ? hostProfile.avatar 
      : guestProfile.avatar;

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
      location: '', checkIn: '', checkOut: '', adults: 2, children: 0
  });

  useEffect(() => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  const loadData = async () => {
    setIsLoading(true);
    setPermissionError(false);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase Timeout")), 5000));
    try {
      try { await signInAnonymously(auth); } catch (e) {}
      
      const data: any = await Promise.race([fetchProperties(), timeoutPromise]);
      if (data && data.length > 0) setProperties(data);
      else { await Promise.all(MOCK_PROPERTIES.map(p => savePropertyToDb(p))); setProperties(MOCK_PROPERTIES); }

      // Fetch User Bookings for AI Context
      if (userRole === UserRole.GUEST) {
          try {
              const bookings = await fetchGuestBookings();
              setUserBookings(bookings);
          } catch(e) {}
      } else if (userRole === UserRole.HOST) {
          try {
              const bookings = await fetchPendingBookings();
              setUserBookings(bookings);
          } catch(e) {}
      }

      // LOAD USER PROFILE from Firestore (Persistence)
      let activeHostProfile = MOCK_HOST_PROFILE;
      let activeGuestProfile = guestProfile;

      try {
          const profile = await fetchUserProfile(currentUserId);
          if (profile) {
              if (userRole === UserRole.HOST) {
                  setHostProfile(profile);
                  activeHostProfile = profile;
              }
              if (userRole === UserRole.GUEST) {
                  setGuestProfile(profile);
                  activeGuestProfile = profile;
              }
          } else {
              // First time load: Save the mock/default to DB so it exists for future fetch
              const initial = userRole === UserRole.HOST ? MOCK_HOST_PROFILE : guestProfile;
              // Add a slight bio change for new profiles to differentiate
              const profileToSave = { ...initial, id: currentUserId };
              await saveUserProfile(currentUserId, userRole, profileToSave);
              if (userRole === UserRole.HOST) activeHostProfile = profileToSave;
              else activeGuestProfile = profileToSave;
          }
      } catch(e) { console.error("Profile load error", e); }

      // Ensure Initial Conversation exists between default Host and Guest
      // We use the just-fetched profiles to ensure names match DB
      if (userRole === UserRole.HOST || userRole === UserRole.GUEST) {
          try {
             const cid = await startConversation(
                 'host1', 
                 'guest_user_1', 
                 activeGuestProfile.name, // Use latest name
                 activeGuestProfile.avatar,
                 activeHostProfile.name, // Use latest name 
                 activeHostProfile.avatar,
                 'Saffron Villa'
             );
          } catch(e) { console.log('Seeding convo skipped/failed', e); }
      }

    } catch (e: any) {
      if (e?.code === 'permission-denied') setPermissionError(true);
      setProperties(MOCK_PROPERTIES);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [userRole]); // Reload when role changes to get correct bookings

  const refreshProperties = async () => {
      try {
          const data = await fetchProperties();
          if (data && data.length > 0) {
              setProperties(data);
              if (previewProperty) {
                  const updatedPreview = data.find(p => p.id === previewProperty.id);
                  if (updatedPreview) setPreviewProperty(updatedPreview);
              }
          }
          // Also refresh bookings to reflect profile changes in booking lists
          if (userRole === UserRole.HOST) {
              const bookings = await fetchPendingBookings();
              setUserBookings(bookings);
          } else {
              const bookings = await fetchGuestBookings();
              setUserBookings(bookings);
          }
      } catch (e) {
          console.error("Failed to refresh properties", e);
      }
  };

  const handleNavigate = (page: string) => { 
      setActivePage(page); 
      setIsEditorOpen(false); 
      setPreviewProperty(undefined);
      setViewMode('dashboard'); 
  };
  
  const handleEditProperty = (prop: Property) => { setEditingProperty(prop); setIsEditorOpen(true); };
  const handlePreviewProperty = (prop: Property) => { setPreviewProperty(prop); setActivePage('guest-view'); setViewMode('dashboard'); };
  const handleAddNew = () => { setEditingProperty(undefined); setIsEditorOpen(true); };
  
  const handleSaveProperty = async (prop: Property) => {
    const newId = prop.id || Date.now().toString();
    const pToSave = { ...prop, id: newId };
    if (editingProperty) setProperties(prev => prev.map(p => p.id === newId ? pToSave : p));
    else setProperties(prev => [...prev, pToSave]);
    setIsEditorOpen(false);
    setActivePage('listings');
    try { await savePropertyToDb(pToSave); } catch (e) {}
  };

  const handleUpdateProperty = async (p: Property) => {
      setProperties(prev => prev.map(prevP => prevP.id === p.id ? p : prevP));
      try { await savePropertyToDb(p); } catch (e) {}
  };

  const handleAiBooking = async (proposal: any) => {
      const prop = properties.find(p => p.id === proposal.propertyId);
      await createBooking({ 
          ...proposal, 
          location: prop?.city || '', 
          thumbnail: prop?.images[0] || '', 
          status: 'confirmed', 
          guestName: currentUserName,
          guestAvatar: currentUserAvatar
      });
      await refreshProperties(); 
  };

  // --- HOST AI ACTION HANDLER ---
  const handleAIAction = async (action: AIAction) => {
      console.log("Processing AI Action:", action);
      
      if (action.type === 'NAVIGATE') handleNavigate(action.payload);
      if (action.type === 'UPDATE_SEARCH') setSearchCriteria({ ...searchCriteria, ...action.payload });
      
      // Host Operations
      if (action.type === 'UPDATE_PRICE') {
          const { propertyId, price, date, startDate, endDate, applyTo } = action.payload;
          
          if (propertyId && price) {
              const updates: DaySettings[] = [];

              if (date) {
                  // Single date
                  updates.push({ date, price, status: 'available' });
              } else if (startDate && endDate) {
                  // Range
                  let current = new Date(startDate);
                  const end = new Date(endDate);
                  
                  while (current <= end) {
                      const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Fri, Sat, Sun definition in app
                      
                      let shouldUpdate = true;
                      if (applyTo === 'weekdays' && isWeekend) shouldUpdate = false;
                      if (applyTo === 'weekends' && !isWeekend) shouldUpdate = false;

                      if (shouldUpdate) {
                          updates.push({
                              date: current.toISOString().split('T')[0],
                              price,
                              status: 'available'
                          });
                      }
                      current.setDate(current.getDate() + 1);
                  }
              }

              if (updates.length > 0) {
                  await updateCalendarDay(propertyId, updates);
                  await refreshProperties();
              }
          }
      }

      if (action.type === 'BLOCK_DATES') {
          const { propertyId, startDate, endDate, reason } = action.payload;
          if (propertyId && startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const updates: DaySettings[] = [];
              while(start <= end) {
                  updates.push({ 
                      date: start.toISOString().split('T')[0], 
                      status: 'blocked', 
                      note: reason || 'Blocked by AI' 
                  });
                  start.setDate(start.getDate() + 1);
              }
              await updateCalendarDay(propertyId, updates);
              await refreshProperties();
          }
      }

      if (action.type === 'APPROVE_BOOKING') {
          let { bookingId } = action.payload;
          
          // SMART FALLBACK: If ID is fuzzy or missing, find the first pending booking
          if (!bookingId || bookingId === 'derived_from_context' || bookingId === 'mock_id') {
              const pending = userBookings.find(b => b.status === 'pending');
              if (pending) {
                  bookingId = pending.id;
                  console.log("AI Agent inferred booking ID:", bookingId);
              } else {
                  console.warn("AI Agent tried to approve but no pending bookings found.");
                  return;
              }
          }

          if (bookingId) {
              // Find booking to get details
              const booking = userBookings.find(b => b.id === bookingId) || { propertyId: '1', startDate: '2025-12-06', endDate: '2025-12-07' } as any; 
              
              if (booking) {
                  try {
                    await updateBookingStatus(bookingId, 'confirmed', booking.propertyId, booking.startDate, booking.endDate);
                    await refreshProperties();
                  } catch(e) { console.error(e); }
              }
          }
      }
  };

  const enterDashboard = () => {
      setViewMode('dashboard');
      if (userRole === UserRole.GUEST) {
          setActivePage('guest-dashboard');
      } else if (userRole === UserRole.HOST) {
          setActivePage('dashboard');
      } else {
          setActivePage('dashboard');
      }
  };

  const handleViewHost = (hostId: string) => {
      setActivePage('host-profile');
  };

  // UPDATED: PERSIST PROFILE AND UPDATE APP STATE
  const handleSaveProfile = async (updatedProfile: HostProfile) => {
      // 1. Update Local State for immediate UI feedback
      if (userRole === UserRole.HOST) setHostProfile(updatedProfile);
      else setGuestProfile(updatedProfile);

      // 2. Persist to DB and Propagate to Bookings/Chats/Calendars
      try {
          await saveUserProfile(updatedProfile.id, userRole, updatedProfile);
          await refreshProperties(); // Refresh to show updates in calendar and lists
      } catch (e) {
          console.error("Failed to save profile to DB", e);
          alert("Profile saved locally, but failed to sync to server.");
      }
  };

  const generateContext = () => {
    const common = {
        role: userRole === UserRole.HOST ? 'HOST' : 'GUEST',
    };

    // HOST CONTEXT - RICH DATA
    if (userRole === UserRole.HOST) {
        return JSON.stringify({ 
            ...common,
            portfolio: properties.map(p => ({ 
                id: p.id, 
                title: p.title, 
                city: p.city,
                basePrice: p.baseWeekdayPrice,
                revenue: p.revenueLastMonth 
            })),
            pendingRequests: userBookings.map(b => ({
                bookingId: b.id,
                guest: b.guestName,
                property: b.propertyName,
                dates: `${b.startDate} to ${b.endDate}`,
                total: b.totalPrice
            })),
            businessStats: {
                totalRevenue: properties.reduce((sum, p) => sum + p.revenueLastMonth, 0),
                avgOccupancy: 78 // Mock for context
            }
        });
    }

    // GUEST CONTEXT
    return JSON.stringify({ 
        ...common,
        userBookings: userBookings.map(b => ({
            id: b.id,
            property: b.propertyName,
            dates: `${b.startDate} to ${b.endDate}`,
            status: b.status,
            code: b.bookingCode
        })),
        properties: properties.map(p => ({ id: p.id, title: p.title, price: p.baseWeekdayPrice, city: p.city, amenities: p.amenities, chef: p.rules?.chefAvailable, meals: p.mealsAvailable, description: p.description?.substring(0, 100) })),
        currentView: activePage,
        searchCriteria
    });
  };

  const getSystemInstruction = () => {
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      // Inject Current Date to ground the AI in reality
      const timeContext = `\n\n[SYSTEM UPDATE]\nCURRENT SYSTEM DATE: ${dateString}\n\nINSTRUCTION: All relative dates (e.g. "next Friday", "December") refer to future dates starting from ${dateString}. Do not reference past years like 2023 or 2024 unless explicitly asked.`;

      if (viewMode === 'landing-chat') {
          if (userRole === UserRole.HOST) return AI_HOST_BRAIN_INSTRUCTION + timeContext;
          if (userRole === UserRole.SERVICE_PROVIDER) return AI_SERVICE_INSTRUCTION + timeContext;
      }
      return (userRole === UserRole.HOST ? AI_HOST_BRAIN_INSTRUCTION : AI_GUEST_INSTRUCTION) + timeContext;
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans flex flex-col h-[100dvh] overflow-hidden relative bg-gray-50 dark:bg-black transition-colors duration-300">
      
      {/* Toggles */}
      <div className="fixed bottom-6 left-6 z-[70] flex flex-col gap-3 group">
          <button onClick={toggleTheme} className="w-12 h-12 rounded-full shadow-lg border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-black dark:text-yellow-400 flex items-center justify-center hover:scale-110 transition-transform">
             <Sun className="w-5 h-5 hidden dark:block"/><Moon className="w-5 h-5 block dark:hidden"/>
          </button>
          
          <button onClick={() => {
              // TOGGLE LOGIC: Only Host <-> Guest (Service Mode Removed)
              const next = userRole === UserRole.HOST ? UserRole.GUEST : UserRole.HOST;
              setUserRole(next);
              setViewMode('landing-chat'); 
              setActivePage(next === UserRole.HOST ? 'dashboard' : 'guest-dashboard');
          }} className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-sm font-bold hover:scale-105 transition-transform">
             {userRole === UserRole.HOST ? 'Switch to Guest' : 'Switch to Host'}
          </button>
      </div>

      <div className="flex-1 flex flex-col relative z-0 overflow-hidden">
        
        {/* === 1. LANDING CHAT (ALL ROLES) === */}
        {viewMode === 'landing-chat' ? (
             <AIChat 
                mode="fullscreen"
                userRole={userRole}
                userName={currentUserName}
                context={generateContext()}
                systemInstruction={getSystemInstruction()}
                onEnterDashboard={enterDashboard}
                onAction={handleAIAction}
                onPreview={handlePreviewProperty}
                onBook={handleAiBooking}
                properties={properties}
                onNavigate={handleNavigate}
             />
        ) : (
            /* === 2. DASHBOARD VIEWS === */
            <>
                {userRole === UserRole.HOST ? (
                    <Layout 
                        activePage={activePage} 
                        onNavigate={handleNavigate}
                        userAvatar={hostProfile.avatar}
                        userName={hostProfile.name}
                        currentUserId={currentUserId}
                    >
                        {isEditorOpen ? <PropertyEditor initialData={editingProperty} onSave={handleSaveProperty} onCancel={() => setIsEditorOpen(false)} /> : (
                        <>
                            {activePage === 'dashboard' && <HostDashboard properties={properties} onNavigate={handleNavigate} onRefresh={refreshProperties} />}
                            {activePage === 'ai-concierge' && (
                                <div className="h-full flex flex-col">
                                    <AIChat 
                                        mode="fullscreen"
                                        userRole={UserRole.HOST}
                                        userName={hostProfile.name}
                                        context={generateContext()} 
                                        systemInstruction={getSystemInstruction()} 
                                        properties={properties} 
                                        onPreview={handlePreviewProperty} 
                                        onBook={handleAiBooking} 
                                        onAction={handleAIAction}
                                    />
                                </div>
                            )}
                            {activePage === 'listings' && <PropertyList properties={properties} onEdit={handleEditProperty} onAddNew={handleAddNew} onPreview={handlePreviewProperty} />}
                            {activePage === 'calendar' && <CalendarManager properties={properties} onUpdateProperty={handleUpdateProperty} />}
                            {activePage === 'messages' && <Messages currentUserId={currentUserId} userRole={userRole} />} 
                            {activePage === 'profile' && <HostProfilePage profile={hostProfile} isEditable={true} onSave={handleSaveProfile} currentUserId={currentUserId} />}
                            {activePage === 'guest-view' && previewProperty && <GuestPropertyDetails property={previewProperty} onBack={() => handleNavigate('listings')} onViewHost={handleViewHost} hostName={hostProfile.name} hostAvatar={hostProfile.avatar} onBookingSuccess={refreshProperties} guestName="Host View" />}
                        </>
                        )}
                    </Layout>
                ) : userRole === UserRole.GUEST ? (
                    <>
                        {activePage === 'guest-dashboard' && (
                            <GuestDashboard 
                                properties={properties} 
                                onNavigate={handleNavigate} 
                                onPreview={handlePreviewProperty} 
                                searchCriteria={searchCriteria} 
                                setSearchCriteria={setSearchCriteria}
                                context={generateContext()}
                                systemInstruction={getSystemInstruction()}
                                onBook={handleAiBooking}
                                onAction={handleAIAction}
                                guestProfile={guestProfile}
                                onUpdateProfile={handleSaveProfile} // Use the robust save handler
                            />
                        )}

                        {activePage === 'guest-view' && previewProperty && <GuestPropertyDetails property={previewProperty} onBack={() => setActivePage('guest-dashboard')} onViewHost={handleViewHost} hostName={hostProfile.name} hostAvatar={hostProfile.avatar} onBookingSuccess={refreshProperties} guestName={currentUserName} guestAvatar={currentUserAvatar} />}
                        
                        {activePage === 'host-profile' && (
                            <HostProfilePage profile={hostProfile} isEditable={false} onBack={() => previewProperty ? setActivePage('guest-view') : setActivePage('guest-dashboard')} currentUserId={currentUserId} currentUserName={currentUserName} currentUserAvatar={currentUserAvatar} />
                        )}
                    </>
                ) : (
                    // Service Mode Fallback (Hidden in toggle but kept for safety if state persists)
                    <Layout activePage={activePage} onNavigate={handleNavigate}>
                        <div className="p-8 text-center">Service Mode is currently unavailable.</div>
                    </Layout>
                )}
            </>
        )}
      </div>
    </div>
  );
}

export default App;
