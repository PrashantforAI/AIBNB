
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
  
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);

  // Edit Panel State
  const [editPrice, setEditPrice] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'available' | 'blocked'>('available');
  const [editMinStay, setEditMinStay] = useState<string>('');
  const [applyWeekendsOnly, setApplyWeekendsOnly] = useState(false);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // --- Date Helpers ---
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
      return day === 5 || day === 6 || day === 0;
  };

  // --- Interaction Handlers ---
  const handleDateClick = (dateStr: string, e: React.MouseEvent) => {
    const newSet = new Set<string>(e.ctrlKey || e.metaKey ? selectedDates : []);
    
    if (e.shiftKey && lastClickedDate) {
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
    const dateList: string[] = Array.from(selectedDates) as string[];

    dateList.forEach((dateStr: string) => {
        const isWeekend = isWeekendDay(dateStr);
        if (applyWeekendsOnly && !isWeekend) return;

        const existingStatus = newCalendar[dateStr]?.status;
        if (existingStatus === 'booked') return; 
        
        const price = parseInt(editPrice);
        const minStay = parseInt(editMinStay);
        
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
      days.push(<div key={`empty-${i}`} className="bg-white/30 dark:bg-gray-800/30 border-b border-r border-gray-100 dark:border-gray-800 min-h-[100px]"></div>);
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
      
      let bgClass = 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
      if (status === 'blocked') bgClass = 'bg-gray-50 dark:bg-gray-800 pattern-diagonal-lines-sm text-gray-400 dark:text-gray-500';
      if (status === 'booked') bgClass = 'bg-red-50/20 dark:bg-red-900/20';
      if (isSelected) bgClass = 'bg-gray-900 dark:bg-white text-white dark:text-black ring-2 ring-inset ring-gray-900 dark:ring-white z-10';

      days.push(
        <div 
          key={dateStr}
          onClick={(e) => handleDateClick(dateStr, e)}
          className={`relative p-2 border-b border-r border-gray-200 dark:border-gray-800 cursor-pointer transition-all flex flex-col justify-between group select-none min-h-[100px] ${bgClass}`}
        >
          <div className="flex justify-between items-start">
             <span className={`text-sm font-semibold ${isSelected ? 'text-white dark:text-black' : (status === 'booked' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-200')} ${d === 1 ? 'underline decoration-brand-300' : ''}`}>
                 {d}
             </span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
             {status === 'booked' ? (
                 <div className="flex flex-col items-center animate-fadeIn">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2 border-white dark:border-gray-700 shadow-sm ${isSelected ? 'bg-white/20 text-white dark:text-black' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                        <User className="w-4 h-4" />
                     </div>
                     <span className={`text-[10px] font-bold truncate max-w-full px-1 ${isSelected ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-300'}`}>{guestName || 'Reserved'}</span>
                 </div>
             ) : (
                <div className="flex flex-col items-center">
                    {status === 'blocked' ? (
                         <span className={`text-xs font-medium ${isSelected ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>Blocked</span>
                    ) : (
                        <span className={`text-sm font-medium ${isSelected ? 'text-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}`}>₹{price?.toLocaleString()}</span>
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
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-fadeIn relative transition-colors duration-300">
      {/* Top Bar */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-900 z-20 shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
                <span className="font-bold text-lg md:text-xl text-gray-900 dark:text-white w-36 md:w-48 text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm"><ChevronRight className="w-4 h-4"/></button>
             </div>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <select 
                value={selectedPropertyId} 
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full md:w-auto"
            >
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <div className="hidden md:flex gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800"></div>Booked</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 pattern-diagonal-lines-sm"></div>Blocked</div>
            </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {day}
                    </div>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
                <div className="grid grid-cols-7 border-l border-gray-200 dark:border-gray-800 min-w-[600px] md:min-w-0">
                    {renderCalendar()}
                </div>
            </div>
        </div>

        {/* Dynamic Sidebar/Bottom Panel */}
        {selectedDates.size > 0 && (
            <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-2xl z-30 shrink-0 h-1/2 md:h-auto animate-slideUp md:animate-slideInRight transition-colors duration-300">
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900 md:bg-white md:dark:bg-gray-900">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {isSelectionBooked ? 'Booking Details' : 'Edit Selection'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected</p>
                    </div>
                    <button onClick={handleClearSelection} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
                {isSelectionBooked && bookingDetails ? (
                    // --- BOOKING DETAILS VIEW ---
                    <>
                        <div className="flex flex-col items-center py-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
                             <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 mb-3 text-xl font-bold border border-gray-100 dark:border-gray-600">
                                {bookingDetails.guestName.charAt(0)}
                             </div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">{bookingDetails.guestName}</h3>
                             <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full mt-1 border border-green-100 dark:border-green-800 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Confirmed
                             </span>
                        </div>

                        <div className="space-y-3">
                             <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Dates</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{bookingDetails.startDate} <span className="text-gray-400 mx-1">→</span> {bookingDetails.endDate}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Total Payout</span>
                                <span className="font-bold text-gray-900 dark:text-white">₹{bookingDetails.totalPayout.toLocaleString()}</span>
                             </div>
                        </div>

                        <button className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                            <MessageSquare className="w-4 h-4" /> Message Guest
                        </button>
                    </>
                ) : (
                    // --- EDIT FORM VIEW ---
                    <>
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pricing</h4>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-900 dark:text-white font-bold">₹</span>
                                <input 
                                    type="number" 
                                    value={editPrice}
                                    onChange={e => setEditPrice(e.target.value)}
                                    disabled={editStatus === 'blocked'}
                                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition-all disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400 shadow-sm"
                                />
                            </div>
                             <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800 shadow-sm">
                                <input 
                                    type="checkbox" 
                                    checked={applyWeekendsOnly}
                                    onChange={e => setApplyWeekendsOnly(e.target.checked)}
                                    className="w-5 h-5 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Apply to weekends only</span>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</h4>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setEditStatus('available')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${editStatus === 'available' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    Available
                                </button>
                                <button 
                                    onClick={() => setEditStatus('blocked')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${editStatus === 'blocked' ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    Blocked
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-base hover:bg-black dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg mt-auto"
                        >
                            Save Changes
                        </button>
                    </>
                )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
