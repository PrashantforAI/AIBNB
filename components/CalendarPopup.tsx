import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPopupProps {
    selectedDate?: string; // The value of the specific input being edited
    startDate?: string;    // The start of the range (for visualization)
    endDate?: string;      // The end of the range (for visualization)
    onSelect: (date: string) => void;
    minDate?: string;
    unavailableDates?: Set<string>; // Dates that are booked or blocked
    onClose?: () => void;
}

export const CalendarPopup: React.FC<CalendarPopupProps> = ({ 
    selectedDate, 
    startDate,
    endDate,
    onSelect, 
    minDate, 
    unavailableDates,
    onClose 
}) => {
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDay = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDay(year, month);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const minDateStr = minDate || todayStr;

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const dateObj = new Date(year, month, day);
        // Robust local date string generation
        const localDateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        onSelect(localDateStr);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div 
            className="absolute top-[110%] left-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 w-[340px] animate-fadeIn select-none" 
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <span className="font-bold text-gray-900 text-base">{monthNames[month]} {year}</span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-3 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
            </div>

            {/* Days Grid - Gap removed for seamless range */}
            <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(year, month, day);
                    const localDateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    
                    const isPast = localDateStr < minDateStr;
                    const isUnavailable = unavailableDates?.has(localDateStr);
                    const isDisabled = isPast || isUnavailable;
                    
                    const isSelected = selectedDate === localDateStr;
                    const isToday = localDateStr === todayStr;

                    // Range Logic
                    const isRangeStart = startDate === localDateStr;
                    const isRangeEnd = endDate === localDateStr;
                    const isInRange = startDate && endDate && localDateStr > startDate && localDateStr < endDate;
                    
                    // Specific highlight overrides general selection
                    const isHighlight = isSelected || isRangeStart || isRangeEnd;

                    return (
                        <div key={day} className="h-10 w-full relative flex items-center justify-center">
                            {/* Range Background Connector */}
                            <div className={`
                                absolute inset-y-0.5
                                ${isInRange ? 'left-0 right-0 bg-gray-100' : ''}
                                ${isRangeStart && endDate && endDate > localDateStr ? 'left-1/2 right-0 bg-gray-100' : ''}
                                ${isRangeEnd && startDate && startDate < localDateStr ? 'left-0 right-1/2 bg-gray-100' : ''}
                            `} />

                            <button
                                onClick={() => !isDisabled && handleDateClick(day)}
                                disabled={isDisabled}
                                className={`
                                    h-9 w-9 rounded-full text-sm font-semibold flex items-center justify-center transition-all relative z-10
                                    ${isHighlight 
                                        ? 'bg-black text-white shadow-md' 
                                        : isDisabled 
                                            ? 'text-gray-300 cursor-not-allowed decoration-gray-300' 
                                            : 'hover:bg-gray-100 text-gray-700 hover:border-gray-200 border border-transparent'
                                    }
                                    ${isUnavailable && !isPast ? 'line-through decoration-red-400 opacity-60' : ''}
                                    ${isToday && !isHighlight && !isDisabled ? 'text-black font-extrabold after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-black after:rounded-full' : ''}
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* Footer */}
            {onClose && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-right">
                    <button onClick={onClose} className="text-xs font-bold text-gray-900 underline hover:text-gray-700">Close</button>
                </div>
            )}
        </div>
    );
};