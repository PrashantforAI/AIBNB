
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
  onRefresh?: () => void; // Added for calendar sync
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ properties, onNavigate, onRefresh }) => {
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
  
  // State for Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
      setLoadingRequests(true);
      try {
          // 1. Fetch ALL bookings for this host
          const allBookings = await fetchHostBookings('host1'); // Using hardcoded host1 for demo consistency
          
          const pending = allBookings.filter(b => b.status === 'pending');
          const confirmed = allBookings.filter(b => b.status === 'confirmed');
          
          setPendingBookings(pending);

          // 2. Calculate Stats
          const now = new Date();
          const currentMonth = now.getMonth();
          const todayStr = now.toISOString().split('T')[0];

          // Revenue (Current Month)
          const monthlyRevenue = confirmed
              .filter(b => new Date(b.startDate).getMonth() === currentMonth)
              .reduce((sum, b) => sum + b.totalPrice, 0);

          // Active Guests (Today is between Start and End)
          const active = confirmed
              .filter(b => b.startDate <= todayStr && b.endDate > todayStr)
              .reduce((sum, b) => sum + b.guestCount, 0);

          // Upcoming Check-ins (Start date > today)
          const upcoming = confirmed
              .filter(b => b.startDate > todayStr)
              .length;

          // Occupancy (Simple approximation: booked nights / total nights in month * properties)
          // For demo, we stick to property.occupancyRate average, or calc real
          const avgOcc = Math.round(properties.reduce((sum, p) => sum + p.occupancyRate, 0) / (properties.length || 1));

          setStats({
              revenue: monthlyRevenue,
              activeGuests: active,
              upcomingCheckins: upcoming,
              occupancy: avgOcc
          });

          // 3. Prepare Chart Data (Revenue per Property)
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

          // 4. Activity Feed (Newest bookings)
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
                  color: b.status === 'pending' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-brand-500 bg-brand-50 dark:bg-brand-900/20'
              }));
          setActivityFeed(feed);

          // 5. Generate Insights
          const insights = await generateHostInsights(properties, confirmed);
          setAiInsights(insights);

      } catch (e) {
          console.error("Dashboard load failed", e);
      } finally {
          setLoadingRequests(false);
      }
  };

  useEffect(() => {
      loadData();
  }, [properties]); // Reload when properties change (or on refresh trigger)

  const handleRequestAction = async (booking: Booking, status: 'confirmed' | 'cancelled', e: React.MouseEvent) => {
      e.stopPropagation();
      setProcessingId(booking.id);
      try {
          await updateBookingStatus(booking.id, status, booking.propertyId, booking.startDate, booking.endDate);
          loadData(); // Reload all data to update charts/stats
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
      } catch (e) {
          console.error("Failed to start message", e);
      }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">Overview</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Your portfolio performance at a glance.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-300 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Live Updates
        </div>
      </header>

      {/* Booking Requests Section */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-6 bg-brand-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Requests</h2>
              {pendingBookings.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingBookings.length}</span>
              )}
          </div>
          
          {loadingRequests ? (
              <div className="flex items-center gap-2 text-gray-500 p-4"><Loader2 className="w-5 h-5 animate-spin"/> Loading requests...</div>
          ) : pendingBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 italic text-sm">
                  No pending booking requests.
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingBookings.map(booking => (
                      <div 
                        key={booking.id} 
                        className="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-2xl border border-brand-100 dark:border-brand-900/30 shadow-lg shadow-brand-100/20 dark:shadow-none transition-all hover:scale-[1.01] cursor-pointer group"
                        onClick={() => setSelectedBooking(booking)}
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <img 
                                    src={booking.guestAvatar || 'https://via.placeholder.com/100'} 
                                    alt={booking.guestName} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                                  />
                                  <div>
                                      <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{booking.guestName || 'Guest'}</h3>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{booking.guestCount} Guests • {booking.propertyName}</p>
                                  </div>
                              </div>
                              <button 
                                onClick={(e) => handleMessageGuest(booking, e)}
                                className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 hover:text-brand-600 transition-colors"
                                title="Message Guest"
                              >
                                  <MessageSquare className="w-4 h-4" />
                              </button>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 dark:border-white/5">
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Dates</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{booking.startDate} <span className="text-gray-400">→</span> {booking.endDate}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <span className="font-bold text-gray-600 dark:text-gray-300">Payout</span>
                                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">₹{booking.totalPrice?.toLocaleString()}</span>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button 
                                onClick={(e) => handleRequestAction(booking, 'cancelled', e)}
                                disabled={processingId === booking.id}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                              >
                                  <X className="w-4 h-4" /> Decline
                              </button>
                              <button 
                                onClick={(e) => handleRequestAction(booking, 'confirmed', e)}
                                disabled={processingId === booking.id}
                                className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold hover:bg-black dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
                              >
                                  {processingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Approve
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={<IndianRupee className="w-5 h-5 text-white" />} 
          title="Monthly Revenue" 
          value={`₹${stats.revenue.toLocaleString()}`} 
          trend="This Month" 
          bgGradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-white" />} 
          title="Avg. Occupancy" 
          value={`${stats.occupancy}%`} 
          trend="Portfolio" 
          bgGradient="bg-gradient-to-br from-brand-500 to-brand-600"
          shadowColor="shadow-brand-500/20"
        />
        <StatCard 
          icon={<Users className="w-5 h-5 text-white" />} 
          title="Active Guests" 
          value={stats.activeGuests} 
          trend="Now" 
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          shadowColor="shadow-blue-500/20"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5 text-white" />} 
          title="Upcoming" 
          value={stats.upcomingCheckins} 
          trend="Check-ins" 
          bgGradient="bg-gradient-to-br from-gold-500 to-gold-600"
          shadowColor="shadow-gold-500/20"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass-card rounded-3xl p-6 md:p-8 min-w-0 transition-colors duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Analysis</h2>
                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Income distribution across properties</p>
            </div>
            <select className="bg-gray-50 dark:bg-gray-800 border-none text-xs font-semibold rounded-lg px-3 py-2 outline-none text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} interval={0} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#9ca3af'}} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(98, 125, 152, 0.1)', radius: 8 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)', backgroundColor: '#1f2937', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 8, 8]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#627D98" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#334E68" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No revenue data yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
            <div className="relative group overflow-hidden rounded-3xl min-h-[280px]">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-black opacity-100"></div>
              <div className="absolute top-0 right-0 p-32 bg-brand-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Sparkles className="w-5 h-5 text-brand-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white">AI Insights</h2>
                </div>
                
                <div className="space-y-4 flex-1">
                    {aiInsights.length > 0 ? aiInsights.map((insight, i) => (
                        <InsightItem 
                            key={i}
                            title={insight.title} 
                            desc={insight.desc}
                            trend={insight.trend}
                        />
                    )) : (
                        <p className="text-gray-400 text-sm italic">Analyzing your portfolio...</p>
                    )}
                </div>
                
                <button 
                    onClick={() => onNavigate('listings')}
                    className="mt-6 w-full py-3.5 bg-white text-gray-950 rounded-xl hover:bg-gray-100 text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                    Take Action <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-500" />
                        Activity Feed
                    </h3>
                    <button className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">View All</button>
                </div>
                <div className="space-y-6">
                    {activityFeed.length > 0 ? activityFeed.map((item, i) => (
                        <div key={item.id} className="flex gap-4 relative">
                            {i !== activityFeed.length - 1 && (
                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-white/5"></div>
                            )}
                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border border-white/10 ${item.color} shadow-sm z-10`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                                    <span className="text-[10px] font-medium text-gray-400">{item.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-400 text-sm italic text-center py-4">No recent activity.</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* UNIVERSAL BOOKING DETAILS MODAL */}
      {selectedBooking && (
          <BookingDetailsModal 
              booking={selectedBooking}
              userRole={UserRole.HOST}
              onClose={() => setSelectedBooking(null)}
              onUpdate={loadData}
          />
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, bgGradient, shadowColor }: any) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all group backdrop-blur-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${bgGradient} shadow-lg ${shadowColor} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
        {trend}
      </span>
    </div>
    <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{title}</div>
  </div>
);

const InsightItem = ({ title, desc, trend }: any) => (
    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-1.5">
                <h4 className="font-semibold text-sm text-white group-hover:text-brand-200 transition-colors">{title}</h4>
                <ArrowUpRight className={`w-4 h-4 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`} />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
);
