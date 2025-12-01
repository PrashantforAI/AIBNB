
import React from 'react';
import { Property } from '../types';
import { MapPin, Edit, Eye, Plus, BedDouble, Users, Star } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onAddNew: () => void;
  onPreview: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, onEdit, onAddNew, onPreview }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Manage {properties.length} listings across your portfolio.</p>
        </div>
        <button 
            onClick={onAddNew}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-brand-200 dark:shadow-none transition-transform active:scale-95"
        >
            <Plus className="w-5 h-5" /> List New Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map(property => (
          <div key={property.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl dark:hover:shadow-gray-900/50 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
            <div className="h-56 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                {property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                    property.status === 'active' ? 'bg-green-500/90 text-white' : 'bg-gray-800/80 text-white'
                }`}>
                    {property.status}
                </div>
                <div className="absolute bottom-4 left-4 flex gap-1">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-white shadow-sm">
                        <Star className="w-3 h-3 text-orange-400 fill-orange-400" /> 4.8
                    </div>
                </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 mb-1">{property.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {property.location || property.city}, {property.city}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                        <BedDouble className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.bedrooms} Bed</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                        <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.maxGuests} Guest</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Weekday</div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">₹{property.baseWeekdayPrice}</span>
                    </div>
                </div>

                <div className="mt-auto flex gap-3">
                    <button 
                        onClick={() => onEdit(property)}
                        className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit className="w-4 h-4" /> Manage
                    </button>
                    <button 
                        onClick={() => onPreview(property)}
                        className="px-3 py-2.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl border border-transparent hover:border-brand-100 dark:hover:border-brand-900 transition-colors"
                        title="Preview as Guest"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        ))}
        
        {/* Add New Card Placeholder */}
        <button 
            onClick={onAddNew}
            className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/10 hover:text-brand-600 dark:hover:text-brand-400 transition-all group min-h-[300px]"
        >
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 flex items-center justify-center mb-4 transition-colors shadow-sm">
                <Plus className="w-8 h-8" />
            </div>
            <span className="font-semibold text-lg">Add New Property</span>
        </button>
      </div>
    </div>
  );
};
