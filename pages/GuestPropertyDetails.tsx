import React, { useState, useEffect } from 'react';
import { Property, DaySettings } from '../types';
import { Star, MapPin, Users, BedDouble, Bath, Wifi, Car, Utensils, Share2, Heart, ChevronLeft, ChevronRight, CheckCircle2, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { AMENITIES_LIST } from '../constants';
import { createBooking } from '../services/bookingService';
import { CalendarPopup } from '../components/CalendarPopup';

interface GuestPropertyDetailsProps {
  property: Property;
  onBack: () => void;
}

export const GuestPropertyDetails: React.FC<GuestPropertyDetailsProps> = ({ property, onBack }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(Math.min(2, property.maxGuests));
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | null>(null);

  // Derive Unavailable Dates (Booked or Blocked)
  const unavailableDates = new Set<string>();
  if (property.calendar) {
      Object.values(property.calendar).forEach((day: unknown) => {
          const d = day as DaySettings;
          if (d.status === 'booked' || d.status === 'blocked') {
              unavailableDates.add(d.date);
          }
      });
  }

  // Close popup on click outside
  useEffect(() => {
      const handleClickOutside = () => setActivePicker(null);
      if (activePicker) window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, [activePicker]);


  // Price Calculation Logic
  const getDaysArray = (start: string, end: string) => {
    const arr = [];
    if (!start || !end) return arr;
    const dt = new Date(start);
    const endDt = new Date(end);
    while (dt < endDt) { 
        arr.push(new Date(dt));
        dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  const dates = getDaysArray(checkIn, checkOut);
  const totalNights = dates.length;

  const baseTotal = dates.reduce((acc, date) => {
      const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6;
      return acc + (isWeekend ? property.baseWeekendPrice : property.baseWeekdayPrice);
  }, 0);

  const extraGuestFee = (guests > property.baseGuests) ? (guests - property.baseGuests) * property.extraGuestPrice * totalNights : 0;
  const serviceFee = Math.round((baseTotal + extraGuestFee) * 0.08); 
  const taxes = Math.round((baseTotal + extraGuestFee + serviceFee) * 0.18); 
  const grandTotal = baseTotal + extraGuestFee + serviceFee + taxes;

  const handleBook = async () => {
    if (!checkIn || !checkOut || totalNights < 1) return;

    // Client-side overlapping check
    const requestedDates = getDaysArray(checkIn, checkOut);
    for (const d of requestedDates) {
        const dStr = d.toISOString().split('T')[0];
        if (unavailableDates.has(dStr)) {
            alert(`The date ${dStr} is no longer available.`);
            return;
        }
    }

    setIsBooking(true);
    
    try {
        await createBooking({
            propertyId: property.id,
            propertyName: property.title,
            location: property.city,
            startDate: checkIn,
            endDate: checkOut,
            guestCount: guests,
            totalPrice: grandTotal,
            thumbnail: property.images[0]
        });
        
        setShowSuccess(true);
    } catch (e: any) {
        alert(e.message || "Booking failed. Please try again.");
    } finally {
        setIsBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (showSuccess) {
      return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-600 mb-6">Your stay at <span className="font-semibold">{property.title}</span> is locked in.</p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left space-y-2">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Check-in</span>
                          <span className="font-bold text-gray-900">{checkIn}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Check-out</span>
                          <span className="font-bold text-gray-900">{checkOut}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Guests</span>
                          <span className="font-bold text-gray-900">{guests}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-brand-600">
                          <span>Total Paid</span>
                          <span>₹{grandTotal.toLocaleString()}</span>
                      </div>
                  </div>

                  <button 
                    onClick={onBack}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-colors"
                  >
                      Return to Dashboard
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      {/* Navbar Placeholder */}
      <div className="border-b border-gray-100 py-4 px-6 md:px-12 sticky top-0 bg-white z-40 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5"/></button>
             <div className="font-bold text-xl text-brand-600">AI BNB</div>
         </div>
         <div className="flex gap-4">
             <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-full"><Share2 className="w-4 h-4"/> Share</button>
             <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-full"><Heart className="w-4 h-4"/> Save</button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Header */}
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1 font-semibold text-gray-900"><Star className="w-4 h-4 fill-black"/> 4.85 · <span className="underline">12 reviews</span></span>
                <span>·</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {property.location}, {property.city}, {property.state}</span>
            </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden relative">
            <div className="md:col-span-2 h-full relative group cursor-pointer">
                <img src={property.images[0] || 'https://via.placeholder.com/800'} className="w-full h-full object-cover" alt="Main" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
                {property.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="h-full relative group cursor-pointer">
                         <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`}/>
                         <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                ))}
            </div>
            <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md border border-gray-200">
                Show all photos
            </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-10">
                {/* Host Info */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Entire {property.type.toLowerCase()} hosted by AI BNB Host</h2>
                        <ol className="flex gap-4 text-gray-600 text-sm">
                            <li>{property.maxGuests} guests</li>
                            <li>· {property.bedrooms} bedrooms</li>
                            <li>· {property.bathrooms} bathrooms</li>
                        </ol>
                    </div>
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 border border-gray-300">
                        H
                    </div>
                </div>

                {/* Highlights */}
                <div className="space-y-6 border-b border-gray-200 pb-8">
                    <div className="flex gap-4">
                        <UserCheck className="w-6 h-6 text-gray-900 mt-1"/>
                        <div>
                            <h3 className="font-bold text-gray-900">Dedicated Caretaker</h3>
                            <p className="text-gray-500 text-sm">{property.caretakerAvailable ? 'A caretaker is available on-site to assist you.' : 'Self check-in available.'}</p>
                        </div>
                    </div>
                    {property.poolType !== 'NA' && (
                        <div className="flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-gray-900 mt-1"/>
                            <div>
                                <h3 className="font-bold text-gray-900">Private Pool</h3>
                                <p className="text-gray-500 text-sm">Dive into your own private {property.poolSize} pool.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="border-b border-gray-200 pb-8">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                    <button className="mt-4 font-bold underline flex items-center gap-1">Show more <ChevronRight className="w-4 h-4"/></button>
                </div>

                {/* Amenities */}
                <div className="border-b border-gray-200 pb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {property.amenities.map(amenity => {
                             return (
                                <div key={amenity} className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                                    <span>{amenity}</span>
                                </div>
                             )
                        })}
                    </div>
                </div>

                {/* Meals Section (AI BNB Unique) */}
                {property.mealPlans.length > 0 && (
                    <div className="border-b border-gray-200 pb-8 bg-orange-50 p-6 rounded-2xl border-none">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white rounded-full text-orange-600 shadow-sm"><Utensils className="w-5 h-5"/></div>
                            <h2 className="text-xl font-bold text-gray-900">Curated Meal Experiences</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {property.mealPlans.map((plan, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800">{plan.type} Package</h3>
                                        <span className="text-sm font-bold text-orange-600">₹{plan.pricePerHead}/head</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.items.slice(0,3).map((item, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-28 bg-white border border-gray-200 rounded-xl p-6 shadow-2xl z-10">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <span className="text-2xl font-bold">₹{property.baseWeekdayPrice}</span>
                            <span className="text-gray-500"> / night</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold">
                             <Star className="w-3 h-3 fill-black"/> 4.85
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="border border-gray-300 rounded-xl overflow-hidden mb-4 grid grid-cols-2 shadow-sm">
                        {/* Check-in Trigger */}
                        <div 
                            className="p-3 border-r border-b border-gray-300 hover:bg-gray-50 transition-colors relative cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setActivePicker('checkIn'); }}
                        >
                            <label className="text-[10px] font-bold uppercase text-gray-800 block mb-0.5 pointer-events-none">Check-in</label>
                            <div className={`text-sm font-medium ${checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
                                {checkIn || 'Add date'}
                            </div>
                            {activePicker === 'checkIn' && (
                                <CalendarPopup 
                                    selectedDate={checkIn}
                                    startDate={checkIn}
                                    endDate={checkOut}
                                    minDate={today}
                                    unavailableDates={unavailableDates}
                                    onSelect={(d) => {
                                        setCheckIn(d);
                                        if (!checkOut || checkOut <= d) setActivePicker('checkOut');
                                        else setActivePicker(null);
                                    }}
                                    onClose={() => setActivePicker(null)}
                                />
                            )}
                        </div>

                        {/* Check-out Trigger */}
                        <div 
                            className="p-3 border-b border-gray-300 hover:bg-gray-50 transition-colors relative cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setActivePicker('checkOut'); }}
                        >
                            <label className="text-[10px] font-bold uppercase text-gray-800 block mb-0.5 pointer-events-none">Check-out</label>
                            <div className={`text-sm font-medium ${checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
                                {checkOut || 'Add date'}
                            </div>
                            {activePicker === 'checkOut' && (
                                <CalendarPopup 
                                    selectedDate={checkOut}
                                    startDate={checkIn}
                                    endDate={checkOut}
                                    minDate={checkIn || today}
                                    unavailableDates={unavailableDates}
                                    onSelect={(d) => {
                                        setCheckOut(d);
                                        setActivePicker(null);
                                    }}
                                    onClose={() => setActivePicker(null)}
                                />
                            )}
                        </div>

                        <div className="col-span-2 p-3 hover:bg-gray-50 transition-colors">
                            <label className="text-[10px] font-bold uppercase text-gray-800 block mb-0.5">Guests</label>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{guests} guests</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setGuests(Math.max(1, guests-1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white hover:border-black transition-colors">-</button>
                                    <button onClick={() => setGuests(Math.min(property.maxGuests, guests+1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white hover:border-black transition-colors">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleBook}
                        disabled={!totalNights || isBooking}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-200"
                    >
                        {isBooking ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                            totalNights ? 'Reserve' : 'Check availability'
                        )}
                    </button>

                    {totalNights > 0 && (
                        <div className="animate-fadeIn space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span className="underline">Base price x {totalNights} nights</span>
                                <span>₹{baseTotal.toLocaleString()}</span>
                            </div>
                            {extraGuestFee > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span className="underline">Extra guest fee</span>
                                    <span>₹{extraGuestFee.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span className="underline">Service fee</span>
                                <span>₹{serviceFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span className="underline">Taxes (GST)</span>
                                <span>₹{taxes.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg text-gray-900 mt-2">
                                <span>Total</span>
                                <span>₹{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};