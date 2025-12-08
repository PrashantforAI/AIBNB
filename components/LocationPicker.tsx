
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Navigation, Link as LinkIcon, Info } from 'lucide-react';

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
    const [urlMode, setUrlMode] = useState(false);

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
            zoomControl: true // Always show zoom buttons (requested feature)
        };

        const map = L.map(mapContainerRef.current, mapOptions).setView([initialLat, initialLng], zoom);
        
        // CartoDB Voyager tiles (clean, modern look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
        }

        markerRef.current = marker;
        mapRef.current = map;

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update marker when props change
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
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            onChange(latitude, longitude, data.address);
        } catch {
            onChange(latitude, longitude);
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

        // 1. Try to parse as URL first
        if (searchQuery.includes('http') || searchQuery.includes('google.com/maps') || searchQuery.includes('maps.google')) {
            const coords = extractCoordsFromUrl(searchQuery);
            if (coords) {
                if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([coords.lat, coords.lng]);
                    mapRef.current.setView([coords.lat, coords.lng], 16);
                    await updateAddressFromCoords(coords.lat, coords.lng);
                    setIsSearching(false);
                    return;
                }
            } else if (searchQuery.includes('goo.gl') || searchQuery.includes('maps.app.goo.gl')) {
                alert("Short links (goo.gl) are not supported directly. Please click the link, let it open in your browser, then copy the full URL from the address bar.");
                setIsSearching(false);
                return;
            }
        }

        // 2. Fallback to Text Search (Nominatim)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const results = await response.json();
            
            if (results && results.length > 0) {
                const first = results[0];
                const newLat = parseFloat(first.lat);
                const newLng = parseFloat(first.lon);
                
                onChange(newLat, newLng, first.address); // Propagate up
                
                if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([newLat, newLng]);
                    mapRef.current.setView([newLat, newLng], 14);
                }
            } else {
                alert("Location not found. Try pasting a Google Maps URL.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ${className}`}>
            
            {/* Search Bar Overlay - Hide in Read Only */}
            {!readOnly && (
                <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2">
                    <div className="flex gap-2">
                        <form onSubmit={handleSearchOrLink} className="flex-1 relative shadow-lg rounded-xl">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={urlMode ? "Paste Google Maps full URL..." : "Search city or paste Maps link"} 
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 dark:text-white"
                            />
                            {urlMode ? (
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-brand-500" />
                            ) : (
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            )}
                        </form>
                        <button 
                            onClick={() => handleSearchOrLink()}
                            disabled={isSearching}
                            className="bg-brand-600 text-white p-3 rounded-xl shadow-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                            title="Search"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        </button>
                    </div>
                    {/* Mode Toggle / Hint */}
                    <div className="flex justify-end">
                        <button 
                            onClick={() => { setUrlMode(!urlMode); setSearchQuery(''); }}
                            className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded-md hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                        >
                            {urlMode ? "Switch to Search" : "Switch to Paste Link"}
                        </button>
                    </div>
                </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-10" />
            
            {!readOnly && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur p-3 rounded-xl border border-gray-200 dark:border-gray-700 z-[500] text-xs text-center shadow-lg flex items-center justify-center gap-2">
                    <Info className="w-3 h-3 text-brand-500" />
                    <span className="font-bold text-gray-700 dark:text-gray-300">Tip:</span> 
                    <span className="text-gray-600 dark:text-gray-400">Paste a full Google Maps link to auto-pin exact location.</span>
                </div>
            )}
        </div>
    );
};
