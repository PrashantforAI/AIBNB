
import React, { useState, useEffect } from 'react';
import { Property, Booking, UserRole } from '../types';
import { BarChart, Activity, IndianRupee, Users, Calendar, ArrowUpRight, Sparkles, CheckCircle2, Star, Wrench, Clock, Check, X, Loader2, MessageSquare } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { fetchPendingBookings, updateBookingStatus, fetchHostBookings } from '../services/bookingService';
import { startConversation } from '../services/chatService';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { generateHostInsights } from '../services/aiService';

interface HostDashboardProps {
  properties: Property[];
  onNavigate: (page: string) => void;
  onRefresh?: () => void;
  onStartAIListing?: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ properties, onNavigate, onRefresh, onStartAIListing }) => {
  // Stats State
  const [stats, setStats] = useState({
      revenue: 0,
      occupancy: 0,
      activeGuests: 0,
      upcomingCheckins: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  // Booking Lists
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
      setLoadingRequests(true);
      try {
          const allBookings = await fetchHostBookings('host1');
          
          const pending = allBookings.filter(b => b.status === 'pending');
          const confirmed = allBookings.filter(b => b.status === 'confirmed');
          
          setPendingBookings(pending);

          const now = new Date();
          const currentMonth = now.getMonth();
          const todayStr = now.toISOString().split('T')[0];

          const monthlyRevenue = confirmed
              .filter(b => new Date(b.startDate).getMonth() === currentMonth)
              .reduce((sum, b) => sum + b.totalPrice, 0);

          const active = confirmed
              .filter(b => b.startDate <= todayStr && b.endDate > todayStr)
              .reduce((sum, b) => sum + b.guestCount, 0);

          const upcoming = confirmed
              .filter(b => b.startDate > todayStr)
              .length;

          const avgOcc = Math.round(properties.reduce((sum, p) => sum + p.occupancyRate, 0) / (properties.length || 1));

          setStats({ revenue: monthlyRevenue, activeGuests: active, upcomingCheckins: upcoming, occupancy: avgOcc });

          const cData = properties.map(p => {
              const propRevenue = confirmed
                  .filter(b => b.propertyId === p.id && new Date(b.startDate).getMonth() === currentMonth)
                  .reduce((sum, b) => sum + b.totalPrice, 0);
              return {
                  name: p.title.length > 12 ? p.title.substring(0, 10) + '...' : p.title,
                  revenue: propRevenue,
                  occupancy: p.occupancyRate
              };
          });
          setChartData(cData);

          const feed = allBookings
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map(b => ({
                  id: b.id,
                  type: b.status === 'pending' ? 'request' : 'booking',
                  title: b.status === 'pending' ? 'New Request' : 'Confirmed Booking',
                  desc: `${b.guestName} • ${b.propertyName}`,
                  time: new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  icon: Calendar,
                  color: b.status === 'pending' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'
              }));
          setActivityFeed(feed);

          const insights = await generateHostInsights(properties, confirmed);
          setAiInsights(insights);

      } catch (e) {
          console.error("Dashboard load failed", e);
      } finally {
          setLoadingRequests(false);
      }
  };

  useEffect(() => { loadData(); }, [properties]);

  const handleRequestAction = async (booking: Booking, status: 'confirmed' | 'cancelled', e: React.MouseEvent) => {
      e.stopPropagation();
      setProcessingId(booking.id);
      try {
          await updateBookingStatus(booking.id, status, booking.propertyId, booking.startDate, booking.endDate);
          loadData();
          if (onRefresh) onRefresh(); 
          setSelectedBooking(null);
      } catch (e) {
          alert("Failed to update status");
      } finally {
          setProcessingId(null);
      }
  };

  const handleMessageGuest = async (booking: Booking, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
           await startConversation(
             'host1', 
             booking.userId || 'guest_user_1', 
             booking.guestName || 'Guest',
             booking.guestAvatar || '',
             'Pine Stays',
             'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
             booking.propertyName
           );
           onNavigate('messages');
      } catch (e) { console.error("Failed to start message", e); }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Overview</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Portfolio performance</p>
        </div>
        {onStartAIListing && (
            <button 
                onClick={onStartAIListing}
                className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/20 transition-all active:scale-95"
            >
                <Sparkles className="w-4 h-4" /> List with AI Assistant
            </button>
        )}
      </header>

      {/* Booking Requests */}
      {pendingBookings.length > 0 && (
          <div className="space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Requests ({pendingBookings.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingBookings.map(booking => (
                      <div 
                        key={booking.id} 
                        className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                  <img src={booking.guestAvatar || 'https://via.placeholder.com/100'} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                                  <div>
                                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{booking.guestName || 'Guest'}</h3>
                                      <p className="text-xs text-gray-500">{booking.propertyName}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={(e) => handleRequestAction(booking, 'cancelled', e)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><X className="w-4 h-4"/></button>
                                  <button onClick={(e) => handleRequestAction(booking, 'confirmed', e)} className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80"><Check className="w-4 h-4"/></button>
                              </div>
                          </div>
                          <div className="text-xs text-gray-500 flex justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span>{booking.startDate} → {booking.endDate}</span>
                              <span className="font-bold text-gray-900 dark:text-white">₹{booking.totalPrice?.toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Analytics Cards - Adaptive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<IndianRupee className="w-4 h-4"/>} />
        <StatCard title="Avg. Occupancy" value={`${stats.occupancy}%`} icon={<Activity className="w-4 h-4"/>} />
        <StatCard title="Active Guests" value={stats.activeGuests} icon={<Users className="w-4 h-4"/>} />
        <StatCard title="Upcoming" value={stats.upcomingCheckins} icon={<Calendar className="w-4 h-4"/>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Analysis</h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#6b7280'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#2563eb" barSize={30} />
                </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
            {/* Minimal AI Insights */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" /> AI Insights
                </div>
                <div className="space-y-3">
                    {aiInsights.length > 0 ? aiInsights.map((insight, i) => (
                        <div key={i} className="text-xs">
                            <div className="font-bold text-gray-900 dark:text-white mb-0.5">{insight.title}</div>
                            <div className="text-gray-600 dark:text-gray-400 leading-snug">{insight.desc}</div>
                        </div>
                    )) : <p className="text-xs text-gray-400">Analyzing data...</p>}
                </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Activity</h3>
                <div className="space-y-4">
                    {activityFeed.map((item, i) => (
                        <div key={i} className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${item.color.includes('amber') ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</div>
                                <div className="text-[10px] text-gray-500">{item.desc} • {item.time}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {selectedBooking && (
          <BookingDetailsModal booking={selectedBooking} userRole={UserRole.HOST} onClose={() => setSelectedBooking(null)} onUpdate={loadData} />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon} <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
  </div>
);
