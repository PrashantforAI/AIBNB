

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
import { MOCK_PROPERTIES, AI_SYSTEM_INSTRUCTION, AI_GUEST_INSTRUCTION, AI_HOST_LANDING_INSTRUCTION, AI_SERVICE_INSTRUCTION, MOCK_TASKS, MOCK_HOST_PROFILE } from './constants';
import { Property, DaySettings, Booking, SearchCriteria, UserRole, ServiceTask, AIAction, HostProfile } from './types';
import { fetchProperties, savePropertyToDb } from './services/propertyService';
import { createBooking } from './services/bookingService';
import { startConversation, sendMessage } from './services/chatService'; 
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
  const [hostProfile, setHostProfile] = useState<HostProfile>(MOCK_HOST_PROFILE);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const currentUserId = userRole === UserRole.HOST ? 'host1' : userRole === UserRole.GUEST ? 'guest_user_1' : 'sp1';

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

      if (userRole === UserRole.HOST || userRole === UserRole.GUEST) {
          try {
             const cid = await startConversation(
                 'host1', 'guest_user_1', 'Rahul Sharma', 
                 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100',
                 'Pine Stays',
                 MOCK_HOST_PROFILE.avatar,
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
  }, []);

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
      await createBooking({ ...proposal, location: prop?.city || '', thumbnail: prop?.images[0] || '', status: 'confirmed' });
      await refreshProperties(); 
  };

  const handleAIAction = (action: AIAction) => {
      if (action.type === 'NAVIGATE') handleNavigate(action.payload);
      if (action.type === 'UPDATE_SEARCH') setSearchCriteria({ ...searchCriteria, ...action.payload });
  };

  const enterDashboard = () => {
      setViewMode('dashboard');
  };

  const handleViewHost = (hostId: string) => {
      setActivePage('host-profile');
  };

  const handleSaveProfile = (updatedProfile: HostProfile) => {
      setHostProfile(updatedProfile);
  };

  const generateContext = () => {
    if (viewMode === 'landing-chat') {
        if (userRole === UserRole.HOST) return JSON.stringify({ role: 'HOST_LANDING', stats: { totalProperties: properties.length, revenue: 245000 } });
        if (userRole === UserRole.SERVICE_PROVIDER) return JSON.stringify({ role: 'SERVICE_LANDING', pendingTasks: tasks.filter(t=>t.status==='pending').length });
    }

    if (userRole === UserRole.HOST) {
        return JSON.stringify({ role: 'HOST', portfolio: properties.map(p => ({ id: p.id, title: p.title, revenue: p.revenueLastMonth })) });
    }
    return JSON.stringify({ 
        role: 'GUEST', 
        properties: properties.map(p => ({ id: p.id, title: p.title, price: p.baseWeekdayPrice, city: p.city, amenities: p.amenities, chef: p.rules?.chefAvailable, meals: p.mealsAvailable, description: p.description?.substring(0, 100) })),
        currentView: activePage,
        searchCriteria
    });
  };

  const getSystemInstruction = () => {
      if (viewMode === 'landing-chat') {
          if (userRole === UserRole.HOST) return AI_HOST_LANDING_INSTRUCTION;
          if (userRole === UserRole.SERVICE_PROVIDER) return AI_SERVICE_INSTRUCTION;
      }
      return userRole === UserRole.HOST ? AI_SYSTEM_INSTRUCTION : AI_GUEST_INSTRUCTION;
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-white"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans flex flex-col min-h-screen relative bg-gray-50 dark:bg-black transition-colors duration-300">
      
      {/* Toggles */}
      <div className="fixed bottom-6 left-6 z-[70] flex flex-col gap-3 group">
          <button onClick={toggleTheme} className="w-12 h-12 rounded-full shadow-lg border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-black dark:text-yellow-400 flex items-center justify-center hover:scale-110 transition-transform">
             <Sun className="w-5 h-5 hidden dark:block"/><Moon className="w-5 h-5 block dark:hidden"/>
          </button>
          <button onClick={() => {
              const next = userRole === UserRole.HOST ? UserRole.GUEST : userRole === UserRole.GUEST ? UserRole.SERVICE_PROVIDER : UserRole.HOST;
              setUserRole(next);
              setViewMode('landing-chat'); 
              setActivePage(next === UserRole.HOST ? 'dashboard' : next === UserRole.GUEST ? 'guest-dashboard' : 'service-provider-dashboard');
          }} className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-sm font-bold hover:scale-105 transition-transform">
             {userRole === UserRole.HOST ? 'Host Mode' : userRole === UserRole.GUEST ? 'Guest Mode' : 'Service Mode'}
          </button>
      </div>

      <div className="flex-1 flex flex-col relative z-0">
        
        {/* === 1. LANDING CHAT (ALL ROLES) === */}
        {viewMode === 'landing-chat' ? (
             <AIChat 
                mode="fullscreen"
                userRole={userRole}
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
                    <Layout activePage={activePage} onNavigate={handleNavigate}>
                        {isEditorOpen ? <PropertyEditor initialData={editingProperty} onSave={handleSaveProperty} onCancel={() => setIsEditorOpen(false)} /> : (
                        <>
                            {activePage === 'dashboard' && <HostDashboard properties={properties} onNavigate={handleNavigate} />}
                            {activePage === 'listings' && <PropertyList properties={properties} onEdit={handleEditProperty} onAddNew={handleAddNew} onPreview={handlePreviewProperty} />}
                            {activePage === 'calendar' && <CalendarManager properties={properties} onUpdateProperty={handleUpdateProperty} />}
                            {activePage === 'messages' && <Messages currentUserId={currentUserId} userRole={userRole} />} 
                            {activePage === 'profile' && <HostProfilePage profile={hostProfile} isEditable={true} onSave={handleSaveProfile} currentUserId={currentUserId} />}
                            {activePage === 'guest-view' && previewProperty && <GuestPropertyDetails property={previewProperty} onBack={() => handleNavigate('listings')} onViewHost={handleViewHost} hostName={hostProfile.name} hostAvatar={hostProfile.avatar} onBookingSuccess={refreshProperties} />}
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
                            />
                        )}

                        {activePage === 'guest-view' && previewProperty && <GuestPropertyDetails property={previewProperty} onBack={() => setActivePage('guest-dashboard')} onViewHost={handleViewHost} hostName={hostProfile.name} hostAvatar={hostProfile.avatar} onBookingSuccess={refreshProperties} />}
                        
                        {activePage === 'host-profile' && (
                            <HostProfilePage profile={hostProfile} isEditable={false} onBack={() => previewProperty ? setActivePage('guest-view') : setActivePage('guest-dashboard')} currentUserId={currentUserId} />
                        )}
                    </>
                ) : (
                    <Layout activePage={activePage} onNavigate={handleNavigate}>
                        <ServiceProviderDashboard tasks={tasks} />
                    </Layout>
                )}
            </>
        )}
      </div>
      
      {/* Floating Chat for HOST only (When in Dashboard mode) */}
      {viewMode === 'dashboard' && userRole === UserRole.HOST && (
          <AIChat 
            mode="floating"
            context={generateContext()} 
            systemInstruction={AI_SYSTEM_INSTRUCTION} 
            properties={properties} 
            onPreview={handlePreviewProperty} 
            onBook={handleAiBooking} 
            onAction={handleAIAction}
          />
      )}
    </div>
  );
}

export default App;