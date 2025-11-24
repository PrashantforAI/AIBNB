import React, { useState } from 'react';
import { Property, DaySettings } from '../types';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Save, Check, User, MessageSquare, AlertCircle } from 'lucide-react';

interface CalendarManagerProps {
  properties: Property[];
  onUpdateProperty: (updatedProperty: Property) => void;
}

export const CalendarManager: React.FC<CalendarManagerProps> = ({ properties, onUpdateProperty }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selection State: Using a Set for multiple non-concurrent dates
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);

  // Edit Panel State
  const [editPrice, setEditPrice] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'available' | 'blocked'>('available');
  const [editMinStay, setEditMinStay] = useState<string>('');
  const [applyWeekendsOnly, setApplyWeekendsOnly] = useState(false);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // --- Date Helpers ---

  // robustly parse YYYY-MM-DD to a local Date object without UTC shifts
  const parseDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const isWeekendDay = (dateStr: string) => {
      const d = parseDate(dateStr);
      const day = d.getDay();
      // Friday (5), Saturday (6), Sunday (0)
      return day === 5 || day === 6 || day === 0;
  };

  // --- Interaction Handlers ---

  const handleDateClick = (dateStr: string, e: React.MouseEvent) => {
    const newSet = new Set<string>(e.ctrlKey || e.metaKey ? selectedDates : []);
    
    if (e.shiftKey && lastClickedDate) {
        // Range selection
        const start = parseDate(lastClickedDate);
        const end = parseDate(dateStr);
        const low = start < end ? start : end;
        const high = start < end ? end : start;
        
        const loop = new Date(low);
        while (loop <= high) {
            newSet.add(formatDate(loop));
            loop.setDate(loop.getDate() + 1);
        }
    } else {
        // Single or Toggle
        if (e.ctrlKey || e.metaKey) {
             if (newSet.has(dateStr)) newSet.delete(dateStr);
             else newSet.add(dateStr);
        } else {
            newSet.add(dateStr);
        }
    }

    setSelectedDates(newSet);
    setLastClickedDate(dateStr);

    if (newSet.size === 1 || !e.ctrlKey) {
        const daySettings = selectedProperty?.calendar?.[dateStr];
        const isWknd = isWeekendDay(dateStr);
        
        setEditStatus(daySettings?.status === 'blocked' ? 'blocked' : 'available');
        setEditPrice(daySettings?.price?.toString() || (isWknd ? selectedProperty?.baseWeekendPrice.toString() : selectedProperty?.baseWeekdayPrice.toString()) || '');
        setEditMinStay(daySettings?.minStay?.toString() || '1');
    }
  };

  const handleClearSelection = () => {
      setSelectedDates(new Set());
      setLastClickedDate(null);
  };

  const handleSave = () => {
    if (!selectedProperty) return;

    const newCalendar: Record<string, DaySettings> = { ...(selectedProperty.calendar || {}) };

    selectedDates.forEach((dateStr: string) => {
        const isWeekend = isWeekendDay(dateStr);
        if (applyWeekendsOnly && !isWeekend) return;

        const existingStatus = newCalendar[dateStr]?.status;
        if (existingStatus === 'booked') return; 
        
        const price = parseInt(editPrice);
        const minStay = parseInt(editMinStay);
        
        // Fix: Avoid setting undefined values
        const settings: DaySettings = {
            date: dateStr,
            status: editStatus as any,
        };

        if (!isNaN(price) && price > 0) {
            settings.price = price;
        }
        
        if (!isNaN(minStay) && minStay > 1) {
            settings.minStay = minStay;
        }

        newCalendar[dateStr] = settings;
    });

    onUpdateProperty({
        ...selectedProperty,
        calendar: newCalendar
    });

    handleClearSelection();
  };

  const selectedDatesList: string[] = Array.from(selectedDates).sort() as string[];
  const isSelectionBooked = selectedDatesList.length > 0 && selectedDatesList.every((d: string) => selectedProperty?.calendar?.[d]?.status === 'booked');
  
  const bookingDetails = isSelectionBooked ? {
      guestName: selectedProperty?.calendar?.[selectedDatesList[0]]?.guestName || 'Unknown Guest',
      totalPayout: selectedDatesList.reduce((sum: number, d: string) => sum + (selectedProperty?.calendar?.[d]?.price || 0), 0),
      startDate: selectedDatesList[0],
      endDate: selectedDatesList[selectedDatesList.length - 1],
      nights: selectedDatesList.length
  } : null;

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay(); 

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-white/30 border-b border-r border-gray-100"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const isSelected = selectedDates.has(dateStr);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5;
      
      const daySettings = selectedProperty?.calendar?.[dateStr];
      const status = daySettings?.status || 'available';
      const price = daySettings?.price || (isWeekend ? selectedProperty?.baseWeekendPrice : selectedProperty?.baseWeekdayPrice);
      const guestName = daySettings?.guestName;
      
      let bgClass = 'bg-white hover:bg-gray-50';
      if (status === 'blocked') bgClass = 'bg-gray-50 pattern-diagonal-lines-sm text-gray-400';
      if (status === 'booked') bgClass = 'bg-red-50/20';
      if (isSelected) bgClass = 'bg-gray-900 text-white ring-2 ring-inset ring-gray-900 z-10';

      days.push(
        <div 
          key={dateStr}
          onClick={(e) => handleDateClick(dateStr, e)}
          className={`relative p-2 border-b border-r border-gray-200 cursor-pointer transition-all flex flex-col justify-between group select-none ${bgClass}`}
        >
          <div className="flex justify-between items-start">
             <span className={`text-sm font-semibold ${isSelected ? 'text-white' : (status === 'booked' ? 'text-gray-400' : 'text-gray-900')} ${d === 1 ? 'underline decoration-brand-300' : ''}`}>
                 {d}
             </span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
             {status === 'booked' ? (
                 <div className="flex flex-col items-center animate-fadeIn">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2 border-white shadow-sm ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                        <User className="w-4 h-4" />
                     </div>
                     <span className={`text-[10px] font-bold truncate max-w-full px-1 ${isSelected ? 'text-gray-300' : 'text-gray-900'}`}>{guestName || 'Reserved'}</span>
                 </div>
             ) : (
                <div className="flex flex-col items-center">
                    {status === 'blocked' ? (
                         <span className={`text-xs font-medium ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>Blocked</span>
                    ) : (
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>₹{price?.toLocaleString()}</span>
                    )}
                </div>
             )}
          </div>
        </div>
      );
    }

    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 animate-fadeIn">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-20 shrink-0 h-20">
        <div className="flex items-center gap-6">
             <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-900 border border-gray-200 shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
                <span className="font-bold text-xl text-gray-900 w-48 text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-900 border border-gray-200 shadow-sm"><ChevronRight className="w-4 h-4"/></button>
             </div>
             
             <div className="h-8 w-px bg-gray-200"></div>

             <select 
                value={selectedPropertyId} 
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-gray-900 outline-none hover:bg-gray-100 transition-colors"
             >
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
             </select>
        </div>
        
        <div className="flex gap-4 text-xs font-medium text-gray-500">
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></div>Booked</div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-200 pattern-diagonal-lines-sm"></div>Blocked</div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-gray-300"></div>Available</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col bg-white">
            <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-gray-900' : 'text-gray-500'}`}>
                        {day}
                    </div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l border-gray-200">
                {renderCalendar()}
            </div>
        </div>

        {/* Dynamic Sidebar Panel */}
        {selectedDates.size > 0 && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-30 shrink-0 animate-slideInRight">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                            {isSelectionBooked ? 'Booking Details' : 'Edit Selection'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected</p>
                    </div>
                    <button onClick={handleClearSelection} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {isSelectionBooked && bookingDetails ? (
                    // --- BOOKING DETAILS VIEW ---
                    <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                        <div className="flex flex-col items-center py-8 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
                             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-700 mb-4 text-2xl font-bold border border-gray-200 shadow-md">
                                {bookingDetails.guestName.charAt(0)}
                             </div>
                             <h3 className="text-xl font-bold text-gray-900">{bookingDetails.guestName}</h3>
                             <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full mt-2 border border-green-100 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Confirmed
                             </span>
                        </div>

                        <div className="space-y-4">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Reservation Info</h4>
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Dates</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-900">{bookingDetails.startDate}</div>
                                        <div className="text-xs text-gray-400">to {bookingDetails.endDate}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Duration</span>
                                    <span className="text-sm font-semibold text-gray-900">{bookingDetails.nights} Nights</span>
                                </div>
                             </div>
                             
                             <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-end">
                                 <span className="text-sm font-medium text-gray-500 pb-1">Total Payout</span>
                                 <span className="text-2xl font-bold text-gray-900">₹{bookingDetails.totalPayout.toLocaleString()}</span>
                             </div>
                        </div>

                        <div className="space-y-3 pt-6">
                             <button className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                 <MessageSquare className="w-4 h-4" /> Message Guest
                             </button>
                             <button className="w-full py-3 bg-white border border-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                 <AlertCircle className="w-4 h-4" /> Cancel Reservation
                             </button>
                        </div>
                    </div>
                ) : (
                    // --- EDIT FORM VIEW (For Available/Blocked Dates) ---
                    <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Price Settings</h4>
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-500 uppercase">Nightly Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-900 font-semibold">₹</span>
                                    <input 
                                        type="number" 
                                        value={editPrice}
                                        onChange={e => setEditPrice(e.target.value)}
                                        disabled={editStatus === 'blocked'}
                                        className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold text-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 shadow-sm"
                                    />
                                </div>
                            </div>

                             <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors bg-white shadow-sm">
                                <input 
                                    type="checkbox" 
                                    checked={applyWeekendsOnly}
                                    onChange={e => setApplyWeekendsOnly(e.target.checked)}
                                    className="w-5 h-5 text-black rounded border-gray-300 focus:ring-black"
                                />
                                <div>
                                    <span className="text-sm font-bold text-gray-900 block">Apply to weekends only</span>
                                    <span className="text-xs text-gray-500 block leading-tight mt-0.5">Fridays, Saturdays, Sundays</span>
                                </div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Availability</h4>
                            <div className="flex flex-col gap-2">
                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${editStatus === 'available' ? 'border-black bg-gray-50 ring-1 ring-black shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <span className="text-sm font-bold text-gray-900">Available</span>
                                    <input 
                                        type="radio" 
                                        name="status"
                                        checked={editStatus === 'available'}
                                        onChange={() => setEditStatus('available')}
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                </label>
                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${editStatus === 'blocked' ? 'border-black bg-gray-50 ring-1 ring-black shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <span className="text-sm font-bold text-gray-900">Blocked</span>
                                    <input 
                                        type="radio" 
                                        name="status"
                                        checked={editStatus === 'blocked'}
                                        onChange={() => setEditStatus('blocked')}
                                        className="w-4 h-4 text-black focus:ring-black"
                                    />
                                </label>
                            </div>

                             <div className="space-y-2 pt-2">
                                <label className="text-xs font-medium text-gray-500 uppercase">Min. Nights</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={editMinStay}
                                        onChange={e => setEditMinStay(e.target.value)}
                                        className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-black outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!isSelectionBooked && (
                    <div className="p-6 border-t border-gray-200 bg-white">
                        <button 
                            onClick={handleSave}
                            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};