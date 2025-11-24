import React from 'react';
import { Property } from '../types';
import { BarChart, Activity, IndianRupee, Users, Calendar, ArrowUpRight } from 'lucide-react';
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
  const activeListings = properties.filter(p => p.status === 'active').length;

  const chartData = properties.map(p => ({
    name: p.title.substring(0, 15) + '...',
    revenue: p.revenueLastMonth,
    occupancy: p.occupancyRate
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-1">Real-time insights for your hospitality business.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<IndianRupee className="w-6 h-6 text-emerald-600" />} 
          title="Monthly Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          trend="+12%" 
          color="bg-emerald-50"
        />
        <StatCard 
          icon={<Activity className="w-6 h-6 text-brand-600" />} 
          title="Avg. Occupancy" 
          value={`${avgOccupancy}%`} 
          trend="+5%" 
          color="bg-brand-50"
        />
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-600" />} 
          title="Active Guests" 
          value="48" 
          trend="Now" 
          color="bg-blue-50"
        />
        <StatCard 
          icon={<Calendar className="w-6 h-6 text-purple-600" />} 
          title="Upcoming" 
          value="12" 
          trend="Check-ins" 
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
                 <h2 className="text-xl font-bold text-gray-900">Revenue Performance</h2>
                 <p className="text-sm text-gray-400">Income per property for the last 30 days</p>
            </div>
            <button className="text-sm bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">Full Report</button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: 600 }}
                  labelStyle={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ea580c' : '#fdba74'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / AI Suggestions */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-xl text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-yellow-400" />
              AI Insights
            </h2>
            <div className="space-y-4 flex-1">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                         <h4 className="font-semibold text-sm">Diwali Peak Ahead</h4>
                         <ArrowUpRight className="w-4 h-4 text-green-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">Search volume up 40%. Raising rates by 15% recommended for Nov 10-15.</p>
                </div>
                
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                         <h4 className="font-semibold text-sm">Review Alert</h4>
                         <ArrowUpRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">Guest "Rahul" mentioned WiFi issues. Check router status?</p>
                </div>
            </div>
            
            <button 
                onClick={() => onNavigate('listings')}
                className="mt-6 w-full py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 text-sm font-bold transition-all shadow-lg active:scale-95"
            >
                View All Actions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} transition-colors group-hover:scale-110 duration-200`}>{icon}</div>
      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">{trend}</span>
    </div>
    <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
    <div className="text-sm text-gray-500 font-medium mt-1">{title}</div>
  </div>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z" />
  </svg>
);