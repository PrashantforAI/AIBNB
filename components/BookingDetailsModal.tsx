
import React from 'react';
import { Booking, UserRole } from '../types';
import { X, Calendar, MapPin, User, CreditCard, Clock, ShieldCheck, AlertCircle, CheckCircle2, Copy, Star, MessageSquare } from 'lucide-react';
import { updateBookingStatus } from '../services/bookingService';

interface BookingDetailsModalProps {
    booking: Booking;
    onClose: () => void;
    userRole: UserRole;
    onUpdate?: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose, userRole, onUpdate }) => {
    
    const handleCancel = async () => {
        if (confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
            try {
                await updateBookingStatus(booking.id, 'cancelled', booking.propertyId, booking.startDate, booking.endDate);
                if (onUpdate) onUpdate();
                onClose();
            } catch (e) {
                alert("Failed to cancel booking.");
            }
        }
    };

    const handleConfirm = async () => {
        try {
            await updateBookingStatus(booking.id, 'confirmed', booking.propertyId, booking.startDate, booking.endDate);
            if (onUpdate) onUpdate();
            onClose();
        } catch (e) {
            alert("Failed to confirm booking.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[95vh] relative">
                
                {/* Modal Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-20 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md rounded-full text-gray-900 dark:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Hero Section */}
                <div className="h-48 md:h-60 relative shrink-0">
                    <img 
                        src={booking.propertyImage || booking.thumbnail} 
                        className="w-full h-full object-cover" 
                        alt={booking.propertyName} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                             {booking.status === 'confirmed' && (
                                <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Confirmed
                                </span>
                             )}
                             {booking.status === 'pending' && (
                                <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3" /> Awaiting Approval
                                </span>
                             )}
                             {booking.status === 'cancelled' && (
                                <span className="bg-gray-500 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                                    <X className="w-3 h-3" /> Cancelled
                                </span>
                             )}
                        </div>
                        <h1 className="text-3xl font-extrabold shadow-sm">{booking.propertyName}</h1>
                        <p className="flex items-center gap-1.5 opacity-90 text-sm mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {booking.location}
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-8 space-y-8">
                        
                        {/* 1. Reservation Details Row */}
                        <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
                             <div className="space-y-1">
                                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-in</p>
                                 <p className="text-xl font-bold text-gray-900 dark:text-white">{booking.startDate}</p>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{booking.checkInTime || '14:00 PM'}</p>
                             </div>
                             <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-800 h-12 self-center"></div>
                             <div className="space-y-1">
                                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-out</p>
                                 <p className="text-xl font-bold text-gray-900 dark:text-white">{booking.endDate}</p>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{booking.checkOutTime || '11:00 AM'}</p>
                             </div>
                             <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-800 h-12 self-center"></div>
                             <div className="space-y-1">
                                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirmation Code</p>
                                 <div 
                                    onClick={() => copyToClipboard(booking.bookingCode)}
                                    className="flex items-center gap-2 cursor-pointer group"
                                 >
                                     <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{booking.bookingCode}</p>
                                     <Copy className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                                 </div>
                             </div>
                        </div>

                        {/* 2. Host / Guest Info */}
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={userRole === UserRole.GUEST ? (booking.hostAvatar || 'https://via.placeholder.com/100') : (booking.guestAvatar || 'https://via.placeholder.com/100')} 
                                    alt="Profile" 
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {userRole === UserRole.GUEST ? 'Hosted by' : 'Booked by'}
                                    </p>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {userRole === UserRole.GUEST ? (booking.hostName || 'Pine Stays') : (booking.guestName || 'Guest')}
                                    </h3>
                                    {userRole === UserRole.HOST && (
                                        <p className="text-sm text-gray-500">{booking.guestCount} guests</p>
                                    )}
                                </div>
                            </div>
                            <button className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-full transition-colors text-gray-900 dark:text-white">
                                <MessageSquare className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 3. Payment Breakdown */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Payment Info</h3>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                                    <span className="font-bold text-gray-900 dark:text-white">₹{booking.totalPrice?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Payment Status</span>
                                    <span className={`font-bold capitalize flex items-center gap-1.5 ${booking.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                                        {booking.paymentStatus === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4"/>}
                                        {booking.paymentStatus}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                    <span className="text-gray-600 dark:text-gray-400">Paid via</span>
                                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> 
                                        {booking.paymentMethod?.replace('_', ' ').toUpperCase() || 'CREDIT CARD'}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                {booking.status !== 'cancelled' && (
                    <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row gap-3">
                        {userRole === UserRole.HOST && booking.status === 'pending' ? (
                            <>
                                <button 
                                    onClick={handleCancel}
                                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Decline Request
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    className="flex-1 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity shadow-lg"
                                >
                                    Approve Booking
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Support
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    className="flex-1 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold transition-colors"
                                >
                                    Cancel Reservation
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
