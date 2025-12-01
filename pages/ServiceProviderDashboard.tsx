
import React, { useState } from 'react';
import { ServiceTask } from '../types';
import { CheckCircle2, Clock, MapPin, ChefHat, Sparkles, Wrench, User } from 'lucide-react';

interface ServiceProviderDashboardProps {
  tasks: ServiceTask[];
}

export const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({ tasks }) => {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const filteredTasks = tasks.filter(t => t.status === filter);

  const getIcon = (type: ServiceTask['type']) => {
      switch(type) {
          case 'cooking': return <ChefHat className="w-5 h-5 text-orange-500" />;
          case 'cleaning': return <Sparkles className="w-5 h-5 text-blue-500" />;
          case 'maintenance': return <Wrench className="w-5 h-5 text-gray-500" />;
          case 'meet_greet': return <User className="w-5 h-5 text-green-500" />;
      }
  };

  return (
    <div className="animate-fadeIn pb-20 max-w-4xl mx-auto">
       <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tasks</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your schedule and service requests.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button 
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
                Upcoming
            </button>
            <button 
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'completed' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
                Completed
            </button>
        </div>
       </header>

       <div className="space-y-4">
           {filteredTasks.length === 0 ? (
               <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                   <p className="text-gray-500 dark:text-gray-400">No {filter} tasks found.</p>
               </div>
           ) : (
               filteredTasks.map(task => (
                   <div key={task.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-6 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                       <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                               <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                   {getIcon(task.type)}
                               </div>
                               <span className="font-bold text-gray-900 dark:text-white capitalize">{task.type.replace('_', ' ')}</span>
                               <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                   {task.status}
                               </span>
                           </div>
                           <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{task.details}</h3>
                           <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                               <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {task.propertyName}</div>
                               <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {task.date} at {task.time}</div>
                           </div>
                       </div>
                       
                       <div className="flex items-center">
                           {task.status === 'pending' && (
                               <button className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                   <CheckCircle2 className="w-5 h-5" /> Mark Done
                               </button>
                           )}
                       </div>
                   </div>
               ))
           )}
       </div>
    </div>
  );
};
