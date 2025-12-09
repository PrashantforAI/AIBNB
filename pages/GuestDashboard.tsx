import React, { useState, useEffect } from 'react';
import { Property, Booking, SearchCriteria, AIAction, UserRole, HostProfile } from '../types';
import { Compass, Calendar, Heart, Search, Sparkles, MessageSquare, Home, Waves, Crown, Tractor, Mountain, ArrowRight, Star, MapPin, Menu, LogOut, User, Sun, Moon, RefreshCw } from 'lucide-react';
import { fetchGuestBookings, isDateRangeAvailable, getUnavailableDates } from '../services/bookingService';
import { AIChat } from '../components/AIChat';
import { CalendarPopup } from '../components/CalendarPopup';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { Messages } from './Messages';
import { HostProfilePage } from './HostProfile';
import { subscribeToConversations } from '../services/chatService';

interface GuestDashboardProps {
  properties: Property[];
  onNavigate: (page: string) => void;
  onPreview: (property: Property) => void;
  searchCriteria: SearchCriteria;
  setSearchCriteria: (c: SearchCriteria) => void;
  context?: string;
  systemInstruction?: string;
  onBook?: (booking: any) => Promise<void>;
  onAction?: (action: AIAction) => void;
  guestProfile?: HostProfile;
  onUpdateProfile?: (p: HostProfile) => void;
  onToggleTheme?: () => void;
  onSwitchRole?: () => void;
  isDarkMode?: boolean;
  initialTab?: 'explore' | 'chat' | 'trips' | 'messages' | 'wishlist' | 'profile';
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({ 
    properties, 
    onPreview,
    searchCriteria,
    setSearchCriteria,
    context: globalContext,
    systemInstruction,
    onBook,
    onAction,
    guestProfile,
    onUpdateProfile,
    onToggleTheme,
    onSwitchRole,
    isDarkMode,
    initialTab = 'explore'
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'chat' | 'trips' | 'messages' | 'wishlist' | 'profile'>(initialTab);
  const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | 'guests' | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync initial tab from props
  useEffect(() => {
      if (initialTab) {
          setActiveTab(initialTab);
      }
  }, [initialTab]);

  useEffect(() => {
    if (!guestProfile?.id) return;
    const unsubscribe = subscribeToConversations(guestProfile.id, (convs) => {
        const count = convs.filter(c => (c.guestUnreadCount || 0) > 0).length;
        setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [guestProfile?.id]);

  // Filter properties: must be ACTIVE to be seen by guests
  const filteredProperties = properties
    .filter(p => p.status === 'active')
    .filter(p => {
        const searchLoc = searchCriteria.location.toLowerCase();
        // Safe access to property fields
        const cityMatch = p.city?.toLowerCase().includes(searchLoc) ?? false;
        const locMatch = p.location?.toLowerCase().includes(searchLoc) ?? false;
        const titleMatch = p.title?.toLowerCase().includes(searchLoc) ?? false;
        
        const matchesLocation = !searchLoc || cityMatch || locMatch || titleMatch;
        
        const totalGuests = searchCriteria.adults + searchCriteria.children;
        const capacityMatch = (p.maxGuests || 0) >= totalGuests;
        const dateMatch = isDateRangeAvailable(p, searchCriteria.checkIn, searchCriteria.checkOut);

        const categoryMatch = activeCategory === 'all' || 
            (activeCategory === 'pools' && p.amenities?.includes('Pool')) ||
            (activeCategory === 'luxe' && (p.baseWeekdayPrice || 0) > 12000) ||
            (activeCategory === 'farms' && p.type === 'Farmhouse') ||
            (activeCategory === 'views' && (p.description?.toLowerCase().includes('view') ?? false));

        return matchesLocation && capacityMatch && dateMatch && categoryMatch;
  });

  const updateSearch = (field: keyof SearchCriteria, value: any) => {
      setSearchCriteria({ ...searchCriteria, [field]: value });
  };

  const today = new Date().toISOString().split('T')[0];

  const CATEGORIES = [
      { id: 'all', label: 'All', icon: Home },
      { id: 'pools', label: 'Pools', icon: Waves },
      { id: 'luxe', label: 'Luxe', icon: Crown },
      { id: 'farms', label: 'Farms', icon: Tractor },
      { id: 'views', label: 'Views', icon: Mountain },
  ];

  const dynamicContext = JSON.stringify({
      role: 'GUEST_EXPLORE',
      searchCriteria: searchCriteria,
      inventory: filteredProperties.map(p => ({
          id: p.id,
          title: p.title,
          price: p.baseWeekdayPrice?.toLocaleString() || 'N/A',
          location: p.city,
          description: p.description?.substring(0, 150),
          amenities: p.amenities,
          maxGuests: p.maxGuests,
          unavailableDates: Array.from(getUnavailableDates(p)),
          petFriendly: p.petFriendly || p.rules?.petsAllowed,
          nonVegAllowed: p.nonVegAllowed,
          pool: p.poolType !== 'NA',
          meals: p.mealsAvailable
      })),
      resultCount: filteredProperties.length
  });

  return (
    <div className="h-full bg-gray-50 dark:bg-black font-sans transition-colors duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5 shrink-0">
         {/* Logo */}
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
             <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-bold text-lg shadow-md">A</div>
             <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block tracking-tight">AI BNB</span>
         </div>
         
         {/* Right Side Menu */}
         <div className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pl-3 pr-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full hover:shadow-md transition-all group relative"
            >
                <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
                {unreadCount > 0 && (
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                )}
                {guestProfile?.avatar ? (
                    <img src={guestProfile.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-sm">
                        G
                    </div>
                )}
            </button>

            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute top-12 right-0 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fadeIn origin-top-right">
                        <div className="py-2">
                            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{guestProfile?.name || 'Guest User'}</p>
                                <p className="text-xs text-gray-500">guest@aibnb.com</p>
                            </div>
                            {[
                                { id: 'explore', icon: Compass, label: 'Explore' },
                                { id: 'chat', icon: Sparkles, label: 'AI Concierge' },
                                { id: 'trips', icon: Calendar, label: 'Trips' },
                                { id: 'messages', icon: MessageSquare, label: 'Inbox', badge: unreadCount },
                                { id: 'wishlist', icon: Heart, label: 'Saved' },
                                { id: 'profile', icon: User, label: 'Profile' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-6 py-3 text-sm font-medium flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activeTab === item.id ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-900 dark:border-white' : 'text-gray-600 dark:text-gray-400 border-l-2 border-transparent'}`}
                                >
                                    <div className="relative">
                                        <item.icon className="w-4 h-4" />
                                        {item.badge ? (
                                            <div className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full min-w-[16px] text-center border border-white dark:border-gray-900">
                                                {item.badge}
                                            </div>
                                        ) : null}
                                    </div>
                                    {item.label}
                                </button>
                            ))}
                            
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                            
                            {onToggleTheme && (
                                <button onClick={() => { onToggleTheme(); }} className="w-full text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    Appearance: {isDarkMode ? 'Dark' : 'Light'}
                                </button>
                            )}
                            
                            {onSwitchRole && (
                                <button onClick={() => { onSwitchRole(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4" /> Switch to Host
                                </button>
                            )}

                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                            <button className="w-full text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                                <LogOut className="w-4 h-4" /> Log out
                            </button>
                        </div>
                    </div>
                </>
            )}
         </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* EXPLORE TAB */}
        {activeTab === 'explore' && (
            <div className="flex-1 overflow-y-auto pb-32">
                {/* Search Bar Container */}
                <div className="sticky top-0 z-30 pt-4 pb-6 bg-gray-50 dark:bg-black px-4 border-b border-transparent">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Main Search Pill - Responsive */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-white/10 flex flex-col md:flex-row md:items-center md:divide-x divide-gray-100 dark:divide-white/5 relative h-auto md:h-16 transition-all hover:shadow-lg p-2 md:p-0 gap-2 md:gap-0">
                            {/* Where */}
                            <div className="flex-1 px-4 md:px-8 h-12 md:h-full flex flex-col justify-center hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl md:rounded-l-full cursor-pointer group transition-colors">
                                <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block tracking-wider mb-0.5">Where</label>
                                <input 
                                    className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 border-none outline-none p-0 truncate font-medium group-hover:text-gray-900 dark:group-hover:text-white"
                                    placeholder="Search destinations"
                                    value={searchCriteria.location}
                                    onChange={(e) => updateSearch('location', e.target.value)}
                                />
                            </div>

                            <div className="flex flex-row divide-x divide-gray-100 dark:divide-white/5 w-full md:w-auto h-12 md:h-full">
                                {/* Check In */}
                                <div 
                                    className="flex-1 md:flex-none px-4 md:px-8 h-full flex flex-col justify-center hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors relative md:min-w-[140px] rounded-xl md:rounded-none"
                                    onClick={() => setActivePicker('checkIn')}
                                >
                                    <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block tracking-wider mb-0.5">Check in</label>
                                    <div className={`text-sm font-medium truncate ${searchCriteria.checkIn ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        {searchCriteria.checkIn || 'Add dates'}
                                    </div>
                                    {activePicker === 'checkIn' && (
                                        <div className="absolute top-[110%] left-0 z-50">
                                            <CalendarPopup 
                                                selectedDate={searchCriteria.checkIn}
                                                startDate={searchCriteria.checkIn}
                                                endDate={searchCriteria.checkOut}
                                                minDate={today}
                                                onSelect={(d) => {
                                                    updateSearch('checkIn', d);
                                                    setActivePicker('checkOut');
                                                }}
                                                onClose={() => setActivePicker(null)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Check Out */}
                                <div 
                                    className="flex-1 md:flex-none px-4 md:px-8 h-full flex flex-col justify-center hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors relative md:min-w-[140px] rounded-xl md:rounded-none"
                                    onClick={() => {
                                        if(!searchCriteria.checkIn) setActivePicker('checkIn');
                                        else setActivePicker('checkOut');
                                    }}
                                >
                                    <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block tracking-wider mb-0.5">Check out</label>
                                    <div className={`text-sm font-medium truncate ${searchCriteria.checkOut ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        {searchCriteria.checkOut || 'Add dates'}
                                    </div>
                                    {activePicker === 'checkOut' && (
                                        <div className="absolute top-[110%] right-0 z-50">
                                            <CalendarPopup 
                                                selectedDate={searchCriteria.checkOut}
                                                startDate={searchCriteria.checkIn}
                                                endDate={searchCriteria.checkOut}
                                                minDate={searchCriteria.checkIn || today}
                                                onSelect={(d) => {
                                                    updateSearch('checkOut', d);
                                                    setActivePicker(null);
                                                }}
                                                onClose={() => setActivePicker(null)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Guests & Search Button */}
                            <div className="pl-4 md:pl-6 pr-2 h-12 md:h-full flex items-center hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl md:rounded-r-full cursor-pointer gap-4 transition-colors relative justify-between w-full md:w-auto">
                                <div onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')} className="min-w-[80px]">
                                    <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block tracking-wider mb-0.5">Who</label>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {searchCriteria.adults + searchCriteria.children} guests
                                    </div>
                                </div>
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
                                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                                </div>

                                {activePicker === 'guests' && (
                                    <div className="absolute top-[110%] right-0 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 w-80 z-50 cursor-default" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">Adults</div>
                                                <div className="text-sm text-gray-500">Ages 13 or above</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateSearch('adults', Math.max(1, searchCriteria.adults - 1))} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white">-</button>
                                                <span className="font-mono w-4 text-center dark:text-white">{searchCriteria.adults}</span>
                                                <button onClick={() => updateSearch('adults', searchCriteria.adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white">+</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">Children</div>
                                                <div className="text-sm text-gray-500">Ages 2-12</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateSearch('children', Math.max(0, searchCriteria.children - 1))} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white">-</button>
                                                <span className="font-mono w-4 text-center dark:text-white">{searchCriteria.children}</span>
                                                <button onClick={() => updateSearch('children', searchCriteria.children + 1)} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white">+</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                                        activeCategory === cat.id 
                                        ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' 
                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <cat.icon className="w-4 h-4" />
                                    <span className="text-xs font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Property Grid */}
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
                     {filteredProperties.length === 0 ? (
                         <div className="text-center py-24">
                             <div className="bg-gray-100 dark:bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-400" />
                             </div>
                             <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No stays found</h3>
                             <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                                {searchCriteria.checkIn && searchCriteria.checkOut 
                                    ? `No properties available between ${searchCriteria.checkIn} and ${searchCriteria.checkOut}.` 
                                    : "Adjust your filters or ask our AI Concierge."}
                             </p>
                             <button 
                                onClick={() => setActiveTab('chat')}
                                className="mt-8 px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-800 text-white rounded-full font-bold shadow-lg shadow-brand-500/30 transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                             >
                                <Sparkles className="w-5 h-5" /> Ask AI Concierge
                             </button>
                         </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredProperties.map(property => (
                                <div 
                                    key={property.id} 
                                    className="group cursor-pointer flex flex-col gap-3"
                                    onClick={() => onPreview(property)}
                                >
                                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-sm">
                                        <img 
                                            src={property.images[0]} 
                                            alt={property.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <button className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/90 hover:bg-black/40 hover:scale-110 transition-all z-20">
                                            <Heart className="w-5 h-5 stroke-[2.5px]" />
                                        </button>
                                        
                                        {(property.rating || 0) >= 4.8 && (
                                            <div className="absolute top-3 left-3 overflow-hidden rounded-full bg-white/90 dark:bg-black/80 backdrop-blur shadow-sm border border-white/20 z-10">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200/50 dark:via-gold-400/20 to-transparent -translate-x-full animate-shimmer" />
                                                <div className="relative px-3 py-1.5 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-gold-500 fill-gold-500" />
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">Guest favorite</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-1 px-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate pr-2">{property.city}, {property.state}</h3>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                                                <Star className="w-3.5 h-3.5 fill-current text-gold-500" />
                                                <span>{property.rating ? property.rating.toFixed(1) : 'New'}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{property.title}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{property.maxGuests} guests · {property.bedrooms} bedrooms</p>
                                        <div className="pt-1 flex items-baseline gap-1">
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">₹{property.baseWeekdayPrice?.toLocaleString() || '0'}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">night</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            </div>
        )}

        {/* CHAT TAB (CONCIERGE) */}
        <div className={`flex-1 flex flex-col min-h-0 ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
             <AIChat 
                mode="fullscreen"
                userName={guestProfile?.name}
                context={dynamicContext} 
                systemInstruction={systemInstruction} 
                properties={filteredProperties} 
                onPreview={onPreview} 
                onBook={onBook}
                onAction={onAction}
            />
        </div>

        {/* TRIPS TAB */}
        {activeTab === 'trips' && (
             <div className="flex-1 overflow-y-auto">
                 <TripsView />
             </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
             <div className="flex-1 overflow-hidden p-0 md:p-6">
                 <Messages currentUserId={guestProfile?.id} userRole={UserRole.GUEST} />
             </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'wishlist' && (
             <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center p-8">
                 <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                     <Heart className="w-10 h-10 text-gray-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
                 <p className="text-gray-500 mt-2 max-w-sm mx-auto">As you explore, tap the heart icon to save your favorite stays for later.</p>
                 <button 
                    onClick={() => setActiveTab('explore')}
                    className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold transition-transform active:scale-95"
                 >
                    Start Exploring
                 </button>
             </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && guestProfile && (
             <div className="flex-1 overflow-y-auto">
                 <HostProfilePage 
                    profile={guestProfile} 
                    isEditable={true} 
                    onSave={(p) => onUpdateProfile && onUpdateProfile(p)}
                    currentUserId={guestProfile.id}
                 />
             </div>
        )}
      </div>
    </div>
  );
};

const TripsView = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    
    const loadBookings = () => {
        setLoading(true);
        fetchGuestBookings()
            .then(setBookings)
            .finally(() => setLoading(false));
    };

    React.useEffect(() => {
        loadBookings();
    }, []);

    return (
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 animate-fadeIn pb-32">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Your Trips</h1>
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading trips...</div>
            ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">No trips booked... yet!</p>
                    <p className="text-gray-500 mt-2 mb-8">Time to dust off your bags and start planning.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Upcoming</div>
                    {bookings.map(b => (
                        <div 
                            key={b.id} 
                            onClick={() => setSelectedBooking(b)}
                            className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                        >
                            <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden shrink-0">
                                <img src={b.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Trip" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{b.propertyName}</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {b.location}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                                    <span className="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg font-semibold">{b.startDate} — {b.endDate}</span>
                                    {b.status === 'confirmed' && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Confirmed
                                        </span>
                                    )}
                                    {b.status === 'pending' && (
                                        <span className="text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-yellow-900">
                                            Pending
                                        </span>
                                    )}
                                     {b.status === 'cancelled' && (
                                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900">
                                            Cancelled
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center pr-4">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-full group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {selectedBooking && (
                <BookingDetailsModal 
                    booking={selectedBooking} 
                    onClose={() => setSelectedBooking(null)} 
                    userRole={UserRole.GUEST}
                    onUpdate={loadBookings}
                />
            )}
        </div>
    );
}