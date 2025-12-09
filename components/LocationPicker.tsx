

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Navigation, Link as LinkIcon, Info, X } from 'lucide-react';

// Declare Leaflet global type from CDN
declare const L: any;

interface LocationPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number, addressDetails?: any) => void;
    className?: string;
    readOnly?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChange, className, readOnly = false }) => {
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mode, setMode] = useState<'search' | 'paste'>('search');

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default to India center if 0,0 provided
        const initialLat = lat || 20.5937;
        const initialLng = lng || 78.9629;
        const zoom = lat ? 15 : 5;

        // Configure map options based on readOnly status
        const mapOptions = {
            scrollWheelZoom: !readOnly, // Disable scroll zoom in read-only to prevent page scroll hijacking
            dragging: true, // Always allow panning
            zoomControl: false // We will add it manually for better position
        };

        const map = L.map(mapContainerRef.current, mapOptions).setView([initialLat, initialLng], zoom);
        
        // Add Zoom Control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // CartoDB Voyager tiles (Cleaner, "Apple Maps" style)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Custom Icon
        const customIcon = L.icon({
            iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        const marker = L.marker([initialLat, initialLng], {
            draggable: !readOnly, // Only draggable in edit mode
            icon: customIcon
        }).addTo(map);

        if (!readOnly) {
            marker.on('dragend', async function(e: any) {
                const pos = e.target.getLatLng();
                await updateAddressFromCoords(pos.lat, pos.lng);
            });
            
            // Allow clicking map to move marker
            map.on('click', async function(e: any) {
                marker.setLatLng(e.latlng);
                await updateAddressFromCoords(e.latlng.lat, e.latlng.lng);
            });
        }

        markerRef.current = marker;
        mapRef.current = map;

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update marker when props change (External updates)
    useEffect(() => {
        if (markerRef.current && mapRef.current && lat && lng) {
            const currentPos = markerRef.current.getLatLng();
            // Only update if significantly different to avoid loop
            if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
                markerRef.current.setLatLng([lat, lng]);
                mapRef.current.panTo([lat, lng]);
            }
        }
    }, [lat, lng]);

    const updateAddressFromCoords = async (latitude: number, longitude: number) => {
        onChange(latitude, longitude); // Immediate coordinate update
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            onChange(latitude, longitude, data.address);
        } catch {
            // Address fetch failed, but coordinates are set
        }
    };

    const extractCoordsFromUrl = (url: string): { lat: number, lng: number } | null => {
        // Pattern 1: Google Maps @lat,lng (e.g. google.com/maps/@18.75,73.40,15z)
        const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

        // Pattern 2: Google Maps Search/Query (e.g. search/18.75,73.40 or q=18.75,73.40)
        const qMatch = url.match(/(?:search|q|ll|loc)=?(-?\d+\.\d+)(?:,|%2C|\s)+(-?\d+\.\d+)/);
        if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

        // Pattern 3: OpenStreetMap (e.g. #map=15/18.75/73.40)
        const osmMatch = url.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
        if (osmMatch) return { lat: parseFloat(osmMatch[1]), lng: parseFloat(osmMatch[2]) };

        return null;
    };

    const handleSearchOrLink = async (e?: React.FormEvent) => {
        if (readOnly) return;
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        // 1. Try to parse as URL first (if in paste mode OR if input looks like a URL)
        if (mode === 'paste' || searchQuery.includes('http') || searchQuery.includes('google.com') || searchQuery.includes('maps')) {
            const coords = extractCoordsFromUrl(searchQuery);
            if (coords) {
                if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([coords.lat, coords.lng]);
                    mapRef.current.setView([coords.lat, coords.lng], 16);
                    await updateAddressFromCoords(coords.lat, coords.lng);
                    setIsSearching(false);
                    setSearchQuery('');
                    return;
                }
            } else if (searchQuery.includes('goo.gl') || searchQuery.includes('maps.app.goo.gl')) {
                alert("Short links (goo.gl) are not supported directly due to browser security. Please click the link, let it open in your browser, then copy the FULL URL from the address bar.");
                setIsSearching(false);
                return;
            }
        }

        // 2. Fallback to Text Search (Nominatim)
        if (mode === 'search') {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                const results = await response.json();
                
                if (results && results.length > 0) {
                    const first = results[0];
                    const newLat = parseFloat(first.lat);
                    const newLng = parseFloat(first.lon);
                    
                    if (mapRef.current && markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng]);
                        mapRef.current.setView([newLat, newLng], 14);
                        // Pass full address details up
                        onChange(newLat, newLng, first.address);
                    }
                } else {
                    alert("Location not found. Try entering a City or pasting a Google Maps URL.");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setIsSearching(false);
        }
    };

    return (
        <div className={`relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ${className}`}>
            
            {/* Floating Command Palette (Host View Only) */}
            {!readOnly && (
                <div className="absolute top-4 left-4 right-4 z-[500] max-w-md mx-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800">
                            <button 
                                onClick={() => setMode('search')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'search' ? 'bg-gray-50 dark:bg-gray-800 text-black dark:text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                Search City
                            </button>
                            <div className="w-px bg-gray-100 dark:bg-gray-800"></div>
                            <button 
                                onClick={() => setMode('paste')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === 'paste' ? 'bg-gray-50 dark:bg-gray-800 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                Paste Maps Link
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-2">
                            <form onSubmit={handleSearchOrLink} className="flex gap-2 relative">
                                <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                                    {mode === 'search' ? <Search className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                </div>
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={mode === 'search' ? "Enter city, area or landmark..." : "Paste full Google Maps URL here..."} 
                                    className="w-full pl-9 pr-2 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                />
                                <button 
                                    onClick={() => handleSearchOrLink()}
                                    disabled={isSearching || !searchQuery.trim()}
                                    className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-xl shadow-md hover:opacity-80 transition-opacity disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-10" />
            
            {/* Host Hint */}
            {!readOnly && (
                <div className="absolute bottom-4 left-4 right-4 z-[500] pointer-events-none flex justify-center">
                    <div className="bg-white/90 dark:bg-black/80 backdrop-blur px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 animate-bounce" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Drag map or marker to pinpoint exact entrance</span>
                    </div>
                </div>
            )}
        </div>
    );
};