import React, { useState, useEffect } from 'react';
import { Property, Booking, SearchCriteria } from '../types';
import { Calendar, Search, Heart, MessageSquare, Plus, Minus, X, MapPin } from 'lucide-react';
import { fetchGuestBookings } from '../services/bookingService';
import { CalendarPopup } from '../components/CalendarPopup';

interface GuestDashboardProps {
  properties: Property[];
  onNavigate: (page: string) => void;
  onPreview: (property: Property) => void;
  searchCriteria: SearchCriteria;
  setSearchCriteria: (c: SearchCriteria) => void;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({ 
    properties, 
    onNavigate, 
    onPreview, 
    searchCriteria, 
    setSearchCriteria 
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'trips' | 'wishlist'>('explore');
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [openDatePicker, setOpenDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);

  useEffect(() => {
    if (activeTab === 'trips') {
        const loadBookings = async () => {
            const data = await fetchGuestBookings();
            setBookings(data);
        };
        loadBookings();
    }
  }, [activeTab]);

  useEffect(() => {
      const handleClickOutside = () => setOpenDatePicker(null);
      if (openDatePicker) {
          window.addEventListener('click', handleClickOutside);
      }
      return () => window.removeEventListener('click', handleClickOutside);
  }, [openDatePicker]);

  const updateSearch = (field: keyof SearchCriteria, value: any) => {
      setSearchCriteria({ ...searchCriteria, [field]: value });
  };

  const hasActiveFilters = searchCriteria.location || searchCriteria.checkIn || searchCriteria.checkOut || (searchCriteria.adults + searchCriteria.children > 2);

  const clearFilters = () => {
      setSearchCriteria({
          location: '',
          checkIn: '',
          checkOut: '',
          adults: 2,
          children: 0
      });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('explore')}>
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
             <span className="font-bold text-lg text-gray-900">AI BNB</span>
         </div>
         <div className="flex items-center gap-6">
             <button 
                onClick={() => setActiveTab('explore')}
                className={`text-sm font-semibold transition-colors ${activeTab === 'explore' ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
             >
                Explore
             </button>
             <button 
                onClick={() => setActiveTab('trips')}
                className={`text-sm font-semibold transition-colors ${activeTab === 'trips' ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
             >
                Trips
             </button>
             <button 
                onClick={() => setActiveTab('wishlist')}
                className={`text-sm font-semibold transition-colors ${activeTab === 'wishlist' ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
             >
                Wishlist
             </button>
             <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                 G
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12 animate-fadeIn">
        
        {activeTab === 'explore' && (
            <>
                {/* Hero Section */}
                <div className="relative mb-16 isolate">
                    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl h-[500px] -z-10">
                         <img src="https://images.unsplash.com/photo-1600596542815-2a4d9fdb52b9?q=80&w=2969&auto=format&fit=crop" className="w-full h-full object-cover transform scale-105" alt="Hero" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                    </div>
                    
                    <div className="relative h-[500px] flex flex-col justify-center items-center px-4">
                        <div className="text-center mb-10 max-w-3xl">
                             <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl mb-4 leading-tight">Find your perfect staycation</h1>
                             <p className="text-white/95 text-lg md:text-xl font-medium drop-shadow-md">Discover luxury villas, cozy cottages, and unique homes across India.</p>
                        </div>

                        {/* Search Bar */}
                        <div 
                            className="bg-white rounded-full flex flex-col md:flex-row items-center shadow-2xl relative max-w-4xl w-full z-50 border border-gray-100" 
                            onClick={(e) => e.stopPropagation()}
                        >
                             
                             {/* Location Input */}
                             <div className="flex-1 w-full md:w-[32%] relative group px-6 py-4 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                                 <label className="text-[10px] font-bold uppercase text-gray-800 tracking-wider mb-0.5 block">Where</label>
                                 <input 
                                    type="text" 
                                    placeholder="Search destinations" 
                                    className="w-full text-sm font-bold text-gray-900 placeholder-gray-400 outline-none bg-transparent truncate"
                                    value={searchCriteria.location}
                                    onChange={(e) => updateSearch('location', e.target.value)}
                                 />
                                 {/* Divider */}
                                 <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gray-200 group-hover:hidden transition-all"></div>
                             </div>

                             {/* Date Inputs */}
                             <div className="flex-1 w-full md:w-[36%] flex relative">
                                 {/* Check In */}
                                 <div 
                                    className={`flex-1 px-6 py-4 cursor-pointer transition-colors relative rounded-full group ${openDatePicker === 'checkIn' ? 'bg-white shadow-lg z-20' : 'hover:bg-gray-100'}`} 
                                    onClick={(e) => { e.stopPropagation(); setOpenDatePicker('checkIn'); }}
                                 >
                                    <label className="text-[10px] font-bold uppercase text-gray-800 tracking-wider block cursor-pointer mb-0.5">Check in</label>
                                    <div className={`text-sm font-bold truncate ${searchCriteria.checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {searchCriteria.checkIn || 'Add dates'}
                                    </div>
                                    
                                    {openDatePicker === 'checkIn' && (
                                        <CalendarPopup 
                                            selectedDate={searchCriteria.checkIn}
                                            startDate={searchCriteria.checkIn}
                                            endDate={searchCriteria.checkOut}
                                            minDate={today}
                                            onSelect={(d) => {
                                                updateSearch('checkIn', d);
                                                if (!searchCriteria.checkOut || searchCriteria.checkOut <= d) {
                                                    setOpenDatePicker('checkOut');
                                                } else {
                                                    setOpenDatePicker(null);
                                                }
                                            }}
                                            onClose={() => setOpenDatePicker(null)}
                                        />
                                    )}
                                    {/* Divider */}
                                    {openDatePicker !== 'checkIn' && openDatePicker !== 'checkOut' && (
                                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gray-200 group-hover:hidden transition-all"></div>
                                    )}
                                 </div>

                                 {/* Check Out */}
                                 <div 
                                    className={`flex-1 px-6 py-4 cursor-pointer transition-colors relative rounded-full group ${openDatePicker === 'checkOut' ? 'bg-white shadow-lg z-20' : 'hover:bg-gray-100'}`} 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        // Enforce Check-in first
                                        if (!searchCriteria.checkIn) {
                                            setOpenDatePicker('checkIn');
                                        } else {
                                            setOpenDatePicker('checkOut'); 
                                        }
                                    }}
                                 >
                                    <label className="text-[10px] font-bold uppercase text-gray-800 tracking-wider block cursor-pointer mb-0.5">Check out</label>
                                    <div className={`text-sm font-bold truncate ${searchCriteria.checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {searchCriteria.checkOut || 'Add dates'}
                                    </div>

                                    {openDatePicker === 'checkOut' && (
                                        <CalendarPopup 
                                            selectedDate={searchCriteria.checkOut} 
                                            startDate={searchCriteria.checkIn}
                                            endDate={searchCriteria.checkOut}
                                            minDate={searchCriteria.checkIn || today}
                                            onSelect={(d) => {
                                                updateSearch('checkOut', d);
                                                setOpenDatePicker(null);
                                            }}
                                            onClose={() => setOpenDatePicker(null)}
                                        />
                                    )}
                                    {/* Divider */}
                                    {openDatePicker !== 'checkOut' && (
                                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gray-200 group-hover:hidden transition-all"></div>
                                    )}
                                 </div>
                             </div>

                             {/* Guests Input */}
                             <div className="flex-1 w-full md:w-[32%] flex items-center pr-2 relative group pl-6 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                 <div className="flex-1 py-4">
                                     <label className="text-[10px] font-bold uppercase text-gray-800 tracking-wider mb-0.5 block cursor-pointer">Who</label>
                                     <div className={`text-sm font-bold truncate ${searchCriteria.adults + searchCriteria.children > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                         {(searchCriteria.adults + searchCriteria.children) > 0 
                                            ? `${searchCriteria.adults + searchCriteria.children} guests` 
                                            : 'Add guests'}
                                     </div>
                                 </div>
                                 
                                 {/* Guest Dropdown */}
                                 <div className="absolute top-[120%] right-0 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-80 z-50 cursor-default">
                                     <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                         <div>
                                             <div className="font-bold text-base text-gray-900">Adults</div>
                                             <div className="text-xs text-gray-500">Ages 13 or above</div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <button onClick={() => updateSearch('adults', Math.max(1, searchCriteria.adults - 1))} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${searchCriteria.adults <= 1 ? 'border-gray-100 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`} disabled={searchCriteria.adults <= 1}><Minus className="w-3 h-3"/></button>
                                             <span className="font-mono w-4 text-center text-lg font-medium">{searchCriteria.adults}</span>
                                             <button onClick={() => updateSearch('adults', searchCriteria.adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-900 hover:text-gray-900 transition-colors"><Plus className="w-3 h-3"/></button>
                                         </div>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <div>
                                             <div className="font-bold text-base text-gray-900">Children</div>
                                             <div className="text-xs text-gray-500">Ages 2-12</div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <button onClick={() => updateSearch('children', Math.max(0, searchCriteria.children - 1))} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${searchCriteria.children <= 0 ? 'border-gray-100 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`} disabled={searchCriteria.children <= 0}><Minus className="w-3 h-3"/></button>
                                             <span className="font-mono w-4 text-center text-lg font-medium">{searchCriteria.children}</span>
                                             <button onClick={() => updateSearch('children', searchCriteria.children + 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-900 hover:text-gray-900 transition-colors"><Plus className="w-3 h-3"/></button>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Search Button */}
                                 <div className="">
                                     <button className="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full transition-all shadow-lg hover:shadow-brand-200 active:scale-95 flex items-center gap-2">
                                         <Search className="w-5 h-5" />
                                         <span className="md:hidden font-bold pr-2">Search</span>
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {hasActiveFilters ? 'Search Results' : 'Recommended for you'}
                        </h2>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full transition-colors">
                                <X className="w-4 h-4" /> Clear Filters
                            </button>
                        )}
                    </div>
                    
                    {properties.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300 animate-pulse">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No properties match your search</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">We couldn't find any matches for your criteria. Try changing your dates, removing filters, or ask our AI for help.</p>
                            <button onClick={clearFilters} className="text-brand-600 font-bold hover:underline">Clear all filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {properties.map(property => (
                                <div 
                                    key={property.id} 
                                    onClick={() => onPreview(property)}
                                    className="group cursor-pointer"
                                >
                                    <div className="aspect-[4/3] bg-gray-200 rounded-2xl relative overflow-hidden mb-3">
                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <button className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/30 backdrop-blur-sm rounded-full text-white transition-all">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold shadow-sm uppercase tracking-wide">
                                            Guest favorite
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 line-clamp-1 text-base">{property.title}</h3>
                                            <div className="flex items-center gap-1 text-sm font-medium"><span className="text-black">★</span> 4.85</div>
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-1 mb-0.5">{property.location || property.city}</p>
                                        <p className="text-gray-500 text-sm mb-2">{property.bedrooms} beds · {property.maxGuests} guests</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="font-bold text-gray-900 text-base">₹{property.baseWeekdayPrice.toLocaleString()}</span>
                                            <span className="text-gray-500 font-normal text-sm">night</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
             <section className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-brand-600"/> Your Trips
                </h2>
                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No trips booked... yet!</h3>
                        <p className="text-gray-500 mt-1">Time to dust off your suitcase and start exploring.</p>
                        <button onClick={() => setActiveTab('explore')} className="mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all">Start Exploring</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map(booking => (
                            <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                    <img src={booking.thumbnail || 'https://via.placeholder.com/400'} alt={booking.propertyName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700 shadow-sm border border-green-100 uppercase tracking-wide flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        {booking.status}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">{booking.propertyName}</h3>
                                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> 
                                        {booking.startDate} - {booking.endDate}
                                    </p>
                                    <div className="flex gap-3 pt-2 border-t border-gray-50">
                                        <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700">
                                            View Details
                                        </button>
                                        <button className="px-4 rounded-xl border border-gray-200 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
             <section className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-brand-600"/> Your Wishlist
                </h2>
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <Heart className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Your wishlist is empty</h3>
                    <p className="text-gray-500 mt-2">As you search, click the heart icon to save your favorite places.</p>
                </div>
            </section>
        )}
      </div>
    </div>
  );
};