import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, MapPin, Home, Ruler, Layers, Bed, Bath,
    Dog, Cat, Bird, AlertCircle, Check, Loader2, X,
    Plus, ChevronRight, Star, Trash2, Edit2, Sparkles, Save, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const specialRoomOptions = [
    'Office', 'Game Room', 'Gym', 'Library', 'Media Room',
    'Sunroom', 'Nursery', 'Guest Suite', 'Workshop'
];

const petTypes = ['Dogs', 'Cats', 'Birds', 'Fish', 'Other'];

/**
 * Normalize state name to 2-letter code
 */
const normalizeStateCode = (state) => {
    if (!state) return '';

    // If already 2 letters, return as is (uppercase)
    if (state.length === 2) return state.toUpperCase();

    // Map common state names to codes
    const stateMap = {
        'texas': 'TX', 'california': 'CA', 'new york': 'NY', 'florida': 'FL',
        'illinois': 'IL', 'pennsylvania': 'PA', 'ohio': 'OH', 'georgia': 'GA',
        'north carolina': 'NC', 'michigan': 'MI', 'new jersey': 'NJ', 'virginia': 'VA',
        'washington': 'WA', 'arizona': 'AZ', 'massachusetts': 'MA', 'tennessee': 'TN',
        'indiana': 'IN', 'missouri': 'MO', 'maryland': 'MD', 'wisconsin': 'WI',
        'colorado': 'CO', 'minnesota': 'MN', 'south carolina': 'SC', 'alabama': 'AL',
        'louisiana': 'LA', 'kentucky': 'KY', 'oregon': 'OR', 'oklahoma': 'OK',
        'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA', 'nevada': 'NV',
        'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS', 'new mexico': 'NM',
        'nebraska': 'NE', 'west virginia': 'WV', 'idaho': 'ID', 'hawaii': 'HI',
        'new hampshire': 'NH', 'maine': 'ME', 'montana': 'MT', 'rhode island': 'RI',
        'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND', 'alaska': 'AK',
        'vermont': 'VT', 'wyoming': 'WY'
    };

    const normalized = stateMap[state.toLowerCase()];
    return normalized || state.substring(0, 2).toUpperCase(); // Fallback to first 2 chars
};

/**
 * COMPLETELY REDESIGNED: Edit Property Component
 * Focused on easy address editing and clear UX
 */
export function EditPropertyForm({ house, onBack, onComplete }) {
    const { updateHouse } = useApp();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [geocoding, setGeocoding] = useState(false);

    // Property name
    const [name, setName] = useState(house.name || '');

    // Address fields - Direct editing
    const [street, setStreet] = useState(house.address?.street || '');
    const [city, setCity] = useState(house.address?.city || '');
    const [state, setState] = useState(house.address?.state || '');
    const [zip, setZip] = useState(house.address?.zip || '');
    const [country] = useState('USA');

    // Coordinates
    const [lat, setLat] = useState(house.address?.lat || 0);
    const [lng, setLng] = useState(house.address?.lng || 0);

    // Property details
    const [sqft, setSqft] = useState(house.sqft?.toString() || '');
    const [floors, setFloors] = useState(house.floors?.toString() || '1');
    const [bedrooms, setBedrooms] = useState(house.bedrooms?.toString() || '2');
    const [bathrooms, setBathrooms] = useState(house.bathrooms?.toString() || '2');
    const [specialRooms, setSpecialRooms] = useState(house.specialRooms || []);

    // Pet info
    const [hasPets, setHasPets] = useState(house.pets?.hasPets || false);
    const [selectedPetTypes, setSelectedPetTypes] = useState(house.pets?.types || []);
    const [petCount, setPetCount] = useState(house.pets?.count?.toString() || '1');

    // Access notes
    const [accessNotes, setAccessNotes] = useState(house.accessNotes || '');

    // Track if address changed
    const [addressChanged, setAddressChanged] = useState(false);

    // Check if address has changed
    useEffect(() => {
        const changed =
            street !== (house.address?.street || '') ||
            city !== (house.address?.city || '') ||
            state !== (house.address?.state || '') ||
            zip !== (house.address?.zip || '');
        setAddressChanged(changed);
    }, [street, city, state, zip, house.address]);

    // Geocode the new address
    const geocodeAddress = async () => {
        if (!street || !city || !state) {
            setError('Please fill in street, city, and state to geocode');
            return;
        }

        setGeocoding(true);
        setError('');

        try {
            const fullAddress = `${street}, ${city}, ${state} ${zip}, USA`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&` +
                `q=${encodeURIComponent(fullAddress)}&` +
                `countrycodes=us&` +
                `limit=1`,
                {
                    headers: {
                        'User-Agent': 'GoSwish-App/1.0'
                    }
                }
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                setLat(parseFloat(result.lat));
                setLng(parseFloat(result.lon));
                setSuccess('✓ Address geocoded successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('Could not geocode address. Coordinates will remain unchanged.');
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            setError('Geocoding failed. You can still save with old coordinates.');
        } finally {
            setGeocoding(false);
        }
    };

    // Toggle special room
    const toggleSpecialRoom = (room) => {
        setSpecialRooms(prev =>
            prev.includes(room)
                ? prev.filter(r => r !== room)
                : [...prev, room]
        );
    };

    // Toggle pet type
    const togglePetType = (type) => {
        setSelectedPetTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Validate form
    const validateForm = () => {
        // Address validation
        if (!street.trim()) {
            setError('Street address is required');
            return false;
        }
        if (!city.trim()) {
            setError('City is required');
            return false;
        }
        if (!state.trim()) {
            setError('State is required');
            return false;
        }
        if (state.length !== 2) {
            setError('State must be a 2-letter code (e.g., TX, CA)');
            return false;
        }

        // Property details validation
        if (!sqft || parseInt(sqft) < 500 || parseInt(sqft) > 10000) {
            setError('Square footage must be between 500 and 10,000');
            return false;
        }

        setError('');
        return true;
    };

    // Save changes
    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            // Prepare updated data
            const updatedData = {
                name: name.trim() || street,
                address: {
                    street: street.trim(),
                    city: city.trim(),
                    state: state.toUpperCase().trim(),
                    zip: zip.trim(),
                    lat,
                    lng,
                    country,
                },
                sqft: parseInt(sqft),
                floors: parseInt(floors),
                bedrooms: parseInt(bedrooms),
                bathrooms: parseFloat(bathrooms),
                specialRooms,
                pets: {
                    hasPets,
                    types: hasPets ? selectedPetTypes : [],
                    count: hasPets ? parseInt(petCount) : 0,
                },
                accessNotes: accessNotes.trim(),
                updatedAt: new Date().toISOString(),
            };

            console.log('💾 Updating property:', { id: house.id, ...updatedData });

            // Update in storage
            await updateHouse({ id: house.id, ...updatedData });

            setSuccess('✓ Property updated successfully!');

            // Navigate back after short delay
            setTimeout(() => {
                onComplete();
            }, 1000);

        } catch (err) {
            console.error('Error updating property:', err);
            setError('Failed to update property. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-black text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">Edit Property</h1>
                    <div className="w-10" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                    Update your property information
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 pb-32 overflow-y-auto">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-up">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-green-700">{success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-error-50 border border-error-100 rounded-xl flex items-start gap-3 animate-slide-up">
                        <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-error-600">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto">
                            <X className="w-4 h-4 text-error-400" />
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Section 1: Address Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            <h2 className="font-bold text-gray-900">Address Information</h2>
                        </div>

                        {addressChanged && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-700">Address Changed</p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Consider updating coordinates by clicking "Update Coordinates" below
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Street Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., 123 Main St"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., Austin"
                                />
                            </div>

                            {/* State & ZIP */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                                        className="input-field font-mono font-bold text-center"
                                        placeholder="TX"
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ZIP Code
                                    </label>
                                    <input
                                        type="text"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value.slice(0, 10))}
                                        className="input-field"
                                        placeholder="78701"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {/* Geocode Button */}
                            {addressChanged && (
                                <button
                                    type="button"
                                    onClick={geocodeAddress}
                                    disabled={geocoding}
                                    className="w-full mt-2 py-3 px-4 bg-primary-500 text-white rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {geocoding ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating Coordinates...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Update Coordinates
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Coordinates Display */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Coordinates (for map/tracking)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-500 font-medium">Latitude</p>
                                        <p className="text-xs font-mono text-gray-700">{lat.toFixed(6)}</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-500 font-medium">Longitude</p>
                                        <p className="text-xs font-mono text-gray-700">{lng.toFixed(6)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Property Name */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Home className="w-5 h-5 text-primary-500" />
                            <h2 className="font-bold text-gray-900">Property Name</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Friendly Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="e.g., Home, Beach House, Office"
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                This helps you identify this property in your list
                            </p>
                        </div>
                    </div>

                    {/* Section 3: Property Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Ruler className="w-5 h-5 text-primary-500" />
                            <h2 className="font-bold text-gray-900">Property Details</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Square Footage */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Square Footage *
                                </label>
                                <input
                                    type="number"
                                    value={sqft}
                                    onChange={(e) => setSqft(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., 2000"
                                    min="500"
                                    max="10000"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Between 500 and 10,000 sq ft
                                </p>
                            </div>

                            {/* Floors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Floors
                                </label>
                                <select
                                    value={floors}
                                    onChange={(e) => setFloors(e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="1">1 Floor</option>
                                    <option value="2">2 Floors</option>
                                    <option value="3">3+ Floors</option>
                                </select>
                            </div>

                            {/* Bedrooms & Bathrooms */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bedrooms
                                    </label>
                                    <select
                                        value={bedrooms}
                                        onChange={(e) => setBedrooms(e.target.value)}
                                        className="input-field appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, '6+'].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bathrooms
                                    </label>
                                    <select
                                        value={bathrooms}
                                        onChange={(e) => setBathrooms(e.target.value)}
                                        className="input-field appearance-none"
                                    >
                                        {[1, 1.5, 2, 2.5, 3, 3.5, '4+'].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Special Rooms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Special Rooms
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {specialRoomOptions.map((room) => (
                                        <button
                                            key={room}
                                            type="button"
                                            onClick={() => toggleSpecialRoom(room)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                                                ${specialRooms.includes(room)
                                                    ? 'bg-primary-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {room}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Pets */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Dog className="w-5 h-5 text-primary-500" />
                                <h2 className="font-bold text-gray-900">Pets</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHasPets(!hasPets)}
                                className={`toggle ${hasPets ? 'bg-primary-500' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`toggle-indicator ${hasPets ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        {hasPets && (
                            <div className="space-y-4 pt-4 border-t border-gray-100 animate-slide-up">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pet Type(s)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {petTypes.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => togglePetType(type)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                                                    ${selectedPetTypes.includes(type)
                                                        ? 'bg-secondary-500 text-white shadow-md'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        How many pets?
                                    </label>
                                    <select
                                        value={petCount}
                                        onChange={(e) => setPetCount(e.target.value)}
                                        className="input-field"
                                    >
                                        {[1, 2, 3, 4, '5+'].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 5: Access Notes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-primary-500" />
                            <h2 className="font-bold text-gray-900">Access Notes</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Special Instructions for Cleaners
                            </label>
                            <textarea
                                value={accessNotes}
                                onChange={(e) => setAccessNotes(e.target.value.slice(0, 500))}
                                className="input-field min-h-[120px] resize-none"
                                placeholder="e.g., Gate code: 1234, Ring doorbell, Key under mat..."
                                rows={4}
                            />
                            <p className="mt-1 text-xs text-gray-400 text-right">
                                {accessNotes.length}/500 characters
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Footer with Save Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Saving Changes...
                        </>
                    ) : (
                        <>
                            <Save className="w-6 h-6" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/**
 * Add House Form (kept as is for adding new properties)
 */
export function AddHouseForm({ onBack, onComplete }) {
    const { addHouse } = useApp();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Address state
    const [addressInput, setAddressInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);

    // Editable address components
    const [editableStreet, setEditableStreet] = useState('');
    const [editableCity, setEditableCity] = useState('');
    const [editableState, setEditableState] = useState('');
    const [editableZip, setEditableZip] = useState('');

    // Property details
    const [name, setName] = useState('');
    const [sqft, setSqft] = useState('');
    const [floors, setFloors] = useState('1');
    const [bedrooms, setBedrooms] = useState('2');
    const [bathrooms, setBathrooms] = useState('2');
    const [specialRooms, setSpecialRooms] = useState([]);

    // Pet info
    const [hasPets, setHasPets] = useState(false);
    const [selectedPetTypes, setSelectedPetTypes] = useState([]);
    const [petCount, setPetCount] = useState('1');

    // Access notes
    const [accessNotes, setAccessNotes] = useState('');

    const inputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Handle address input with real geocoding API
    const handleAddressInput = async (value) => {
        setAddressInput(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 3) {
            // Debounce API calls to respect rate limits
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?` +
                        `format=json&` +
                        `q=${encodeURIComponent(value)}&` +
                        `countrycodes=us&` +
                        `addressdetails=1&` +
                        `limit=5`,
                        {
                            headers: {
                                'User-Agent': 'GoSwish-App/1.0'
                            }
                        }
                    );

                    if (!response.ok) throw new Error('Address search failed');

                    const data = await response.json();

                    // Transform Nominatim results to our format
                    const formattedAddresses = data.map(result => {
                        const addr = result.address || {};

                        // Extract and normalize state
                        const rawState = addr.state || addr['ISO3166-2-lvl4']?.split('-')[1] || '';
                        const normalizedState = normalizeStateCode(rawState);

                        // Build street address
                        let street = '';
                        if (addr.house_number && addr.road) {
                            street = `${addr.house_number} ${addr.road}`;
                        } else if (addr.road) {
                            street = addr.road;
                        } else {
                            street = result.display_name.split(',')[0];
                        }

                        return {
                            street,
                            city: addr.city || addr.town || addr.village || addr.county || '',
                            state: normalizedState,
                            zip: addr.postcode || '',
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon),
                            fullAddress: result.display_name,
                            rawState: rawState
                        };
                    }).filter(addr => addr.street && addr.city && addr.state);

                    setSuggestions(formattedAddresses);
                    setShowSuggestions(formattedAddresses.length > 0);
                } catch (error) {
                    console.error('Address search error:', error);
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }, 500);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Select address from suggestions
    const selectAddress = (address) => {
        setSelectedAddress(address);
        setAddressInput(`${address.street}, ${address.city}, ${address.state} ${address.zip}`);
        setShowSuggestions(false);

        // Populate editable fields
        setEditableStreet(address.street);
        setEditableCity(address.city);
        setEditableState(address.state);
        setEditableZip(address.zip);

        if (!name) {
            setName(address.street);
        }
    };

    // Toggle special room
    const toggleSpecialRoom = (room) => {
        setSpecialRooms(prev =>
            prev.includes(room)
                ? prev.filter(r => r !== room)
                : [...prev, room]
        );
    };

    // Toggle pet type
    const togglePetType = (type) => {
        setSelectedPetTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Validate step
    const validateStep = () => {
        if (step === 1) {
            if (!selectedAddress) {
                setError('Please select an address');
                return false;
            }
            if (!editableStreet || !editableCity || !editableState) {
                setError('Please ensure street, city, and state are filled');
                return false;
            }
            if (editableState.length !== 2) {
                setError('State must be a 2-letter code (e.g., TX, CA)');
                return false;
            }
        }
        if (step === 2) {
            if (!sqft || parseInt(sqft) < 500 || parseInt(sqft) > 10000) {
                setError('Square footage must be between 500 and 10,000');
                return false;
            }
        }
        setError('');
        return true;
    };

    // Next step
    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);

        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Additional validation
        if (!editableState || editableState.length !== 2) {
            setError(`Invalid state code: "${editableState}". Must be 2 letters.`);
            setLoading(false);
            return;
        }

        const houseData = {
            name: name || editableStreet,
            address: {
                street: editableStreet,
                city: editableCity,
                state: editableState,
                zip: editableZip,
                lat: selectedAddress?.lat || 0,
                lng: selectedAddress?.lng || 0,
                country: 'USA',
            },
            sqft: parseInt(sqft),
            floors: parseInt(floors),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseFloat(bathrooms),
            specialRooms,
            pets: {
                hasPets,
                types: hasPets ? selectedPetTypes : [],
                count: hasPets ? parseInt(petCount) : 0,
            },
            accessNotes,
            isDefault: false,
        };

        addHouse(houseData);

        setLoading(false);
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={step > 1 ? () => setStep(step - 1) : onBack}
                        className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">Add Property</h1>
                    <div className="w-10" />
                </div>

                {/* Progress */}
                <div className="px-1">
                    <div className="flex gap-2 mb-3">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-gray-800'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-400 text-center">
                        Step {step}: <span className="text-white">{step === 1 ? 'Location' : step === 2 ? 'Details' : 'Extras'}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 pb-32 overflow-y-auto">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-error-50 border border-error-100 rounded-xl flex items-start gap-3 animate-slide-up">
                        <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-error-600">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto">
                            <X className="w-4 h-4 text-error-400" />
                        </button>
                    </div>
                )}

                {/* Step 1: Address */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Address *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => handleAddressInput(e.target.value)}
                                    onFocus={() => addressInput.length >= 3 && setShowSuggestions(true)}
                                    className="input-field pl-12"
                                    placeholder="Start typing your address..."
                                    autoComplete="off"
                                />

                                {/* Suggestions dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden">
                                        {suggestions.map((addr, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => selectAddress(addr)}
                                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left transition-colors"
                                            >
                                                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{addr.street}</p>
                                                    <p className="text-sm text-gray-500">{addr.city}, {addr.state} {addr.zip}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-gray-400">
                                Type at least 3 characters to see suggestions
                            </p>
                        </div>

                        {/* Selected address display */}
                        {selectedAddress && (
                            <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-primary-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{selectedAddress.street}</p>
                                        <p className="text-sm text-gray-600">
                                            {selectedAddress.city}, <span className="font-mono font-bold text-primary-700">{selectedAddress.state}</span> {selectedAddress.zip}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Editable address fields */}
                        {selectedAddress && (
                            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Verify & Edit Address Details
                                </p>

                                {/* Street Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={editableStreet}
                                        onChange={(e) => setEditableStreet(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g., 123 Main St"
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={editableCity}
                                        onChange={(e) => setEditableCity(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g., Austin"
                                    />
                                </div>

                                {/* State & ZIP in a row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            value={editableState}
                                            onChange={(e) => setEditableState(e.target.value.toUpperCase().slice(0, 2))}
                                            className="input-field font-mono font-bold text-center"
                                            placeholder="TX"
                                            maxLength={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            value={editableZip}
                                            onChange={(e) => setEditableZip(e.target.value.slice(0, 10))}
                                            className="input-field"
                                            placeholder="78701"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Property name */}
                        {selectedAddress && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property Name
                                </label>
                                <div className="relative">
                                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field pl-12"
                                        placeholder="e.g., Home, Beach House, Office"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-400">
                                    Give this property a friendly name (optional)
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Property Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Square footage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Square Footage *
                            </label>
                            <div className="relative">
                                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={sqft}
                                    onChange={(e) => setSqft(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="e.g., 2000"
                                    min="500"
                                    max="10000"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                                Between 500 and 10,000 sq ft
                            </p>
                        </div>

                        {/* Floors */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Floors
                            </label>
                            <div className="relative">
                                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={floors}
                                    onChange={(e) => setFloors(e.target.value)}
                                    className="input-field pl-12 appearance-none"
                                >
                                    <option value="1">1 Floor</option>
                                    <option value="2">2 Floors</option>
                                    <option value="3">3+ Floors</option>
                                </select>
                            </div>
                        </div>

                        {/* Bedrooms & Bathrooms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bedrooms
                                </label>
                                <div className="relative">
                                    <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={bedrooms}
                                        onChange={(e) => setBedrooms(e.target.value)}
                                        className="input-field pl-12 appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, '6+'].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bathrooms
                                </label>
                                <div className="relative">
                                    <Bath className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={bathrooms}
                                        onChange={(e) => setBathrooms(e.target.value)}
                                        className="input-field pl-12 appearance-none"
                                    >
                                        {[1, 1.5, 2, 2.5, 3, 3.5, '4+'].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Special Rooms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Special Rooms
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {specialRoomOptions.map((room) => (
                                    <button
                                        key={room}
                                        type="button"
                                        onClick={() => toggleSpecialRoom(room)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${specialRooms.includes(room)
                                                ? 'bg-primary-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {room}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Additional Info */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Pets */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Dog className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-gray-900">Do you have pets?</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasPets(!hasPets)}
                                    className={`toggle ${hasPets ? 'bg-primary-500' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`toggle-indicator ${hasPets ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {hasPets && (
                                <div className="space-y-4 pt-4 border-t border-gray-100 animate-slide-up">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pet Type(s)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {petTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => togglePetType(type)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${selectedPetTypes.includes(type)
                                                            ? 'bg-secondary-500 text-white shadow-md'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How many pets?
                                        </label>
                                        <select
                                            value={petCount}
                                            onChange={(e) => setPetCount(e.target.value)}
                                            className="input-field"
                                        >
                                            {[1, 2, 3, 4, '5+'].map((n) => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Access Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Access Notes for Cleaners
                            </label>
                            <textarea
                                value={accessNotes}
                                onChange={(e) => setAccessNotes(e.target.value.slice(0, 500))}
                                className="input-field min-h-[120px] resize-none"
                                placeholder="e.g., Gate code: 1234, Ring doorbell, Key under mat..."
                                rows={4}
                            />
                            <p className="mt-1 text-xs text-gray-400 text-right">
                                {accessNotes.length}/500 characters
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
                {step < 3 ? (
                    <button
                        onClick={nextStep}
                        className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                Adding Property...
                            </>
                        ) : (
                            'Add Property'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export function HouseList({ onAddHouse, onEditHouse, onSelectHouse, navigateTo }) {
    const { getUserHouses, setDefaultHouse, deleteHouse } = useApp();
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Load houses on mount
    useEffect(() => {
        let isMounted = true;

        async function loadHouses() {
            try {
                const housesData = await getUserHouses();
                if (isMounted) {
                    setHouses(housesData || []);
                }
            } catch (error) {
                console.error('Error loading houses:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadHouses();

        return () => {
            isMounted = false;
        };
    }, [getUserHouses]);

    const handleSetDefault = async (houseId) => {
        try {
            await setDefaultHouse(houseId);
            // Reload houses to reflect the change
            const housesData = await getUserHouses();
            setHouses(housesData || []);
        } catch (error) {
            console.error('Error setting default house:', error);
        }
    };

    const handleDelete = async (houseId) => {
        try {
            await deleteHouse(houseId);
            setConfirmDelete(null);
            // Reload houses after deletion
            const housesData = await getUserHouses();
            setHouses(housesData || []);
        } catch (error) {
            console.error('Error deleting house:', error);
        }
    };

    if (houses.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                    <Home className="w-10 h-10 text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Properties Yet</h2>
                <p className="text-gray-500 mb-8 max-w-xs">
                    Add your first property to start booking cleaning services
                </p>
                <button
                    onClick={onAddHouse}
                    className="btn btn-primary gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Property
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {houses.map((house) => (
                <div
                    key={house.id}
                    onClick={() => onSelectHouse?.(house)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative transition-all hover:shadow-md group cursor-pointer"
                >
                    {/* Slim Gradient Stripe */}
                    <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-teal-400"></div>

                    <div className="p-3.5 flex gap-3.5 items-start">
                        {/* Compact Thumbnail & Star */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm flex-shrink-0 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full blur-lg -mr-2 -mt-2"></div>
                                <Home className="w-6 h-6 relative z-10" />
                            </div>
                            {/* Star Overlay */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefault(house.id);
                                }}
                                className={`absolute -top-1.5 -left-1.5 p-1 rounded-full bg-white shadow-sm border border-gray-100 transition-transform hover:scale-110 z-20
                                    ${house.isDefault ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-400'}`}
                            >
                                <Star className={`w-3.5 h-3.5 ${house.isDefault ? 'fill-current' : ''}`} />
                            </button>
                        </div>

                        {/* Content: Info & Stats */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div>
                                <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">
                                    {house.name}
                                </h3>
                                <p className="text-xs text-gray-500 leading-snug line-clamp-2 mt-0.5">
                                    {house.address?.street}, {house.address?.city}, {house.address?.state} {house.address?.zip}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Stats Pill */}
                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                    <span>{(house.size || house.sqft || 0).toLocaleString()} sqft</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{house.bedrooms || 0} bd</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{house.bathrooms || 0} ba</span>
                                </div>
                                {/* Last Cleaned Badge */}
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Sparkles className="w-3 h-3 text-teal-500" />
                                    <span>{house.lastCleaned ? new Date(house.lastCleaned).toLocaleDateString() : 'New'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col items-end gap-2">
                            {/* Book Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Book clicked for house:', house.id);
                                    if (navigateTo) {
                                        navigateTo('booking', { houseId: house.id });
                                    } else {
                                        console.error('NavigateTo function is missing!');
                                    }
                                }}
                                className="bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                                Book a Clean
                            </button>

                            {/* Edit/Delete */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditHouse(house);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDelete(house.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    {confirmDelete === house.id && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 animate-fade-in">
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Delete Property?</h4>
                            <div className="flex gap-2 w-full max-w-[200px] mt-2">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(house.id)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Add more button */}
            {houses.length < 20 && (
                <button
                    onClick={onAddHouse}
                    className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-6 h-6" />
                    Add Another Property
                </button>
            )}

            <p className="text-center text-xs text-gray-400 font-medium pt-2">
                You have {houses.length} properties
            </p>
        </div>
    );
}

export default function HouseManagement({ onBack, navigateTo }) {
    const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
    const [editingHouse, setEditingHouse] = useState(null);

    const handleAddHouse = () => {
        setEditingHouse(null);
        setView('add');
    };

    const handleEditHouse = (house) => {
        setEditingHouse(house);
        setView('edit');
    };

    const handleComplete = () => {
        setView('list');
        setEditingHouse(null);
    };

    if (view === 'add') {
        return (
            <AddHouseForm
                onBack={() => setView('list')}
                onComplete={handleComplete}
            />
        );
    }

    if (view === 'edit') {
        return (
            <EditPropertyForm
                house={editingHouse}
                onBack={() => setView('list')}
                onComplete={handleComplete}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-6">
            {/* Header */}
            <div className="bg-black text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-xl relative z-10 mb-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">My Properties</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-4 pb-24 overflow-y-auto">
                <HouseList
                    onAddHouse={handleAddHouse}
                    onEditHouse={handleEditHouse}
                    navigateTo={navigateTo}
                />
            </div>
        </div>
    );
}
