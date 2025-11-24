import React, { useState } from 'react';
import { Property, PropertyType, MealPlan } from '../types';
import { generateDescription, suggestPricing } from '../services/aiService';
import { 
  Wand2, Save, Plus, Trash2, IndianRupee, MapPin, 
  Home, Users, Clock, Camera, ChevronRight, ChevronLeft, Check,
  Utensils, BedDouble, Bath, Car, Dog, Wifi, UserCheck, Droplets
} from 'lucide-react';
import { AMENITIES_LIST } from '../constants';

interface PropertyEditorProps {
  initialData?: Property;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: 'Basics & Location', icon: <MapPin className="w-4 h-4"/> },
  { id: 2, label: 'Space & Structure', icon: <Home className="w-4 h-4"/> },
  { id: 3, label: 'Logistics & Staff', icon: <Clock className="w-4 h-4"/> },
  { id: 4, label: 'Guests & Pricing', icon: <IndianRupee className="w-4 h-4"/> },
  { id: 5, label: 'Photos & Content', icon: <Camera className="w-4 h-4"/> },
];

// --- Reusable UI Components for Consistency ---

const FormLabel = ({ children, required }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-gray-400 text-gray-900 text-sm shadow-sm"
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props}
    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-gray-400 text-gray-900 text-sm shadow-sm min-h-[100px]"
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select 
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-gray-900 text-sm shadow-sm appearance-none cursor-pointer"
    />
    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
    {Icon && <Icon className="w-5 h-5 text-brand-600" />}
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const ToggleCard = ({ checked, onChange, title, icon: Icon }: { checked: boolean, onChange: (v: boolean) => void, title: string, icon: React.ElementType }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all ${
      checked ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${checked ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`font-medium ${checked ? 'text-brand-900' : 'text-gray-700'}`}>{title}</span>
    </div>
    <div className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${checked ? 'left-5' : 'left-1'}`} />
    </div>
  </div>
);

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Property>>(initialData || {
    title: '',
    type: PropertyType.VILLA,
    status: 'draft',
    address: '', location: '', city: '', state: '', country: 'India', pincode: '',
    gpsLocation: { lat: 19.076, lng: 72.877 },
    bedrooms: 3, bathrooms: 3, poolType: 'NA', parking: true, petFriendly: false,
    kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: false,
    checkInTime: '13:00', checkOutTime: '11:00',
    caretakerAvailable: false,
    baseGuests: 6, maxGuests: 10,
    currency: 'INR', baseWeekdayPrice: 12000, baseWeekendPrice: 15000, extraGuestPrice: 1000,
    amenities: [], mealPlans: [], addOns: [], images: [], pricingRules: []
  });

  const handleChange = (field: keyof Property, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (name: string) => {
      const current = formData.amenities || [];
      if (current.includes(name)) {
          handleChange('amenities', current.filter(a => a !== name));
      } else {
          handleChange('amenities', [...current, name]);
      }
  };

  const handleAiDescription = async () => {
      if (!formData.city || !formData.type) {
          alert("Please fill in basic details first.");
          return;
      }
      setIsGenerating(true);
      const prompt = `A ${formData.type} in ${formData.city}, ${formData.state}. ${formData.bedrooms} BHK. Features: ${formData.amenities?.join(', ')}.`;
      const desc = await generateDescription(prompt);
      handleChange('description', desc);
      setIsGenerating(false);
  };

  const handleAiPricing = async () => {
      if (!formData.city || !formData.type) return;
      setIsGenerating(true);
      const result = await suggestPricing(formData.city, formData.type);
      try {
          const json = JSON.parse(result);
          if (json.baseWeekdayPrice) {
              setFormData(prev => ({
                  ...prev,
                  baseWeekdayPrice: json.baseWeekdayPrice,
                  baseWeekendPrice: json.baseWeekendPrice || (json.baseWeekdayPrice * 1.4),
                  pricingRules: json.rules || []
              }));
          }
      } catch (e) {
          console.error("Pricing parse error", e);
      }
      setIsGenerating(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch(currentStep) {
        case 1: 
            return (
                <div className="animate-fadeIn space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                             <FormLabel required>Property Name</FormLabel>
                             <Input 
                                placeholder="e.g. Sunset Villa Lonavala" 
                                value={formData.title} 
                                onChange={e => handleChange('title', e.target.value)} 
                             />
                        </div>
                        <div>
                             <FormLabel required>Property Type</FormLabel>
                             <Select value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                             </Select>
                        </div>
                        <div>
                             <FormLabel required>Pin Code</FormLabel>
                             <Input placeholder="410401" value={formData.pincode} onChange={e => handleChange('pincode', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                             <FormLabel required>Address Line 1</FormLabel>
                             <Input placeholder="Plot No, Street Name" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
                        </div>
                        <div>
                             <FormLabel required>City</FormLabel>
                             <Input placeholder="e.g. Lonavala" value={formData.city} onChange={e => handleChange('city', e.target.value)} />
                        </div>
                        <div>
                             <FormLabel required>State</FormLabel>
                             <Input placeholder="e.g. Maharashtra" value={formData.state} onChange={e => handleChange('state', e.target.value)} />
                        </div>
                        <div>
                             <FormLabel>Location (Area)</FormLabel>
                             <Input placeholder="e.g. Tungarli" value={formData.location} onChange={e => handleChange('location', e.target.value)} />
                        </div>
                        <div>
                             <FormLabel>Country</FormLabel>
                             <Input value={formData.country} readOnly className="bg-gray-50 text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 overflow-hidden relative h-56 group">
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/73.4,18.75,13,0/800x400?access_token=pk.xxx')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                             <MapPin className="w-10 h-10 text-red-500 mb-2 drop-shadow-md animate-bounce" />
                             <span className="font-semibold bg-white/80 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Drag pin to set precise location</span>
                        </div>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="animate-fadeIn space-y-8">
                    <SectionHeader title="Structure & Layout" icon={Home} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <FormLabel>Bedrooms</FormLabel>
                            <div className="relative">
                                <Input type="number" min="0" value={formData.bedrooms} onChange={e => handleChange('bedrooms', parseInt(e.target.value))} />
                                <BedDouble className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <FormLabel>Bathrooms</FormLabel>
                            <div className="relative">
                                <Input type="number" min="0" value={formData.bathrooms} onChange={e => handleChange('bathrooms', parseInt(e.target.value))} />
                                <Bath className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="col-span-2">
                             <FormLabel>Swimming Pool</FormLabel>
                             <div className="flex gap-4">
                                 <Select value={formData.poolType} onChange={e => handleChange('poolType', e.target.value)}>
                                    <option value="NA">No Pool</option>
                                    <option value="Private">Private Pool</option>
                                    <option value="Shared">Shared Pool</option>
                                 </Select>
                                 {formData.poolType !== 'NA' && (
                                     <Input placeholder="Size (e.g. 20x10 ft)" value={formData.poolSize || ''} onChange={e => handleChange('poolSize', e.target.value)} />
                                 )}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleCard 
                            checked={formData.parking || false} 
                            onChange={(v) => handleChange('parking', v)} 
                            title="Parking Available" 
                            icon={Car} 
                        />
                        <ToggleCard 
                            checked={formData.petFriendly || false} 
                            onChange={(v) => handleChange('petFriendly', v)} 
                            title="Pet Friendly" 
                            icon={Dog} 
                        />
                    </div>

                    <div>
                        <SectionHeader title="Amenities" icon={Check} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {AMENITIES_LIST.map(am => (
                                <button 
                                    key={am.id}
                                    onClick={() => toggleAmenity(am.name)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-24 gap-2 ${
                                        formData.amenities?.includes(am.name) 
                                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium shadow-sm ring-1 ring-brand-500' 
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Icon placeholder logic */}
                                    {am.id === 'wifi' && <Wifi className="w-6 h-6" />}
                                    {am.id === 'pool' && <Droplets className="w-6 h-6" />}
                                    {/* Fallback */}
                                    {['wifi', 'pool'].indexOf(am.id) === -1 && <Check className="w-6 h-6" />}
                                    <span className="text-sm">{am.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="animate-fadeIn space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <SectionHeader title="Staff & Caretaker" icon={UserCheck} />
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <ToggleCard 
                                    checked={formData.caretakerAvailable || false} 
                                    onChange={(v) => handleChange('caretakerAvailable', v)} 
                                    title="Caretaker On-site" 
                                    icon={UserCheck} 
                                />
                                {formData.caretakerAvailable && (
                                    <div className="grid grid-cols-1 gap-4 pt-4 animate-fadeIn">
                                        <div>
                                            <FormLabel>Caretaker Name</FormLabel>
                                            <Input value={formData.caretakerName || ''} onChange={e => handleChange('caretakerName', e.target.value)} placeholder="e.g. Ramesh Bhau" />
                                        </div>
                                        <div>
                                            <FormLabel>Contact Number</FormLabel>
                                            <Input value={formData.caretakerNumber || ''} onChange={e => handleChange('caretakerNumber', e.target.value)} placeholder="+91 98765 43210" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <SectionHeader title="Timings & Access" icon={Clock} />
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FormLabel>Check-in</FormLabel>
                                        <Input type="time" value={formData.checkInTime} onChange={e => handleChange('checkInTime', e.target.value)} />
                                    </div>
                                    <div>
                                        <FormLabel>Check-out</FormLabel>
                                        <Input type="time" value={formData.checkOutTime} onChange={e => handleChange('checkOutTime', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <FormLabel>WiFi Password</FormLabel>
                                    <Input value={formData.wifiPassword || ''} onChange={e => handleChange('wifiPassword', e.target.value)} placeholder="Optional" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <SectionHeader title="Kitchen & Food Policies" icon={Utensils} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ToggleCard checked={formData.kitchenAvailable || false} onChange={v => handleChange('kitchenAvailable', v)} title="Kitchen Access" icon={Utensils} />
                            <ToggleCard checked={formData.nonVegAllowed || false} onChange={v => handleChange('nonVegAllowed', v)} title="Non-Veg Allowed" icon={Utensils} />
                            <ToggleCard checked={formData.mealsAvailable || false} onChange={v => handleChange('mealsAvailable', v)} title="Meals Provided" icon={Utensils} />
                        </div>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="animate-fadeIn space-y-8">
                    {/* AI Pricing Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 flex justify-between items-center shadow-sm">
                        <div>
                            <h4 className="font-bold text-blue-900 text-lg">Smart Pricing Assistant</h4>
                            <p className="text-sm text-blue-700 mt-1">Get data-driven price suggestions based on market trends in {formData.city || 'your area'}.</p>
                        </div>
                        <button 
                            onClick={handleAiPricing} 
                            disabled={isGenerating}
                            className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md border border-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div> : <Wand2 className="w-4 h-4" />}
                            Suggest Pricing
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Guest Configuration */}
                        <div className="space-y-6">
                            <SectionHeader title="Guest Capacity" icon={Users} />
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="font-semibold text-gray-900">Base Guests</div>
                                        <div className="text-xs text-gray-500">Included in base price</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleChange('baseGuests', Math.max(1, (formData.baseGuests||0)-1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold">-</button>
                                        <span className="font-mono font-medium text-lg w-6 text-center">{formData.baseGuests}</span>
                                        <button onClick={() => handleChange('baseGuests', (formData.baseGuests||0)+1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold">+</button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-gray-900">Max Guests</div>
                                        <div className="text-xs text-gray-500">Maximum capacity</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleChange('maxGuests', Math.max(1, (formData.maxGuests||0)-1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold">-</button>
                                        <span className="font-mono font-medium text-lg w-6 text-center">{formData.maxGuests}</span>
                                        <button onClick={() => handleChange('maxGuests', (formData.maxGuests||0)+1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 font-bold">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Configuration */}
                        <div className="space-y-6">
                            <SectionHeader title="Base Pricing" icon={IndianRupee} />
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <div>
                                    <FormLabel>Weekday Price (Mon-Thu)</FormLabel>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <Input type="number" className="pl-8" value={formData.baseWeekdayPrice} onChange={e => handleChange('baseWeekdayPrice', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <div>
                                    <FormLabel>Weekend Price (Fri-Sun)</FormLabel>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <Input type="number" className="pl-8" value={formData.baseWeekendPrice} onChange={e => handleChange('baseWeekendPrice', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <div>
                                    <FormLabel>Extra Guest Fee</FormLabel>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <Input type="number" className="pl-8" value={formData.extraGuestPrice} onChange={e => handleChange('extraGuestPrice', parseInt(e.target.value))} />
                                        <span className="absolute right-3 top-2.5 text-gray-400 text-xs mt-0.5">/ guest / night</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        
        case 5: 
             return (
                <div className="animate-fadeIn space-y-8">
                     <SectionHeader title="Property Visuals" icon={Camera} />
                     <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 h-48 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                            <Camera className="w-8 h-8 text-brand-500" />
                        </div>
                        <span className="font-medium text-gray-700">Click to upload photos</span>
                        <span className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</span>
                     </div>
                     
                     {/* Preview Placeholder */}
                     <div className="flex gap-4 overflow-x-auto pb-2">
                        {formData.images?.map((img, i) => (
                            <div key={i} className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={img} className="w-full h-full object-cover" alt="Preview"/>
                                <button className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                         {/* Mock Previews if empty */}
                         {!formData.images?.length && (
                             [1,2,3].map(i => (
                                 <div key={i} className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                                     <Camera className="w-6 h-6" />
                                 </div>
                             ))
                         )}
                     </div>

                     <div className="pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Description</h3>
                            <button 
                                onClick={handleAiDescription} 
                                disabled={isGenerating} 
                                className="text-sm font-medium text-brand-600 flex items-center gap-1.5 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Wand2 className="w-4 h-4" /> 
                                {isGenerating ? 'Writing...' : 'Auto-Generate'}
                            </button>
                        </div>
                        <TextArea 
                            placeholder="Describe the vibe, view, and unique features of your place..."
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            rows={6}
                        />
                     </div>
                </div>
             );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
        <div>
            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Property' : 'List New Property'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {currentStep} of {STEPS.length}: {STEPS[currentStep-1].label}</p>
        </div>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <Trash2 className="w-5 h-5"/>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar Stepper (Desktop) */}
          <div className="hidden md:block w-64 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
              <div className="space-y-1">
                {STEPS.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            currentStep === step.id 
                            ? 'bg-white text-brand-600 shadow-sm border border-gray-200' 
                            : currentStep > step.id 
                                ? 'text-gray-600 hover:bg-gray-100' 
                                : 'text-gray-400'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            currentStep === step.id ? 'bg-brand-100 text-brand-700' : 
                            currentStep > step.id ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                        </div>
                        {step.label}
                    </button>
                ))}
              </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10 relative">
             <div className="max-w-3xl mx-auto pb-20">
                {renderStep()}
             </div>
          </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-between items-center z-10 relative">
         <button 
            onClick={prevStep} 
            disabled={currentStep === 1}
            className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent font-semibold flex items-center gap-2 transition-colors"
         >
            <ChevronLeft className="w-5 h-5" /> Back
         </button>

         {currentStep < STEPS.length ? (
             <button 
                onClick={nextStep}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold flex items-center gap-2 transition-all shadow-lg shadow-gray-200 active:scale-95"
             >
                Next <ChevronRight className="w-5 h-5" />
             </button>
         ) : (
             <button 
                onClick={() => onSave(formData as Property)}
                className="px-8 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold flex items-center gap-2 shadow-lg shadow-brand-200 transition-all active:scale-95"
             >
                <Save className="w-5 h-5" /> Publish Listing
             </button>
         )}
      </div>
    </div>
  );
};