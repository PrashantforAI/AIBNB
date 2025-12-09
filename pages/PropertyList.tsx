

import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { MapPin, Edit, Eye, Plus, BedDouble, Users, Star, MoreHorizontal, Trash2, EyeOff, Archive, CheckCircle, Wrench, RefreshCw, AlertTriangle } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onAddNew: () => void;
  onPreview: (property: Property) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: any) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, onEdit, onAddNew, onPreview, onDelete, onStatusChange }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'draft' | 'maintenance' | 'archived'>('active');

  // Close menu on outside click
  useEffect(() => {
      const handleClickOutside = () => setActiveMenuId(null);
      if (activeMenuId) document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  const filteredProperties = properties.filter(p => {
      if (filter === 'active') return p.status === 'active';
      if (filter === 'draft') return p.status === 'draft';
      if (filter === 'maintenance') return p.status === 'maintenance';
      if (filter === 'archived') return p.status === 'archived';
      return true;
  });

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

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-100 dark:border-gray-800">
          {[
              { id: 'active', label: 'Published', count: properties.filter(p => p.status === 'active').length },
              { id: 'draft', label: 'Drafts', count: properties.filter(p => p.status === 'draft').length },
              { id: 'maintenance', label: 'Maintenance', count: properties.filter(p => p.status === 'maintenance').length },
              { id: 'archived', label: 'Archived', count: properties.filter(p => p.status === 'archived').length }
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                    filter === tab.id 
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${filter === tab.id ? 'bg-white dark:bg-black text-black dark:text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {tab.count}
                  </span>
              </button>
          ))}
      </div>

      {filter === 'archived' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex gap-3 text-sm text-gray-600 dark:text-gray-400 items-center">
              <Archive className="w-4 h-4" />
              <p>Archived properties are hidden from guests but can be recovered. They are permanently deleted after 6 months.</p>
          </div>
      )}

      {filteredProperties.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
              <p className="text-gray-400 font-medium">No {filter} properties found.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(property => (
            <div key={property.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative">
                
                {/* Context Menu Dropdown */}
                {activeMenuId === property.id && (
                    <div className="absolute top-14 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 w-56 overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="p-1.5 space-y-1">
                            <button onClick={() => onEdit(property)} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                <Edit className="w-4 h-4 text-gray-400" /> Edit Details
                            </button>
                            {property.status !== 'archived' && (
                                <button onClick={() => onPreview(property)} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                    <Eye className="w-4 h-4 text-gray-400" /> Preview
                                </button>
                            )}
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        
                        {/* Status Actions */}
                        <div className="p-1.5 space-y-1">
                            {property.status === 'active' && (
                                <>
                                    <button onClick={() => onStatusChange(property.id, 'draft')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                        <EyeOff className="w-4 h-4 text-gray-400" /> Unlist (Draft)
                                    </button>
                                    <button onClick={() => onStatusChange(property.id, 'maintenance')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                        <Wrench className="w-4 h-4 text-gray-400" /> Maintenance
                                    </button>
                                    <button onClick={() => onStatusChange(property.id, 'archived')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                        <Archive className="w-4 h-4 text-gray-400" /> Archive
                                    </button>
                                </>
                            )}
                            
                            {(property.status === 'draft' || property.status === 'maintenance') && (
                                <>
                                    <button onClick={() => onStatusChange(property.id, 'active')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Publish
                                    </button>
                                    <button onClick={() => onStatusChange(property.id, 'archived')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors">
                                        <Archive className="w-4 h-4 text-gray-400" /> Archive
                                    </button>
                                </>
                            )}

                            {property.status === 'archived' && (
                                <button onClick={() => onStatusChange(property.id, 'draft')} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-blue-600 dark:text-blue-400 transition-colors">
                                    <RefreshCw className="w-4 h-4" /> Recover to Drafts
                                </button>
                            )}
                        </div>
                        
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <div className="p-1.5">
                            <button onClick={() => onDelete(property.id)} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" /> Delete Permanently
                            </button>
                        </div>
                    </div>
                )}

                <div className="h-60 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                    {property.images[0] ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/10 ${
                            property.status === 'active' ? 'bg-emerald-500/90 text-white' : 
                            property.status === 'maintenance' ? 'bg-amber-500/90 text-white' :
                            property.status === 'archived' ? 'bg-gray-600/90 text-white' :
                            'bg-gray-800/80 text-white'
                        }`}>
                            {property.status}
                        </div>
                    </div>
                    
                    {/* 3 DOTS MENU TRIGGER */}
                    <button 
                        onClick={(e) => toggleMenu(e, property.id)}
                        className={`absolute top-4 right-4 p-2 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors ${activeMenuId === property.id ? 'bg-black/40' : 'bg-black/20'}`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
                
                <div className={`p-6 flex-1 flex flex-col ${property.status === 'archived' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">{property.title}</h3>
                            {property.status === 'active' && (
                                <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                                    <Star className="w-3 h-3 fill-current text-gold-500" /> 
                                    <span className="text-gray-900 dark:text-white">4.8</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {property.location || property.city}, {property.state}
                        </div>
                    </div>

                    {property.status === 'maintenance' && property.maintenanceStartedAt && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5" />
                            Started: {new Date(property.maintenanceStartedAt).toLocaleDateString()}
                        </div>
                    )}
                    
                    {property.status !== 'archived' ? (
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
                    ) : (
                        <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-2 text-sm text-gray-500">
                             <Archive className="w-4 h-4" />
                             Archived on {property.archivedAt ? new Date(property.archivedAt).toLocaleDateString() : 'Recently'}
                        </div>
                    )}

                    <div className="mt-auto flex gap-3">
                        <button 
                            onClick={() => onEdit(property)}
                            className="flex-1 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit className="w-4 h-4" /> Manage
                        </button>
                        {property.status !== 'archived' && (
                            <button 
                                onClick={() => onPreview(property)}
                                className="px-4 py-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                title="Preview"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            ))}
            
            {/* Add New Card - Only show on active tab or make it always visible if that's preferred, usually active/draft */}
            {(filter === 'active' || filter === 'draft') && (
                <button 
                    onClick={onAddNew}
                    className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-all group min-h-[400px]"
                >
                    <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 flex items-center justify-center mb-6 transition-colors shadow-sm">
                        <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-lg">Add New Property</span>
                </button>
            )}
        </div>
      )}
    </div>
  );
};