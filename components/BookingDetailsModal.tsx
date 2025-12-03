
import React from 'react';
import { Booking, UserRole } from '../types';
import { X, Calendar, MapPin, User, CreditCard, Clock, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
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

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                
                {/* Header with Image */}
                <div className="relative h-40 shrink-0">
                    <img src={booking.thumbnail} className="w-full h-full object-cover opacity-90" alt={booking.propertyName} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white shadow-sm leading-tight">{booking.propertyName}</h2>
                                <p className="text-gray-200 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {booking.location}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusColor(booking.status)}`}>
                                {booking.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Booking Reference */}
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Booking Reference</p>
                            <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{booking.bookingCode || `#${booking.id.slice(-6).toUpperCase()}`}</p>
                        </div>
                        {booking.status === 'confirmed' && (
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        )}
                    </div>

                    {/* Dates & Guests */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Check-in</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">{booking.startDate}</p>
                            <p className="text-xs text-gray-400">{booking.checkInTime || '14:00 PM'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Check-out</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">{booking.endDate}</p>
                            <p className="text-xs text-gray-400">{booking.checkOutTime || '11:00 AM'}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 py-3 border-y border-gray-100 dark:border-gray-800">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{booking.guestCount} Guests</span>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Details
                        </h3>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                                <span className="font-bold text-gray-900 dark:text-white">₹{booking.totalPrice?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Status</span>
                                <span className={`font-bold capitalize ${booking.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600'}`}>
                                    {booking.paymentStatus || 'Pending'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Method</span>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">{booking.paymentMethod?.replace('_', ' ') || 'Pay at property'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Special Requests
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                                "{booking.notes}"
                            </p>
                        </div>
                    )}

                    {/* Policies */}
                    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <p>Cancellation is subject to property rules. Contact support for disputes.</p>
                    </div>
                </div>

                {/* Actions Footer */}
                {booking.status !== 'cancelled' && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
                        {userRole === UserRole.HOST && booking.status === 'pending' ? (
                            <>
                                <button 
                                    onClick={handleCancel}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity shadow-lg"
                                >
                                    Approve Booking
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    Reschedule
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    className="flex-1 py-3 rounded-xl bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Cancel Booking
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
