import React, { useState, useEffect, useMemo } from 'react';
import { Property, Booking, UserRole } from '../types';
import { BarChart, Activity, IndianRupee, Users, Calendar, ArrowUpRight, Sparkles, CheckCircle2, Star, Wrench, Clock, Check, X, Loader2, MessageSquare, AlertTriangle, Filter, ChevronDown, ArrowDownRight, TrendingUp } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { fetchPendingBookings, updateBookingStatus, fetchHostBookings } from '../services/bookingService';
import { startConversation } from '../services/chatService';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { generateHostInsights } from '../services/aiService';

interface HostDashboardProps {
  properties: Property[];
  onNavigate: (page: string) => void;
  onRefresh?: () => void;
}

type FilterMode = 'all' | 'active' | 'maintenance' | 'custom';

export const HostDashboard: React.FC<HostDashboardProps> = ({ properties, onNavigate, onRefresh }) => {
  // Data State
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  
  // Filter State
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [customSelection, setCustomSelection] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // --- 1. LOAD DATA ---
  const loadData = async () => {
      setLoadingRequests(true);
      try {
          const bookings = await fetchHostBookings('host1');
          setAllBookings(bookings);
          setPendingBookings(bookings.filter(b => b.status === 'pending'));
          
          // Generate insights based on all data initially
          const insights = await generateHostInsights(properties, bookings.filter(b => b.status === 'confirmed'));
          setAiInsights(insights);
      } catch (e) {
          console.error("Dashboard load failed", e);
      } finally {
          setLoadingRequests(false);
      }
  };

  useEffect(() => { loadData(); }, [properties]);

  // --- 2. FILTER LOGIC ---
  const filteredProperties = useMemo(() => {
      return properties.filter(p => {
          if (p.status === 'archived') return false; // Never show archived in main dash
          
          if (filterMode === 'all') return true;
          if (filterMode === 'active') return p.status === 'active';
          if (filterMode === 'maintenance') return p.status === 'maintenance';
          if (filterMode === 'custom') return customSelection.has(p.id);
          return true;
      });
  }, [properties, filterMode, customSelection]);

  // --- 3. CALCULATE METRICS (Real-time based on Filter) ---
  const metrics = useMemo(() => {
      const propertyIds = new Set(filteredProperties.map(p => p.id));
      const relevantBookings = allBookings.filter(b => propertyIds.has(b.propertyId) && b.status === 'confirmed');

      const now = new Date();
      const currentMonth = now.getMonth();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const todayStr = now.toISOString().split('T')[0];

      // Revenue
      const currentMonthRevenue = relevantBookings
          .filter(b => new Date(b.startDate).getMonth() === currentMonth)
          .reduce((sum, b) => sum + b.totalPrice, 0);
      
      const prevMonthRevenue = relevantBookings
          .filter(b => new Date(b.startDate).getMonth() === prevMonth)
          .reduce((sum, b) => sum + b.totalPrice, 0);

      const revenueGrowth = prevMonthRevenue > 0 
          ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
          : 0;

      // Active Guests
      const activeGuestCount = relevantBookings
          .filter(b => b.startDate <= todayStr && b.endDate > todayStr)
          .reduce((sum, b) => sum + b.guestCount, 0);

      // Upcoming
      const upcomingCount = relevantBookings
          .filter(b => b.startDate > todayStr)
          .length;

      // Occupancy (Average of filtered properties)
      const avgOccupancy = filteredProperties.length > 0
          ? Math.round(filteredProperties.reduce((sum, p) => sum + (p.occupancyRate || 0), 0) / filteredProperties.length)
          : 0;

      return {
          revenue: currentMonthRevenue,
          revenueGrowth,
          activeGuests: activeGuestCount,
          upcoming: upcomingCount,
          occupancy: avgOccupancy
      };
  }, [filteredProperties, allBookings]);

  // --- 4. PREPARE CHART DATA ---
  const chartData = useMemo(() => {
      return filteredProperties.map(p => {
          const propRevenue = allBookings
              .filter(b => b.propertyId === p.id && b.status === 'confirmed' && new Date(b.startDate).getMonth() === new Date().getMonth())
              .reduce((sum, b) => sum + b.totalPrice, 0);
          return {
              name: p.title.length > 12 ? p.title.substring(0, 10) + '...' : p.title,
              revenue: propRevenue,
              fullTitle: p.title
          };
      });
  }, [filteredProperties, allBookings]);

  // --- HANDLERS ---
  const handleRequestAction = async (booking: Booking, status: 'confirmed' | 'cancelled', e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          await updateBookingStatus(booking.id, status, booking.propertyId, booking.startDate, booking.endDate);
          loadData();
          if (onRefresh) onRefresh(); 
          setSelectedBooking(null);
      } catch (e) {
          alert("Failed to update status");
      }
  };

  const togglePropertySelection = (id: string) => {
      const newSet = new Set(customSelection);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setCustomSelection(newSet);
  };

  // Maintenance Alerts (Global Check against ALL properties, ignoring current filter)
  const maintenanceAlerts = useMemo(() => {
    return properties.filter(p => {
      if (p.status !== 'maintenance' || !p.maintenanceStartedAt) return false;
      const start = new Date(p.maintenanceStartedAt).getTime();
      const now = new Date().getTime();
      const diffDays = Math.floor((now - start) / (1000 * 3600 * 24));
      return diffDays > 60;
    });
  }, [properties]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      
      {/* ALERTS SECTION - PROMINENT LOCATION (ABOVE HEADER) */}
      {maintenanceAlerts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-4 animate-slideUp shadow-sm mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulseSlow" />
              </div>
              <div className="flex-1">
                  <h3 className="text-base font-bold text-red-800 dark:text-red-300">Action Required: Prolonged Maintenance</h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">The following properties have been in maintenance mode for over 60 days. This affects your portfolio availability.</p>
                  <ul className="mt-2 space-y-1">
                      {maintenanceAlerts.map(p => (
                          <li key={p.id} className="text-sm font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {p.title} 
                              <span className="opacity-75 font-normal text-xs bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                                  {Math.floor((new Date().getTime() - new Date(p.maintenanceStartedAt!).getTime()) / (1000 * 3600 * 24))} days
                              </span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {/* HEADER & FILTER */}
      <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Overview</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
               Analyzing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
           </p>
        </div>

        {/* Dynamic Filter Dropdown */}
        <div className="relative z-20">
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
                <Filter className="w-4 h-4" />
                <span>
                    {filterMode === 'all' ? 'All Properties' : 
                     filterMode === 'active' ? 'Active Listings' : 
                     filterMode === 'maintenance' ? 'In Maintenance' : 
                     `Custom (${customSelection.size})`}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute right-0 top-[110%] w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-30 animate-scaleIn origin-top-right">
                        <div className="space-y-1 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <button onClick={() => { setFilterMode('all'); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                All Properties
                            </button>
                            <button onClick={() => { setFilterMode('active'); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                Active Listings
                            </button>
                            <button onClick={() => { setFilterMode('maintenance'); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'maintenance' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                In Maintenance
                            </button>
                        </div>
                        
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Select Specific</div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                            {properties.filter(p => p.status !== 'archived').map(p => {
                                const isSelected = filterMode === 'custom' && customSelection.has(p.id);
                                return (
                                    <button 
                                        key={p.id}
                                        onClick={() => {
                                            setFilterMode('custom');
                                            togglePropertySelection(p.id);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 group"
                                    >
                                        <span className={`truncate ${isSelected ? 'font-bold text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{p.title}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
      </header>
    
      {/* Analytics Cards - DYNAMICALLY UPDATED */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Monthly Revenue" 
            value={`₹${metrics.revenue.toLocaleString()}`} 
            trend={metrics.revenueGrowth}
            icon={<IndianRupee className="w-4 h-4"/>} 
            color="brand"
        />
        <StatCard 
            title="Avg. Occupancy" 
            value={isNaN(metrics.occupancy) ? '0%' : `${metrics.occupancy}%`} 
            subtitle="Portfolio Average"
            icon={<Activity className="w-4 h-4"/>} 
            color="emerald"
        />
        <StatCard 
            title="Active Guests" 
            value={metrics.activeGuests} 
            subtitle="Currently Staying"
            icon={<Users className="w-4 h-4"/>} 
            color="amber"
        />
        <StatCard 
            title="Upcoming" 
            value={metrics.upcoming} 
            subtitle="Next 30 days"
            icon={<Calendar className="w-4 h-4"/>} 
            color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* REVENUE CHART */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Analysis</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Breakdown by property for current month</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                <TrendingUp className="w-3.5 h-3.5" /> +12% vs last month
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#9ca3af'}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)'}}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40} fill="#627D98">
                      {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#627D98' : '#829AB1'} />
                      ))}
                  </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
            {/* Minimal AI Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4" /> Smart Insights
                </div>
                <div className="space-y-4">
                    {aiInsights.length > 0 ? aiInsights.slice(0, 3).map((insight, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${insight.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{insight.title}</div>
                                <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">{insight.desc}</div>
                            </div>
                        </div>
                    )) : <p className="text-xs text-gray-400">Analyzing portfolio data...</p>}
                </div>
                <button className="w-full mt-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    View All Insights
                </button>
            </div>

            {/* Pending Requests */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Requests ({pendingBookings.length})</h3>
                    {pendingBookings.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                </div>
                
                {pendingBookings.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">No pending requests</div>
                ) : (
                    <div className="space-y-3">
                        {pendingBookings.slice(0, 3).map(booking => (
                            <div 
                                key={booking.id} 
                                className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => setSelectedBooking(booking)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-[9px] text-white font-bold">
                                            {booking.guestName?.charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{booking.guestName}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium text-gray-500">
                                        ₹{booking.totalPrice.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{booking.propertyName}</div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => handleRequestAction(booking, 'cancelled', e)} className="p-1 hover:bg-red-100 text-red-500 rounded"><X className="w-3 h-3"/></button>
                                        <button onClick={(e) => handleRequestAction(booking, 'confirmed', e)} className="p-1 hover:bg-green-100 text-green-600 rounded"><Check className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {selectedBooking && (
          <BookingDetailsModal booking={selectedBooking} userRole={UserRole.HOST} onClose={() => setSelectedBooking(null)} onUpdate={loadData} />
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, trend, icon, color = 'brand' }: any) => {
    const colors: any = {
        brand: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/20',
        emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
        amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700 transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${colors[color]} transition-colors`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{title}</div>
                {subtitle && <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">{subtitle}</div>}
            </div>
        </div>
    );
};