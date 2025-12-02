import React from 'react';
import { Property } from '../types';
import { BarChart, Activity, IndianRupee, Users, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
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

interface HostDashboardProps {
  properties: Property[];
  onNavigate: (page: string) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ properties, onNavigate }) => {
  const totalRevenue = properties.reduce((sum, p) => sum + p.revenueLastMonth, 0);
  const avgOccupancy = Math.round(properties.reduce((sum, p) => sum + p.occupancyRate, 0) / (properties.length || 1));
  
  const chartData = properties.map(p => ({
    name: p.title.length > 12 ? p.title.substring(0, 10) + '...' : p.title,
    revenue: p.revenueLastMonth,
    occupancy: p.occupancyRate
  }));

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={<IndianRupee className="w-5 h-5 text-white" />} 
          title="Monthly Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          trend="+12%" 
          bgGradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-white" />} 
          title="Avg. Occupancy" 
          value={`${avgOccupancy}%`} 
          trend="+5%" 
          bgGradient="bg-gradient-to-br from-brand-500 to-brand-600"
          shadowColor="shadow-brand-500/20"
        />
        <StatCard 
          icon={<Users className="w-5 h-5 text-white" />} 
          title="Active Guests" 
          value="48" 
          trend="Now" 
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          shadowColor="shadow-blue-500/20"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5 text-white" />} 
          title="Upcoming" 
          value="12" 
          trend="Check-ins" 
          bgGradient="bg-gradient-to-br from-gold-500 to-gold-600"
          shadowColor="shadow-gold-500/20"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 glass-card rounded-3xl p-6 md:p-8 min-w-0 transition-colors duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Analysis</h2>
                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Income distribution across properties</p>
            </div>
            <select className="bg-gray-50 dark:bg-gray-800 border-none text-xs font-semibold rounded-lg px-3 py-2 outline-none text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <option>Last 30 Days</option>
                <option>This Quarter</option>
                <option>Year to Date</option>
            </select>
          </div>
          {/* Explicit height container to fix Recharts warning */}
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
                No data available
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="relative group overflow-hidden rounded-3xl">
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
                <InsightItem 
                    title="Diwali Demand Spike" 
                    desc="Search volume up 40%. Consider raising rates by 15% for Nov 10-15."
                    trend="up"
                />
                <InsightItem 
                    title="WiFi Issue Detected" 
                    desc="Sentiment analysis flagged 2 recent reviews mentioning slow internet."
                    trend="down"
                />
            </div>
            
            <button 
                onClick={() => onNavigate('listings')}
                className="mt-6 w-full py-3.5 bg-white text-gray-950 rounded-xl hover:bg-gray-100 text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
                Take Action <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
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