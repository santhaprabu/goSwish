import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, MapPin, Home, Ruler, Layers, Bed, Bath,
    Dog, Cat, Bird, AlertCircle, Check, Loader2, X,
    Plus, ChevronRight, Star, Trash2, Edit2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Mock address suggestions
const mockAddressSuggestions = [
    { street: '123 Main Street', city: 'Dallas', state: 'TX', zip: '75201', lat: 32.7767, lng: -96.7970 },
    { street: '456 Oak Avenue', city: 'Dallas', state: 'TX', zip: '75204', lat: 32.7831, lng: -96.7936 },
    { street: '789 Elm Boulevard', city: 'Dallas', state: 'TX', zip: '75219', lat: 32.8121, lng: -96.8006 },
    { street: '321 Pine Lane', city: 'Plano', state: 'TX', zip: '75024', lat: 33.0198, lng: -96.6989 },
    { street: '654 Cedar Drive', city: 'Frisco', state: 'TX', zip: '75034', lat: 33.1507, lng: -96.8236 },
];

const specialRoomOptions = [
    'Office', 'Game Room', 'Gym', 'Library', 'Media Room',
    'Sunroom', 'Nursery', 'Guest Suite', 'Workshop'
];

const petTypes = ['Dogs', 'Cats', 'Birds', 'Fish', 'Other'];

export function AddHouseForm({ onBack, onComplete, editingHouse = null }) {
    const { addHouse, updateHouse } = useApp();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Address state
    const [addressInput, setAddressInput] = useState(
        editingHouse ? `${editingHouse.address.street}, ${editingHouse.address.city}, ${editingHouse.address.state}` : ''
    );
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(editingHouse?.address || null);

    // Property details
    const [name, setName] = useState(editingHouse?.name || '');
    const [sqft, setSqft] = useState(editingHouse?.sqft?.toString() || '');
    const [floors, setFloors] = useState(editingHouse?.floors?.toString() || '1');
    const [bedrooms, setBedrooms] = useState(editingHouse?.bedrooms?.toString() || '2');
    const [bathrooms, setBathrooms] = useState(editingHouse?.bathrooms?.toString() || '2');
    const [specialRooms, setSpecialRooms] = useState(editingHouse?.specialRooms || []);

    // Pet info
    const [hasPets, setHasPets] = useState(editingHouse?.pets?.hasPets || false);
    const [selectedPetTypes, setSelectedPetTypes] = useState(editingHouse?.pets?.types || []);
    const [petCount, setPetCount] = useState(editingHouse?.pets?.count?.toString() || '1');

    // Access notes
    const [accessNotes, setAccessNotes] = useState(editingHouse?.accessNotes || '');

    const inputRef = useRef(null);

    // Handle address input
    const handleAddressInput = (value) => {
        setAddressInput(value);

        if (value.length >= 3) {
            // Simulate API call with delay
            setTimeout(() => {
                const filtered = mockAddressSuggestions.filter(addr =>
                    `${addr.street} ${addr.city}`.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filtered.length > 0 ? filtered : mockAddressSuggestions.slice(0, 3));
                setShowSuggestions(true);
            }, 300);
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

        const houseData = {
            name: name || selectedAddress.street,
            address: {
                ...selectedAddress,
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

        if (editingHouse) {
            updateHouse({ id: editingHouse.id, ...houseData });
        } else {
            addHouse(houseData);
        }

        setLoading(false);
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="app-bar">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={step > 1 ? () => setStep(step - 1) : onBack}
                        className="btn-ghost p-2 -ml-2 rounded-xl"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">
                        {editingHouse ? 'Edit Property' : 'Add Property'}
                    </h1>
                    <div className="w-10" />
                </div>

                {/* Progress */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-primary-500' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Step {step} of 3: {
                            step === 1 ? 'Address' : step === 2 ? 'Property Details' : 'Additional Info'
                        }
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
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
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedAddress.street}</p>
                                        <p className="text-sm text-gray-600">
                                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
                                        </p>
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
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe">
                {step < 3 ? (
                    <button
                        onClick={nextStep}
                        className="btn btn-primary w-full py-4"
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary w-full py-4"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : editingHouse ? (
                            'Save Changes'
                        ) : (
                            'Add Property'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export function HouseList({ onAddHouse, onEditHouse, onSelectHouse }) {
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
        <div className="space-y-4">
            {houses.map((house) => (
                <div
                    key={house.id}
                    className="card group relative border-2 border-teal-600"
                >
                    {/* Default star */}
                    <button
                        onClick={() => handleSetDefault(house.id)}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors
              ${house.isDefault
                                ? 'text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'}`}
                        title={house.isDefault ? 'Default property' : 'Set as default'}
                    >
                        <Star className={`w-5 h-5 ${house.isDefault ? 'fill-current' : ''}`} />
                    </button>

                    <div
                        onClick={() => onSelectHouse?.(house)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Home className="w-6 h-6 text-primary-500" />
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {house.name}
                                    </h3>
                                    {house.isDefault && (
                                        <span className="badge badge-primary text-xs">Default</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {house.address.street}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {house.address.city}, {house.address.state} {house.address.zip}
                                </p>

                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Ruler className="w-4 h-4" />
                                        {house.sqft.toLocaleString()} sqft
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Bed className="w-4 h-4" />
                                        {house.bedrooms} bed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Bath className="w-4 h-4" />
                                        {house.bathrooms} bath
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => onEditHouse(house)}
                            className="btn btn-ghost flex-1 gap-2 text-sm"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => setConfirmDelete(house.id)}
                            className="btn btn-ghost flex-1 gap-2 text-sm text-error-500 hover:bg-error-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>

                    {/* Delete confirmation */}
                    {confirmDelete === house.id && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl 
                            flex flex-col items-center justify-center p-6 animate-fade-in">
                            <p className="text-center font-medium text-gray-900 mb-4">
                                Delete "{house.name}"?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="btn btn-ghost px-6"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(house.id)}
                                    className="btn bg-error-500 text-white hover:bg-error-600 px-6"
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
                    className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl
                     flex items-center justify-center gap-2 text-gray-500
                     hover:border-primary-300 hover:text-primary-500 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Property
                </button>
            )}

            <p className="text-center text-xs text-gray-400">
                {houses.length} of 20 properties
            </p>
        </div>
    );
}

export default function HouseManagement({ onBack }) {
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

    if (view === 'add' || view === 'edit') {
        return (
            <AddHouseForm
                onBack={() => setView('list')}
                onComplete={handleComplete}
                editingHouse={editingHouse}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="app-bar">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={onBack}
                        className="btn-ghost p-2 -ml-2 rounded-xl"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">My Properties</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
                <HouseList
                    onAddHouse={handleAddHouse}
                    onEditHouse={handleEditHouse}
                />
            </div>
        </div>
    );
}
