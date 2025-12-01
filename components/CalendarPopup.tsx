
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarPopupProps {
    selectedDate?: string;
    startDate?: string;
    endDate?: string;
    onSelect: (date: string) => void;
    minDate?: string;
    unavailableDates?: Set<string>;
    onClose?: () => void;
    className?: string;
}

export const CalendarPopup: React.FC<CalendarPopupProps> = ({ 
    selectedDate, 
    startDate,
    endDate,
    onSelect, 
    minDate, 
    unavailableDates,
    onClose,
    className
}) => {
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        const localDateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        onSelect(localDateStr);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const calendarContent = (
        <div className={`p-6 ${isMobile ? 'bg-white dark:bg-gray-900' : ''} h-full flex flex-col text-gray-900 dark:text-white`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <button onClick={handlePrevMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-gray-100 dark:border-gray-700 shadow-sm"><ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" /></button>
                <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{monthNames[month]} {year}</span>
                <button onClick={handleNextMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-gray-100 dark:border-gray-700 shadow-sm"><ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" /></button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-4 text-center shrink-0">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 overflow-y-auto">
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
                    const isHighlight = isSelected || isRangeStart || isRangeEnd;

                    return (
                        <div key={day} className="h-10 w-full relative flex items-center justify-center">
                            {/* Range Connector */}
                            <div className={`
                                absolute inset-y-0.5
                                ${isInRange ? 'left-0 right-0 bg-gray-100 dark:bg-gray-700' : ''}
                                ${isRangeStart && endDate && endDate > localDateStr ? 'left-1/2 right-0 bg-gray-100 dark:bg-gray-700' : ''}
                                ${isRangeEnd && startDate && startDate < localDateStr ? 'left-0 right-1/2 bg-gray-100 dark:bg-gray-700' : ''}
                            `} />

                            <button
                                onClick={() => !isDisabled && handleDateClick(day)}
                                disabled={isDisabled}
                                className={`
                                    h-10 w-10 rounded-full text-sm font-semibold flex items-center justify-center transition-all relative z-10
                                    ${isHighlight 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg scale-105' 
                                        : isDisabled 
                                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white border border-transparent'
                                    }
                                    ${isUnavailable && !isPast ? 'line-through decoration-red-400 opacity-50' : ''}
                                    ${isToday && !isHighlight && !isDisabled ? 'ring-1 ring-gray-900 dark:ring-white text-gray-900 dark:text-white font-bold' : ''}
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* Mobile Close Button */}
            {isMobile && onClose && (
                <div className="mt-auto pt-6 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full py-4 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        Close
                    </button>
                </div>
            )}
            
            {/* Desktop Close Text */}
            {!isMobile && onClose && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end shrink-0">
                    <button onClick={onClose} className="text-xs font-bold text-gray-900 dark:text-white hover:underline">Close</button>
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden animate-slideUp sm:animate-scaleIn h-[80vh] sm:h-auto border border-gray-200 dark:border-gray-800">
                    {calendarContent}
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`absolute top-[120%] left-0 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-800 p-6 z-50 min-w-[340px] w-full animate-fadeIn select-none ring-1 ring-black/5 dark:ring-white/5 ${className || ''}`} 
            onClick={(e) => e.stopPropagation()}
        >
            {calendarContent}
        </div>
    );
};
