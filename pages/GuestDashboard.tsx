
import React, { useState } from 'react';
import { Property, Booking, SearchCriteria, AIAction } from '../types';
import { Compass, Calendar, Heart, Search, Sparkles, MapPin, Users, Star, ArrowRight, Waves, Tractor, Crown, Mountain, Home } from 'lucide-react';
import { fetchGuestBookings } from '../services/bookingService';
import { AIChat } from '../components/AIChat';
import { CalendarPopup } from '../components/CalendarPopup';

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
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({ 
    properties, 
    onPreview,
    searchCriteria,
    setSearchCriteria,
    context,
    systemInstruction,
    onBook,
    onAction
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'chat' | 'trips' | 'wishlist'>('explore');
  const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | 'guests' | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter properties based on search criteria
  const filteredProperties = properties.filter(p => {
    // Location match
    const searchLoc = searchCriteria.location.toLowerCase();
    const locMatch = !searchLoc || 
                     p.city.toLowerCase().includes(searchLoc) || 
                     p.location.toLowerCase().includes(searchLoc) ||
                     p.title.toLowerCase().includes(searchLoc);
    
    // Guest capacity match
    const totalGuests = searchCriteria.adults + searchCriteria.children;
    const capacityMatch = p.maxGuests >= totalGuests;

    // Category match (Mock logic)
    const categoryMatch = activeCategory === 'all' || 
        (activeCategory === 'pools' && p.amenities.includes('Pool')) ||
        (activeCategory === 'luxe' && p.baseWeekdayPrice > 12000) ||
        (activeCategory === 'farms' && p.type === 'Farmhouse');

    return locMatch && capacityMatch && categoryMatch;
  });

  const updateSearch = (field: keyof SearchCriteria, value: any) => {
      setSearchCriteria({ ...searchCriteria, [field]: value });
  };

  const today = new Date().toISOString().split('T')[0];

  const CATEGORIES = [
      { id: 'all', label: 'All', icon: Home },
      { id: 'pools', label: 'Amazing Pools', icon: Waves },
      { id: 'luxe', label: 'Luxe', icon: Crown },
      { id: 'farms', label: 'Farms', icon: Tractor },
      { id: 'views', label: 'Top Views', icon: Mountain },
  ];

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen bg-white dark:bg-gray-950 font-sans transition-colors duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-900 shrink-0 shadow-sm">
         <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('explore')}>
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
             <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">AI BNB</span>
         </div>
         
         <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-full">
            {[
                { id: 'explore', icon: Compass, label: 'Explore' },
                { id: 'chat', icon: Sparkles, label: 'Concierge' },
                { id: 'trips', icon: Calendar, label: 'Trips' },
                { id: 'wishlist', icon: Heart, label: 'Saved' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
         </div>
         
         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">G</div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* EXPLORE TAB (GRID VIEW + SEARCH) */}
        {activeTab === 'explore' && (
            <div className="flex-1 overflow-y-auto pb-32">
                {/* Search Pill */}
                <div className="sticky top-0 z-30 py-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-md flex items-center divide-x divide-gray-100 dark:divide-gray-800 relative">
                            {/* Where */}
                            <div className="flex-1 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-full cursor-pointer group transition-colors">
                                <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block">Where</label>
                                <input 
                                    className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 border-none outline-none p-0 truncate font-medium group-hover:text-gray-900 dark:group-hover:text-white"
                                    placeholder="Search destinations"
                                    value={searchCriteria.location}
                                    onChange={(e) => updateSearch('location', e.target.value)}
                                />
                            </div>

                            {/* Check In */}
                            <div 
                                className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors relative min-w-[120px]"
                                onClick={() => setActivePicker('checkIn')}
                            >
                                <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block">Check in</label>
                                <div className={`text-sm font-medium truncate ${searchCriteria.checkIn ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    {searchCriteria.checkIn || 'Add dates'}
                                </div>
                                {activePicker === 'checkIn' && (
                                    <div className="absolute top-[120%] left-0 z-50">
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
                                className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors relative min-w-[120px]"
                                onClick={() => {
                                    if(!searchCriteria.checkIn) setActivePicker('checkIn');
                                    else setActivePicker('checkOut');
                                }}
                            >
                                <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block">Check out</label>
                                <div className={`text-sm font-medium truncate ${searchCriteria.checkOut ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    {searchCriteria.checkOut || 'Add dates'}
                                </div>
                                {activePicker === 'checkOut' && (
                                    <div className="absolute top-[120%] right-0 z-50">
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

                            {/* Guests */}
                            <div className="pl-6 pr-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-full cursor-pointer flex items-center gap-3 transition-colors relative">
                                <div onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')} className="flex-1 min-w-[80px]">
                                    <label className="text-[10px] font-bold uppercase text-gray-800 dark:text-white block">Who</label>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {searchCriteria.adults + searchCriteria.children} guests
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95">
                                    <Search className="w-4 h-4" />
                                </div>

                                {activePicker === 'guests' && (
                                    <div className="absolute top-[120%] right-0 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-80 z-50 cursor-default" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">Adults</div>
                                                <div className="text-sm text-gray-500">Ages 13 or above</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateSearch('adults', Math.max(1, searchCriteria.adults - 1))} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white">-</button>
                                                <span className="font-mono w-4 text-center dark:text-white">{searchCriteria.adults}</span>
                                                <button onClick={() => updateSearch('adults', searchCriteria.adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white">+</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">Children</div>
                                                <div className="text-sm text-gray-500">Ages 2-12</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateSearch('children', Math.max(0, searchCriteria.children - 1))} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white">-</button>
                                                <span className="font-mono w-4 text-center dark:text-white">{searchCriteria.children}</span>
                                                <button onClick={() => updateSearch('children', searchCriteria.children + 1)} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white">+</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Category Bar */}
                        <div className="flex items-center justify-center gap-8 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex flex-col items-center gap-2 group min-w-[60px] pb-2 border-b-2 transition-all ${activeCategory === cat.id ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-700'}`}
                                >
                                    <cat.icon className={`w-6 h-6 ${activeCategory === cat.id ? 'stroke-2' : 'stroke-1 group-hover:stroke-2'}`} />
                                    <span className="text-xs font-medium whitespace-nowrap">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Property Grid */}
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                     {filteredProperties.length === 0 ? (
                         <div className="text-center py-20">
                             <div className="bg-gray-50 dark:bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                             </div>
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white">No stays found</h3>
                             <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search filters or ask our AI Concierge for help.</p>
                             <button 
                                onClick={() => setActiveTab('chat')}
                                className="mt-6 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                             >
                                <Sparkles className="w-4 h-4" /> Ask Concierge
                             </button>
                         </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredProperties.map(property => (
                                <div 
                                    key={property.id} 
                                    className="group cursor-pointer"
                                    onClick={() => onPreview(property)}
                                >
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
                                        <img 
                                            src={property.images[0]} 
                                            alt={property.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 hover:backdrop-blur-sm transition-colors text-white/70 hover:text-white">
                                            <Heart className="w-6 h-6 stroke-[2px]" />
                                        </button>
                                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-gray-900 dark:text-white shadow-sm">
                                            Guest favorite
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{property.city}, {property.state}</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">{property.title}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{property.maxGuests} guests · {property.bedrooms} bedrooms</p>
                                            <div className="mt-1.5 flex items-baseline gap-1">
                                                <span className="font-bold text-gray-900 dark:text-white">₹{property.baseWeekdayPrice.toLocaleString()}</span>
                                                <span className="text-gray-900 dark:text-white text-sm"> night</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span>{property.rating || 4.85}</span>
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
        {/* Kept alive via display:none to preserve history */}
        <div className={`flex-1 flex flex-col ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
             <AIChat 
                mode="fullscreen"
                context={context} 
                systemInstruction={systemInstruction} 
                properties={properties} 
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

        {/* SAVED TAB */}
        {activeTab === 'wishlist' && (
             <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center p-8">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                     <Heart className="w-8 h-8 text-gray-400" />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your wishlist is empty</h2>
                 <p className="text-gray-500 mt-2">Start exploring to save your favorite stays.</p>
                 <button 
                    onClick={() => setActiveTab('explore')}
                    className="mt-6 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold transition-transform active:scale-95"
                 >
                    Start Exploring
                 </button>
             </div>
        )}
      </div>
    </div>
  );
};

const TripsView = () => {
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        fetchGuestBookings()
            .then(setBookings)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-4xl mx-auto w-full p-6 animate-fadeIn pb-32">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Trips</h1>
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading trips...</div>
            ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">No trips booked... yet!</p>
                    <p className="text-gray-500 mt-1 mb-6">Time to dust off your bags and start planning.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Upcoming</div>
                    {bookings.map(b => (
                        <div key={b.id} className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                                <img src={b.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Trip" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{b.propertyName}</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{b.location}</div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md font-medium">{b.startDate} — {b.endDate}</span>
                                    {b.status === 'confirmed' && (
                                        <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                            Confirmed
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center pr-4">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
