
import React, { useState, useEffect } from 'react';
import { Property, DaySettings } from '../types';
import { Star, MapPin, Users, BedDouble, Bath, Wifi, Car, Utensils, Share2, Heart, ChevronLeft, ChevronRight, CheckCircle2, UserCheck, ShieldCheck, Loader2, Dog, Clock, Ban, Calendar as CalendarIcon, X, Sparkles } from 'lucide-react';
import { AMENITIES_LIST } from '../constants';
import { createBooking, getUnavailableDates } from '../services/bookingService';
import { CalendarPopup } from '../components/CalendarPopup';

interface GuestPropertyDetailsProps {
  property: Property;
  onBack: () => void;
  onViewHost?: (hostId: string) => void;
  hostName?: string;
  hostAvatar?: string;
  onBookingSuccess?: () => void;
}

export const GuestPropertyDetails: React.FC<GuestPropertyDetailsProps> = ({ property, onBack, onViewHost, hostName = 'AI BNB', hostAvatar, onBookingSuccess }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(Math.min(2, property.maxGuests));
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [activePicker, setActivePicker] = useState<'checkIn' | 'checkOut' | 'guests' | null>(null);

  // Use centralized logic to get unavailable dates
  const unavailableDates = getUnavailableDates(property);

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
      return acc + (isWeekend ? property.baseWeekendPrice || 0 : property.baseWeekdayPrice || 0);
  }, 0);
  const extraGuestFee = (guests > property.baseGuests) ? (guests - property.baseGuests) * (property.extraGuestPrice || 0) * totalNights : 0;
  const serviceFee = Math.round((baseTotal + extraGuestFee) * 0.08); 
  const taxes = Math.round((baseTotal + extraGuestFee + serviceFee) * 0.18); 
  const grandTotal = baseTotal + extraGuestFee + serviceFee + taxes;

  const initiateBooking = () => {
    if (!checkIn || !checkOut || totalNights < 1) return;
    const requestedDates = getDaysArray(checkIn, checkOut);
    for (const d of requestedDates) {
        const dStr = d.toISOString().split('T')[0];
        if (unavailableDates.has(dStr)) {
            alert(`The date ${dStr} is no longer available.`);
            return;
        }
    }
    setShowConfirmation(true);
  };

  const processBooking = async () => {
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
        setShowConfirmation(false);
        setShowSuccess(true);
        if (onBookingSuccess) onBookingSuccess();
    } catch (e: any) {
        alert(e.message || "Booking failed.");
        setShowConfirmation(false);
    } finally {
        setIsBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (showSuccess) {
      return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Request Sent!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">Your booking request for <span className="font-semibold">{property.title}</span> has been sent to the host for approval.</p>
                  <button onClick={onBack} className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-100 transition-transform active:scale-95">Back to Dashboard</button>
              </div>
          </div>
      );
  }

  // --- Helper for Rules Display ---
  const renderRule = (icon: React.ElementType, title: string, desc?: string | number) => (
      <div className="flex gap-4 items-start">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-300 shrink-0">
              {React.createElement(icon, { size: 18 })}
          </div>
          <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{desc || 'Not specified'}</p>
          </div>
      </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen animate-fadeIn font-sans pb-32 lg:pb-0 relative transition-colors duration-300">
      {/* Top Navigation */}
      <div className="border-b border-gray-100 dark:border-gray-800 py-3 px-4 md:px-8 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-40 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300"/></button>
         </div>
         <div className="flex gap-2">
             <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-full transition-colors text-gray-700 dark:text-gray-300"><Share2 className="w-4 h-4"/> <span className="hidden sm:inline">Share</span></button>
             <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-full transition-colors text-gray-700 dark:text-gray-300"><Heart className="w-4 h-4"/> <span className="hidden sm:inline">Save</span></button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 lg:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1 font-bold text-gray-900 dark:text-white"><Star className="w-3.5 h-3.5 fill-current text-gold-500"/> {property.rating || 'New'}</span>
            <span className="hidden sm:inline">·</span>
            <span className="underline decoration-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white">12 reviews</span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1 text-gray-900 dark:text-white font-medium">{property.city}, {property.state}</span>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[280px] md:h-[450px] rounded-2xl overflow-hidden relative mb-10 shadow-sm">
            <div className="md:col-span-2 h-full relative group cursor-pointer">
                <img src={property.images[0] || 'https://via.placeholder.com/800'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Main" />
                
                {/* Animated Guest Favorite Badge */}
                {(property.rating || 0) >= 4.8 && (
                    <div className="absolute top-4 left-4 overflow-hidden rounded-full bg-white/90 dark:bg-black/80 backdrop-blur shadow-sm border border-white/20 z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-200/50 dark:via-gold-400/20 to-transparent -translate-x-full animate-shimmer" />
                        <div className="relative px-3 py-1.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-gold-500 fill-gold-500" />
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Guest favorite</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-2 h-full">
                {property.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="h-full relative group cursor-pointer overflow-hidden">
                         <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`Gallery ${i}`}/>
                    </div>
                ))}
            </div>
            <button className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-gray-100 dark:border-gray-800 flex items-center gap-2 md:hidden">
                View Photos
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* Content Column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Host Section - CLICKABLE */}
                <div 
                    onClick={() => onViewHost && onViewHost(property.hostId || 'host1')}
                    className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-6 cursor-pointer group hover:opacity-80 transition-opacity"
                >
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:underline decoration-brand-500">Hosted by {hostName}</h2>
                        <div className="flex gap-3 text-gray-500 dark:text-gray-400 text-sm">
                            <span>{property.maxGuests} guests</span>
                            <span>· {property.bedrooms} bedrooms</span>
                            <span>· {property.bathrooms} baths</span>
                        </div>
                    </div>
                    {hostAvatar ? (
                        <img src={hostAvatar} alt={hostName} className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white dark:border-gray-900 transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white dark:border-gray-900 transition-transform group-hover:scale-105">
                            {hostName.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed border-b border-gray-100 dark:border-gray-800 pb-8 text-base">
                    <p>{property.description}</p>
                </div>

                <div className="border-b border-gray-100 dark:border-gray-800 pb-8">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-5">Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4">
                        {property.amenities.map(am => (
                            <div key={am} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className="text-sm font-medium">{am}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* House Rules Section */}
                <div className="pb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6">Things to know</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div>
                             <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider">House Rules</h4>
                             <div className="space-y-5">
                                {renderRule(Clock, "Check-in / Check-out", `${property.rules?.checkInTime || '14:00'} - ${property.rules?.checkOutTime || '10:00'}`)}
                                {renderRule(Users, "Occupancy", `${property.rules?.standardOccupancy || 6} guests standard. Max ${property.rules?.maxOccupancy || 8}.`)}
                                {renderRule(Ban, "Quiet Hours", property.rules?.quietHours)}
                                {renderRule(Utensils, "Kitchen", property.rules?.kitchenUsagePolicy)}
                             </div>
                        </div>
                        <div>
                             <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider">Policies & Fees</h4>
                             <div className="space-y-5">
                                {renderRule(ShieldCheck, "Security Deposit", `₹${property.rules?.securityDeposit || 0} (Refundable)`)}
                                {renderRule(Dog, "Pets", property.rules?.petsAllowed 
                                    ? `Allowed. Deposit: ₹${property.rules?.petDeposit || 0}` 
                                    : "No pets allowed")}
                                {renderRule(Ban, "Smoking", property.rules?.smokingPolicy)}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Sticky Sidebar Booking Card */}
            <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 z-10">
                    <div className="flex justify-between items-baseline mb-6">
                        <div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{property.baseWeekdayPrice?.toLocaleString() || '0'}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm"> night</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
                             <Star className="w-3 h-3 fill-current text-gold-500" /> {property.rating || 'New'}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6 relative">
                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                className={`p-3 rounded-xl border cursor-pointer transition-all relative ${activePicker === 'checkIn' ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-gray-50 dark:bg-gray-700 z-30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 z-20'}`}
                                onClick={(e) => { e.stopPropagation(); setActivePicker('checkIn'); }}
                            >
                                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block mb-0.5">Check-in</label>
                                <div className={`text-sm font-bold truncate ${checkIn ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{checkIn || 'Select Date'}</div>
                                {activePicker === 'checkIn' && (
                                    <CalendarPopup 
                                        selectedDate={checkIn}
                                        startDate={checkIn}
                                        endDate={checkOut}
                                        minDate={today}
                                        unavailableDates={unavailableDates}
                                        onSelect={(d) => { setCheckIn(d); if(!checkOut) setActivePicker('checkOut'); else setActivePicker(null); }}
                                        onClose={() => setActivePicker(null)}
                                        className="-left-2 top-[110%]"
                                    />
                                )}
                            </div>

                            <div 
                                className={`p-3 rounded-xl border cursor-pointer transition-all relative ${activePicker === 'checkOut' ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-gray-50 dark:bg-gray-700 z-30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 z-20'}`}
                                onClick={(e) => { e.stopPropagation(); setActivePicker('checkOut'); }}
                            >
                                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block mb-0.5">Check-out</label>
                                <div className={`text-sm font-bold truncate ${checkOut ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{checkOut || 'Select Date'}</div>
                                {activePicker === 'checkOut' && (
                                    <CalendarPopup 
                                        selectedDate={checkOut}
                                        startDate={checkIn}
                                        endDate={checkOut}
                                        minDate={checkIn || today}
                                        unavailableDates={unavailableDates}
                                        onSelect={(d) => { setCheckOut(d); setActivePicker(null); }}
                                        onClose={() => setActivePicker(null)}
                                        className="right-0 top-[110%]"
                                    />
                                )}
                            </div>
                        </div>
                        
                        <div 
                            className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${activePicker === 'guests' ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-gray-50 dark:bg-gray-700 z-10' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 z-10'}`}
                            onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')}
                        >
                                <div>
                                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block mb-0.5">Guests</label>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{guests} guests</div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setGuests(Math.max(1, guests-1))} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white disabled:opacity-50" disabled={guests <= 1}>-</button>
                                    <button onClick={() => setGuests(Math.min(property.maxGuests, guests+1))} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white disabled:opacity-50" disabled={guests >= property.maxGuests}>+</button>
                                </div>
                        </div>
                    </div>

                    <button 
                        onClick={initiateBooking}
                        disabled={!totalNights || isBooking}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg py-3.5 rounded-xl transition-transform active:scale-95 shadow-lg shadow-brand-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {totalNights ? 'Request to Book' : 'Check Availability'}
                    </button>

                    {totalNights > 0 && (
                        <div className="mt-6 space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span className="underline decoration-gray-300 dark:decoration-gray-600">₹{property.baseWeekdayPrice} x {totalNights} nights</span>
                                <span>₹{baseTotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span className="underline decoration-gray-300 dark:decoration-gray-600">Service fee</span>
                                <span>₹{serviceFee?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span className="underline decoration-gray-300 dark:decoration-gray-600">Taxes</span>
                                <span>₹{taxes?.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                                <span>Total</span>
                                <span>₹{grandTotal?.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 lg:hidden z-50 flex justify-between items-center shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] pb-safe transition-colors duration-300">
            <div onClick={() => setActivePicker('checkIn')}>
                <div className="flex items-baseline gap-1">
                     <span className="text-lg font-bold text-gray-900 dark:text-white">₹{property.baseWeekdayPrice?.toLocaleString() || '0'}</span>
                     <span className="text-gray-500 dark:text-gray-400 text-xs">night</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-300 underline decoration-gray-300 dark:decoration-gray-600">
                    {checkIn && checkOut ? `${totalNights} nights` : 'Add dates'}
                </div>
            </div>
            <button 
                onClick={initiateBooking}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg active:scale-95 disabled:opacity-50"
            >
                Reserve
            </button>
            
             {/* Mobile Calendar Modal Triggered by clicking left side */}
             {(activePicker === 'checkIn' || activePicker === 'checkOut') && (
                <div className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/80" onClick={() => setActivePicker(null)}>
                     <CalendarPopup 
                        selectedDate={activePicker === 'checkIn' ? checkIn : checkOut}
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={today}
                        unavailableDates={unavailableDates}
                        onSelect={(d) => {
                            if (activePicker === 'checkIn') {
                                setCheckIn(d);
                                setActivePicker('checkOut');
                            } else {
                                setCheckOut(d);
                                setActivePicker(null);
                            }
                        }}
                        onClose={() => setActivePicker(null)}
                        className="" 
                    />
                </div>
             )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-md w-full relative overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Request</h2>
                        <button onClick={() => setShowConfirmation(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-6 space-y-6">
                        {/* Property Snippet */}
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                <img src={property.images[0]} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{property.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{property.type} in {property.city}</p>
                                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white mt-1">
                                    <Star className="w-3 h-3 fill-current text-gold-500" /> 4.85
                                </div>
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Dates</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{checkIn} → {checkOut}</div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Guests</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{guests} guests</div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span>₹{property.baseWeekdayPrice} x {totalNights} nights</span>
                                <span>₹{baseTotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span>Service fee</span>
                                <span>₹{serviceFee?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                                <span>Taxes</span>
                                <span>₹{taxes?.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white">Total (INR)</span>
                                <span className="font-extrabold text-xl text-brand-600 dark:text-brand-400">₹{grandTotal?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={processBooking}
                        disabled={isBooking}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    >
                        {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request to Book'}
                    </button>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">You won't be charged yet.</p>
                </div>
            </div>
      )}
    </div>
  );
};
