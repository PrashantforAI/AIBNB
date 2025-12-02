
import React from 'react';
import { Property } from '../types';
import { MapPin, Edit, Eye, Plus, BedDouble, Users, Star, MoreHorizontal } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onAddNew: () => void;
  onPreview: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, onEdit, onAddNew, onPreview }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Properties</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Manage {properties.length} listings across your portfolio.</p>
        </div>
        <button 
            onClick={onAddNew}
            className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-transform active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none"
        >
            <Plus className="w-5 h-5" /> List Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map(property => (
          <div key={property.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
            <div className="h-60 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                {property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/10 ${
                        property.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-gray-800/80 text-white'
                    }`}>
                        {property.status}
                    </div>
                </div>
                <button className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">{property.title}</h3>
                        <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                            <Star className="w-3 h-3 fill-current text-gold-500" /> 
                            <span className="text-gray-900 dark:text-white">4.8</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {property.location || property.city}, {property.state}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                        <BedDouble className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{property.bedrooms} Bed</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                        <Users className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{property.maxGuests} Guest</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center flex flex-col justify-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">₹{property.baseWeekdayPrice?.toLocaleString() || '0'}</span>
                        <span className="text-[10px] text-gray-400">/night</span>
                    </div>
                </div>

                <div className="mt-auto flex gap-3">
                    <button 
                        onClick={() => onEdit(property)}
                        className="flex-1 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit className="w-4 h-4" /> Manage
                    </button>
                    <button 
                        onClick={() => onPreview(property)}
                        className="px-4 py-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                        title="Preview"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        ))}
        
        {/* Add New Card */}
        <button 
            onClick={onAddNew}
            className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-all group min-h-[400px]"
        >
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 flex items-center justify-center mb-6 transition-colors shadow-sm">
                <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold text-lg">Add New Property</span>
        </button>
      </div>
    </div>
  );
};
