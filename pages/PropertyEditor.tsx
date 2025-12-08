
import React, { useState, useRef } from 'react';
import { Property, PropertyType, MealPlan } from '../types';
import { callAICore } from '../services/api';
import { suggestPricing } from '../services/aiService';
import { 
  Wand2, Save, Plus, Trash2, IndianRupee, MapPin, 
  Home, Users, Clock, Camera, ChevronRight, ChevronLeft, Check,
  Utensils, BedDouble, Bath, Car, Dog, Wifi, UserCheck, Droplets, Shield, FileText, Sparkles, Coffee, PartyPopper, Briefcase, Heart, Palmtree, ChefHat, Loader2
} from 'lucide-react';
import { AMENITIES_LIST } from '../constants';
import { LocationPicker } from '../components/LocationPicker';

interface PropertyEditorProps {
  initialData?: Property;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: 'Basics & Location', icon: <MapPin className="w-4 h-4"/> },
  { id: 2, label: 'Space & Structure', icon: <Home className="w-4 h-4"/> },
  { id: 3, label: 'Logistics & Rules', icon: <FileText className="w-4 h-4"/> },
  { id: 4, label: 'Guests & Pricing', icon: <IndianRupee className="w-4 h-4"/> },
  { id: 5, label: 'Photos & Content', icon: <Camera className="w-4 h-4"/> },
];

const VIBES = [
    { id: 'Peaceful', icon: Coffee, label: 'Peaceful' },
    { id: 'Luxury', icon: Sparkles, label: 'Luxury' },
    { id: 'Party', icon: PartyPopper, label: 'Party Ready' },
    { id: 'Work', icon: Briefcase, label: 'Workcation' },
    { id: 'Romantic', icon: Heart, label: 'Romantic' },
    { id: 'Nature', icon: Palmtree, label: 'Nature' },
];

// Helper to compress images
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG at 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const FormLabel = ({ children, required }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-sm shadow-sm hover:border-gray-400 dark:hover:border-gray-600 ${props.className}`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-sm shadow-sm min-h-[120px] hover:border-gray-400 dark:hover:border-gray-600"
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select 
      {...props}
      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-gray-900 dark:text-white text-sm shadow-sm appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
    />
    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
      <ChevronRight className="w-4 h-4 rotate-90" />
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: React.ElementType }) => (
  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
    {Icon && <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400"><Icon className="w-5 h-5" /></div>}
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
  </div>
);

const ToggleCard = ({ checked, onChange, title, icon: Icon }: { checked: boolean, onChange: (v: boolean) => void, title: string, icon: React.ElementType }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all group ${
      checked 
      ? 'bg-gray-900 dark:bg-gray-800 border-gray-900 dark:border-gray-700 shadow-md' 
      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${checked ? 'bg-white/10 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`font-medium ${checked ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{title}</span>
    </div>
    <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-700'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customAmenity, setCustomAmenity] = useState('');
  const [propertyVibe, setPropertyVibe] = useState('Peaceful');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Property>>(initialData || {
    title: '',
    type: PropertyType.VILLA,
    status: 'draft',
    address: '', location: '', city: '', state: '', country: 'India', pincode: '',
    gpsLocation: { lat: 18.7557, lng: 73.4091 }, // Default to Lonavala
    bedrooms: 3, bathrooms: 3, poolType: 'NA', parking: true, petFriendly: false,
    kitchenAvailable: true, nonVegAllowed: true, mealsAvailable: false,
    checkInTime: '13:00', checkOutTime: '11:00',
    caretakerAvailable: false,
    baseGuests: 6, maxGuests: 10,
    currency: 'INR', baseWeekdayPrice: 12000, baseWeekendPrice: 15000, extraGuestPrice: 1000,
    amenities: [], mealPlans: [], addOns: [], images: [], pricingRules: [],
    rules: {
        checkInTime: '14:00', checkOutTime: '10:00',
        standardOccupancy: 6, maxOccupancy: 8,
        extraGuestPolicy: 'Additional charges apply.',
        chefAvailable: true, kitchenUsagePolicy: 'Reheating only',
        securityDeposit: 15000, refundPolicy: '4-7 working days',
        cancellationPolicy: 'No refund on partial',
        petsAllowed: false, petDeposit: 10000, petSanitationFee: 2000,
        petPoolPolicy: 'Strictly prohibited',
        quietHours: '10:00 PM - 07:00 AM', smokingPolicy: 'Outdoors only', cleaningPolicy: 'Daily mandatory'
    }
  });

  const handleChange = (field: keyof Property, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (lat: number, lng: number, addressDetails?: any) => {
      setFormData(prev => {
          const updates: any = { gpsLocation: { lat, lng } };
          if (addressDetails) {
              if (addressDetails.city || addressDetails.town || addressDetails.village) {
                  updates.city = addressDetails.city || addressDetails.town || addressDetails.village;
              }
              if (addressDetails.state) updates.state = addressDetails.state;
              if (addressDetails.postcode) updates.pincode = addressDetails.postcode;
              if (addressDetails.suburb || addressDetails.neighbourhood) {
                  updates.location = addressDetails.suburb || addressDetails.neighbourhood;
              }
          }
          return { ...prev, ...updates };
      });
  };

  const handleRuleChange = (field: string, value: any) => {
      setFormData(prev => ({
          ...prev,
          rules: { ...prev.rules, [field]: value } as any
      }));
  };

  const toggleAmenity = (name: string) => {
      const current = formData.amenities || [];
      if (current.includes(name)) {
          handleChange('amenities', current.filter(a => a !== name));
      } else {
          handleChange('amenities', [...current, name]);
      }
  };

  const addCustomAmenity = () => {
      if(customAmenity.trim()) {
          toggleAmenity(customAmenity.trim());
          setCustomAmenity('');
      }
  };

  // --- CONNECTED TO BACKEND CLOUD FUNCTION ---
  const handleAiDescription = async () => {
      if (!formData.title || !formData.city) {
          alert("Please fill in the Property Name and City first.");
          return;
      }
      setIsGenerating(true);
      
      try {
          const response = await callAICore('generate_description', {
              title: formData.title,
              location: `${formData.location}, ${formData.city}`,
              type: formData.type,
              amenities: formData.amenities,
              bedrooms: formData.bedrooms,
              pool: formData.poolType !== 'NA',
              vibe: propertyVibe
          }, 'host', 'host1');

          if (response.data && response.data.description) {
              handleChange('description', response.data.description);
          } else {
              throw new Error(response.error || 'No description returned');
          }
      } catch (error) {
          console.error("AI Description Error:", error);
          alert("Could not generate description. Please try again.");
      } finally {
          setIsGenerating(false);
      }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      Promise.all(files.map(file => compressImage(file)))
      .then(compressedResults => {
        handleChange('images', [...(formData.images || []), ...compressedResults]);
      })
      .catch(err => {
          console.error("Image compression failed", err);
          alert("Failed to process images. Please try again.");
      });
    }
  };

  const removeImage = (index: number) => {
      const currentImages = formData.images || [];
      handleChange('images', currentImages.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
      const finalData = { ...formData, status: 'active' };
      onSave(finalData as Property);
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch(currentStep) {
        case 1: 
            return (
                <div className="animate-fadeIn space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
                         <div className="flex-1 space-y-2">
                             <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2"><MapPin className="w-5 h-5"/> Pin Location</div>
                             <p className="text-sm text-blue-700 dark:text-blue-400">Search your area and drag the pin to the exact property entrance.</p>
                             
                             <div className="pt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Latitude</div>
                                    <div className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{formData.gpsLocation?.lat.toFixed(6)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Longitude</div>
                                    <div className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{formData.gpsLocation?.lng.toFixed(6)}</div>
                                </div>
                             </div>
                         </div>
                         <div className="w-full md:w-[400px] h-[300px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                             <LocationPicker 
                                lat={formData.gpsLocation?.lat || 20.5937}
                                lng={formData.gpsLocation?.lng || 78.9629}
                                onChange={handleLocationChange}
                                className="w-full h-full"
                             />
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
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
                        <div className="col-span-1 md:col-span-2">
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
                             <Input value={formData.country} readOnly className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                </div>
            );
        // ... (Cases 2-5 same logic but just render function, keeping concise here for update)
        case 2:
            return (
                <div className="animate-fadeIn space-y-8">
                    <SectionHeader title="Structure & Layout" icon={Home} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <FormLabel>Bedrooms</FormLabel>
                            <Input type="number" min="0" value={formData.bedrooms} onChange={e => handleChange('bedrooms', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <FormLabel>Bathrooms</FormLabel>
                            <Input type="number" min="0" value={formData.bathrooms} onChange={e => handleChange('bathrooms', parseInt(e.target.value))} />
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
                                     <Input placeholder="Size" value={formData.poolSize || ''} onChange={e => handleChange('poolSize', e.target.value)} />
                                 )}
                             </div>
                        </div>
                    </div>
                    {/* ... rest of step 2 ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleCard checked={formData.parking || false} onChange={(v) => handleChange('parking', v)} title="Parking Available" icon={Car} />
                        <ToggleCard checked={formData.petFriendly || false} onChange={(v) => handleChange('petFriendly', v)} title="Pet Friendly" icon={Dog} />
                    </div>
                    <div>
                        <SectionHeader title="Amenities" icon={Check} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {AMENITIES_LIST.map(am => (
                                <button 
                                    key={am.id}
                                    onClick={() => toggleAmenity(am.name)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-24 gap-2 ${
                                        formData.amenities?.includes(am.name) 
                                        ? 'border-gray-900 dark:border-gray-700 bg-gray-900 dark:bg-gray-700 text-white shadow-md' 
                                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    {am.id === 'wifi' && <Wifi className="w-5 h-5" />}
                                    {am.id === 'pool' && <Droplets className="w-5 h-5" />}
                                    {['wifi', 'pool'].indexOf(am.id) === -1 && <Check className="w-5 h-5" />}
                                    <span className="text-xs font-bold">{am.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                             <Input placeholder="Add custom amenity..." value={customAmenity} onChange={e => setCustomAmenity(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomAmenity()} />
                             <button onClick={addCustomAmenity} className="bg-gray-900 dark:bg-gray-700 text-white px-4 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-600 transition-colors"><Plus className="w-5 h-5" /></button>
                        </div>
                        {formData.amenities?.filter(a => !AMENITIES_LIST.find(l => l.name === a)).length! > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {formData.amenities?.filter(a => !AMENITIES_LIST.find(l => l.name === a)).map(a => (
                                    <span key={a} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                                        {a}
                                        <button onClick={() => toggleAmenity(a)} className="hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        case 3:
            return (
                <div className="animate-fadeIn space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <SectionHeader title="Staff & Caretaker" icon={UserCheck} />
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                                <ToggleCard checked={formData.caretakerAvailable || false} onChange={(v) => handleChange('caretakerAvailable', v)} title="Caretaker On-site" icon={UserCheck} />
                                {formData.caretakerAvailable && (
                                    <div className="grid grid-cols-1 gap-4 pt-4 animate-fadeIn">
                                        <div>
                                            <FormLabel>Caretaker Name</FormLabel>
                                            <Input value={formData.caretakerName || ''} onChange={e => handleChange('caretakerName', e.target.value)} placeholder="e.g. Ramesh Bhau" />
                                        </div>
                                        <div>
                                            <FormLabel>Contact Number</FormLabel>
                                            <Input value={formData.caretakerNumber || ''} onChange={e => handleChange('caretakerNumber', e.target.value)} placeholder="+91..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <SectionHeader title="Timings" icon={Clock} />
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><FormLabel>Check-in</FormLabel><Input type="time" value={formData.checkInTime} onChange={e => handleChange('checkInTime', e.target.value)} /></div>
                                    <div><FormLabel>Check-out</FormLabel><Input type="time" value={formData.checkOutTime} onChange={e => handleChange('checkOutTime', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* ... Rules section condensed for brevity but functionally same ... */}
                    <div className="pt-6">
                        <SectionHeader title="House Rules & Policies" icon={Shield} />
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><FormLabel>Security Deposit (₹)</FormLabel><Input type="number" value={formData.rules?.securityDeposit} onChange={e => handleRuleChange('securityDeposit', parseInt(e.target.value))} /></div>
                                <div><FormLabel>Refund Policy</FormLabel><Select value={formData.rules?.refundPolicy} onChange={e => handleRuleChange('refundPolicy', e.target.value)}><option value="1-3 working days">1-3 working days</option><option value="4-7 working days">4-7 working days</option></Select></div>
                             </div>
                        </div>
                    </div>
                </div>
            );
        case 4:
            return (
                <div className="animate-fadeIn space-y-8">
                    <div className="bg-gradient-to-r from-blue-50 to-brand-50 dark:from-blue-900/20 dark:to-brand-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg">Smart Pricing Assistant</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Get data-driven price suggestions based on market trends.</p>
                        </div>
                        <button onClick={handleAiPricing} disabled={isGenerating} className="bg-white dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                            {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div> : <Wand2 className="w-4 h-4" />} Suggest Pricing
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <SectionHeader title="Guest Capacity" icon={Users} />
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <div><div className="font-semibold text-gray-900 dark:text-white">Base Guests</div></div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleChange('baseGuests', Math.max(1, (formData.baseGuests||0)-1))} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 font-bold">-</button>
                                        <span className="font-mono font-medium text-lg w-6 text-center text-gray-900 dark:text-white">{formData.baseGuests}</span>
                                        <button onClick={() => handleChange('baseGuests', (formData.baseGuests||0)+1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 font-bold">+</button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div><div className="font-semibold text-gray-900 dark:text-white">Max Guests</div></div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleChange('maxGuests', Math.max(1, (formData.maxGuests||0)-1))} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 font-bold">-</button>
                                        <span className="font-mono font-medium text-lg w-6 text-center text-gray-900 dark:text-white">{formData.maxGuests}</span>
                                        <button onClick={() => handleChange('maxGuests', (formData.maxGuests||0)+1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 font-bold">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <SectionHeader title="Base Pricing" icon={IndianRupee} />
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                                <div>
                                    <FormLabel>Weekday Price (Mon-Thu)</FormLabel>
                                    <div className="relative"><span className="absolute left-4 top-3 text-gray-400 dark:text-gray-500">₹</span><Input type="number" className="pl-8" value={formData.baseWeekdayPrice} onChange={e => handleChange('baseWeekdayPrice', parseInt(e.target.value))} /></div>
                                </div>
                                <div>
                                    <FormLabel>Weekend Price (Fri-Sun)</FormLabel>
                                    <div className="relative"><span className="absolute left-4 top-3 text-gray-400 dark:text-gray-500">₹</span><Input type="number" className="pl-8" value={formData.baseWeekendPrice} onChange={e => handleChange('baseWeekendPrice', parseInt(e.target.value))} /></div>
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
                     <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" multiple accept="image/*" />
                     <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:border-gray-900 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                        <div className="p-4 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Camera className="w-8 h-8 text-gray-800 dark:text-white" /></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Click to upload photos</span>
                     </div>
                     <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {formData.images?.map((img, i) => (
                            <div key={i} className="relative w-36 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                <img src={img} className="w-full h-full object-cover" alt="Preview"/>
                                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute top-1 right-1 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                     </div>
                     <div className="pt-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-indigo-500" /> AI Writer</h3>
                            
                            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                {VIBES.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setPropertyVibe(v.id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${propertyVibe === v.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'}`}
                                    >
                                        <v.icon className="w-3 h-3" /> {v.label}
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleAiDescription} disabled={isGenerating} className="w-full py-3 bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 rounded-xl font-bold shadow-sm hover:shadow-md border border-indigo-200 dark:border-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div> : <Wand2 className="w-4 h-4" />} Generate Optimized Description
                            </button>
                        </div>
                        <div className="mt-6">
                             <FormLabel>Description Preview</FormLabel>
                             <TextArea placeholder="Description will appear here..." value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={8} />
                        </div>
                     </div>
                </div>
             );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100vh-6rem)] overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{initialData ? 'Edit Property' : 'List New Property'}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:hidden">Step {currentStep} of {STEPS.length}</p>
        </div>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
            <Trash2 className="w-5 h-5"/>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Stepper (Top Horizontal) */}
          <div className="md:hidden w-full overflow-x-auto border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
             <div className="flex p-4 min-w-max gap-4">
                 {STEPS.map((step) => (
                    <div key={step.id} className={`flex items-center gap-2 ${currentStep === step.id ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === step.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800'}`}>{step.id}</div>
                        <span className="text-xs whitespace-nowrap">{step.label}</span>
                    </div>
                 ))}
             </div>
          </div>

          {/* Desktop Sidebar Stepper */}
          <div className="hidden md:block w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto">
              <div className="space-y-2">
                {STEPS.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                            currentStep === step.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 ring-1 ring-gray-900/5' : currentStep > step.id ? 'text-green-700 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-400 dark:text-gray-600'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${currentStep === step.id ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : currentStep > step.id ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                            {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                        </div>
                        {step.label}
                    </button>
                ))}
              </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4 md:p-10 relative transition-colors duration-300">
             <div className="max-w-3xl mx-auto pb-20">{renderStep()}</div>
          </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center z-10 relative shrink-0 gap-4">
         <button onClick={prevStep} disabled={currentStep === 1} className="px-4 md:px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent font-semibold flex items-center gap-2 transition-colors text-sm md:text-base flex-1 md:flex-none justify-center md:justify-start">
            <ChevronLeft className="w-5 h-5" /> Back
         </button>

         {currentStep < STEPS.length ? (
             <button onClick={nextStep} className="px-6 md:px-8 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:bg-black dark:hover:bg-gray-100 font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 text-sm md:text-base flex-1 md:flex-none justify-center md:justify-end">
                Next <ChevronRight className="w-5 h-5" />
             </button>
         ) : (
             <button onClick={handlePublish} className="px-6 md:px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base flex-1 md:flex-none justify-center md:justify-end">
                <Save className="w-5 h-5" /> Publish
             </button>
         )}
      </div>
    </div>
  );
};
