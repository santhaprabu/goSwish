import { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Check, X,
    Sparkles, Home, SprayCan, Grid3X3, Info,
    Flame, RefreshCw, Square, Shirt, Minus,
    Plus, AlertCircle, Tag, Trash2, Loader2,
    Calendar, Clock, CreditCard, Apple, Chrome,
    CheckCircle2, MapPin, Bed, Bath, Ruler, Star,
    Share2, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Icon mapping for service types
const serviceIcons = {
    Sparkles: Sparkles,
    SprayCan: SprayCan,
    Home: Home,
    Grid3X3: Grid3X3,
};

// Icon mapping for add-ons
const addOnIcons = {
    Flame: Flame,
    Refrigerator: RefreshCw,
    Square: Square,
    Shirt: Shirt,
    Minus: Minus,
};

// Calendar helpers
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }

    // Add all days in month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }

    return days;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

// Time slots
const TIME_SLOTS = [
    { id: 'morning', label: 'Morning', time: '9 AM - 12 PM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12 PM - 3 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '3 PM - 6 PM', icon: '🌆' },
];

export default function BookingFlow({ onBack, onComplete }) {
    const {
        user, getUserHouses, serviceTypes, addOns: availableAddOns,
        calculatePrice, validatePromoCode, createBooking
    } = useApp();


    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Debug: Log step changes
    useEffect(() => {
        console.log('📍 Booking flow step changed to:', step);
    }, [step]);

    // Step 1: Select property
    const [houses, setHouses] = useState([]);
    const [housesLoading, setHousesLoading] = useState(true);


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
                    setHousesLoading(false);
                }
            }
        }

        loadHouses();

        return () => {
            isMounted = false;
        };
    }, [getUserHouses]);

    const defaultHouse = houses.find(h => h.isDefault) || houses[0];
    const [selectedHouseId, setSelectedHouseId] = useState(defaultHouse?.id || '');

    // Update selectedHouseId when houses load
    useEffect(() => {
        if (!selectedHouseId && defaultHouse) {
            setSelectedHouseId(defaultHouse.id);
        }
    }, [defaultHouse, selectedHouseId]);

    // Step 2: Service type
    const [selectedServiceType, setSelectedServiceType] = useState('');

    // Step 3: Add-ons
    const [selectedAddOns, setSelectedAddOns] = useState([]);

    // Step 4: Date selection
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDates, setSelectedDates] = useState([]);
    const [dateSlots, setDateSlots] = useState({});

    // Step 5: Special notes
    const [specialNotes, setSpecialNotes] = useState('');

    // Step 6: Promo & Payment
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardZip, setCardZip] = useState('');

    // Step 7: Confirmation
    const [bookingResult, setBookingResult] = useState(null);

    // Calculate price
    const pricing = useMemo(() => {
        if (!selectedHouseId || !selectedServiceType) return null;
        return calculatePrice(
            selectedHouseId,
            selectedServiceType,
            selectedAddOns,
            appliedPromo?.code
        );
    }, [selectedHouseId, selectedServiceType, selectedAddOns, appliedPromo, calculatePrice]);

    const selectedHouse = houses.find(h => h.id === selectedHouseId);
    const selectedService = serviceTypes.find(s => s.id === selectedServiceType);

    // Calendar navigation
    const calendarDays = useMemo(() =>
        getCalendarDays(currentYear, currentMonth),
        [currentYear, currentMonth]
    );

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Date selection
    const toggleDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        if (selectedDates.includes(dateStr)) {
            setSelectedDates(selectedDates.filter(d => d !== dateStr));
            const newSlots = { ...dateSlots };
            delete newSlots[dateStr];
            setDateSlots(newSlots);
        } else if (selectedDates.length < 3) {
            setSelectedDates([...selectedDates, dateStr].sort());
            setDateSlots({ ...dateSlots, [dateStr]: [] });
        }
    };

    const isDateSelected = (date) => {
        return selectedDates.includes(date.toISOString().split('T')[0]);
    };

    const isPastDate = (date) => {
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return date < todayStart;
    };

    // Time slot selection
    const toggleSlot = (dateStr, slotId) => {
        const currentSlots = dateSlots[dateStr] || [];
        if (currentSlots.includes(slotId)) {
            setDateSlots({
                ...dateSlots,
                [dateStr]: currentSlots.filter(s => s !== slotId)
            });
        } else {
            setDateSlots({
                ...dateSlots,
                [dateStr]: [...currentSlots, slotId]
            });
        }
    };

    // Add-on toggle
    const toggleAddOn = (addOnId) => {
        setSelectedAddOns(prev =>
            prev.includes(addOnId)
                ? prev.filter(id => id !== addOnId)
                : [...prev, addOnId]
        );
    };

    // Apply promo code
    const handleApplyPromo = () => {
        setPromoError('');
        const result = validatePromoCode(promoCode);

        if (result.valid) {
            if (result.promo.minOrder > 0 && pricing && pricing.subtotal < result.promo.minOrder) {
                setPromoError(`Minimum order of $${result.promo.minOrder} required`);
                return;
            }
            setAppliedPromo(result.promo);
        } else {
            setPromoError(result.error);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setPromoError('');
    };

    // Card formatting
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    // Validate step
    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedHouseId;
            case 2: return !!selectedServiceType;
            case 3: return true; // Add-ons are optional
            case 4:
                return selectedDates.length > 0 &&
                    selectedDates.every(d => (dateSlots[d] || []).length > 0);
            case 5: return true; // Notes are optional
            case 6:
                if (paymentMethod === 'card') {
                    return cardNumber.replace(/\s/g, '').length === 16 &&
                        cardExpiry.length === 5 &&
                        cardCvc.length >= 3 &&
                        cardZip.length >= 5;
                }
                return true;
            default: return true;
        }
    };

    // Submit booking
    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            // Randomly simulate occasional payment failure (10% chance)
            if (Math.random() < 0.1) {
                throw new Error('Payment declined. Please try a different payment method.');
            }

            const dateOptions = selectedDates.map(dateStr => ({
                date: dateStr,
                slots: dateSlots[dateStr] || []
            }));

            const selectedAddOnDetails = selectedAddOns.map(id => {
                const addon = availableAddOns.find(a => a.id === id);
                return { id, name: addon.name, price: addon.price };
            });

            const booking = createBooking({
                houseId: selectedHouseId,
                serviceType: selectedServiceType,
                dateOptions,
                addOns: selectedAddOnDetails,
                specialNotes,
                pricing: {
                    base: pricing.base,
                    addOns: pricing.addOns,
                    taxes: pricing.taxes,
                    promoDiscount: pricing.promoDiscount,
                    total: pricing.total,
                },
                promoCode: appliedPromo?.code || null,
                paymentMethod,
            });

            setBookingResult(booking);
            setStep(7);
        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    // Render steps
    const renderStep = () => {
        switch (step) {
            // Step 1: Select Property
            case 1:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Select Property</h2>
                        <p className="text-gray-500 mb-6">Choose which property needs cleaning</p>

                        <div className="space-y-3">
                            {houses.map((house) => (
                                <button
                                    key={house.id}
                                    onClick={() => setSelectedHouseId(house.id)}
                                    className={`w-full card text-left transition-all ${selectedHouseId === house.id
                                        ? 'border-2 border-primary-500 bg-primary-50/50'
                                        : 'border border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
                      ${selectedHouseId === house.id ? 'bg-primary-500' : 'bg-gray-100'}`}>
                                            <Home className={`w-6 h-6 ${selectedHouseId === house.id ? 'text-white' : 'text-gray-400'
                                                }`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {house.name}
                                                </h3>
                                                {house.isDefault && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">
                                                {house.address.street}, {house.address.city}
                                            </p>

                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Ruler className="w-3.5 h-3.5" />
                                                    {house.sqft.toLocaleString()} sqft
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Bed className="w-3.5 h-3.5" />
                                                    {house.bedrooms}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Bath className="w-3.5 h-3.5" />
                                                    {house.bathrooms}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedHouseId === house.id && (
                                            <Check className="w-6 h-6 text-primary-500" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // Step 2: Service Type
            case 2:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Service</h2>
                        <p className="text-gray-500 mb-6">Select the type of cleaning you need</p>

                        <div className="space-y-4">
                            {serviceTypes.map((service) => {
                                const IconComponent = serviceIcons[service.icon] || Sparkles;
                                const isSelected = selectedServiceType === service.id;

                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedServiceType(service.id)}
                                        className={`w-full card text-left transition-all ${isSelected
                                            ? 'border-2 border-primary-500 bg-primary-50/50'
                                            : 'border border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center 
                        ${isSelected
                                                    ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                                                    : 'bg-gray-100'}`}>
                                                <IconComponent className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-gray-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                                                    <span className="text-primary-600 font-semibold">
                                                        ${service.rate}/sqft
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-3">{service.description}</p>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {service.includes.slice(0, 4).map((item, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {service.includes.length > 4 && (
                                                        <span className="text-xs px-2 py-0.5 text-primary-600">
                                                            +{service.includes.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Estimated price preview */}
                        {pricing && pricing.base !== undefined && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Estimated base price</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        ${pricing.base.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Based on {selectedHouse?.sqft.toLocaleString()} sqft
                                </p>
                            </div>
                        )}
                    </div>
                );

            // Step 3: Add-ons
            case 3:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Add-On Services</h2>
                        <p className="text-gray-500 mb-6">Enhance your cleaning (optional)</p>

                        <div className="space-y-3">
                            {availableAddOns.map((addon) => {
                                const IconComponent = addOnIcons[addon.icon] || Plus;
                                const isSelected = selectedAddOns.includes(addon.id);

                                return (
                                    <button
                                        key={addon.id}
                                        onClick={() => toggleAddOn(addon.id)}
                                        className={`w-full card flex items-center gap-4 transition-all ${isSelected
                                            ? 'border-2 border-secondary-500 bg-secondary-50/50'
                                            : 'border border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
                      ${isSelected
                                                ? 'bg-gradient-to-br from-secondary-500 to-secondary-600'
                                                : 'bg-gray-100'}`}>
                                            <IconComponent className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'
                                                }`} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                                        </div>

                                        <span className={`font-bold ${isSelected ? 'text-secondary-600' : 'text-gray-600'}`}>
                                            +${addon.price}
                                        </span>

                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                      ${isSelected
                                                ? 'bg-secondary-500'
                                                : 'border-2 border-gray-300'}`}>
                                            {isSelected && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedAddOns.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">Base price</span>
                                    <span className="font-medium">${(pricing?.base ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="text-gray-600">Add-ons ({selectedAddOns.length})</span>
                                    <span className="font-medium text-secondary-600">+${(pricing?.addOns ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">Subtotal</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        ${(pricing?.subtotal ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            // Step 4: Date & Time Selection
            case 4:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Pick Dates & Times</h2>
                        <p className="text-gray-500 mb-6">Select 1-3 preferred dates</p>

                        {/* Calendar */}
                        <div className="card mb-6">
                            {/* Month navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={prevMonth}
                                    className="btn-ghost p-2 rounded-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-semibold text-gray-900">
                                    {MONTHS[currentMonth]} {currentYear}
                                </h3>
                                <button
                                    onClick={nextMonth}
                                    className="btn-ghost p-2 rounded-lg"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS.map(day => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-medium text-gray-400 py-2"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((date, idx) => {
                                    if (!date) {
                                        return <div key={idx} className="p-2" />;
                                    }

                                    const isPast = isPastDate(date);
                                    const isToday = date.toDateString() === today.toDateString();
                                    const isSelected = isDateSelected(date);
                                    const canSelect = !isPast && (selectedDates.length < 3 || isSelected);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => canSelect && toggleDate(date)}
                                            disabled={isPast}
                                            className={`relative p-2 text-center rounded-xl transition-all
                        ${isPast
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-primary-500 text-white font-semibold shadow-md'
                                                        : canSelect
                                                            ? 'text-gray-700 hover:bg-primary-50'
                                                            : 'text-gray-400 cursor-not-allowed'
                                                }
                        ${isToday && !isSelected ? 'ring-2 ring-primary-200' : ''}`}
                                        >
                                            {date.getDate()}
                                            {isToday && (
                                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected dates with time slots */}
                        {selectedDates.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Select time slots</h4>

                                {selectedDates.map((dateStr, idx) => {
                                    const date = new Date(dateStr + 'T12:00:00');
                                    const slots = dateSlots[dateStr] || [];

                                    return (
                                        <div key={dateStr} className="card">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full 
                                         flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-medium text-gray-900">{formatDate(date)}</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleDate(date)}
                                                    className="text-gray-400 hover:text-error-500"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {TIME_SLOTS.map((slot) => {
                                                    const isSlotSelected = slots.includes(slot.id);
                                                    return (
                                                        <button
                                                            key={slot.id}
                                                            onClick={() => toggleSlot(dateStr, slot.id)}
                                                            className={`p-3 rounded-xl text-center transition-all text-sm
                                ${isSlotSelected
                                                                    ? 'bg-primary-500 text-white shadow-md'
                                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <span className="block text-lg mb-1">{slot.icon}</span>
                                                            <span className="font-medium">{slot.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {slots.length === 0 && (
                                                <p className="text-xs text-error-500 mt-2">
                                                    Please select at least one time slot
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {selectedDates.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Select at least one date from the calendar</p>
                            </div>
                        )}
                    </div>
                );

            // Step 5: Special Notes
            case 5:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Special Instructions</h2>
                        <p className="text-gray-500 mb-6">Add notes for your cleaner (optional)</p>

                        <textarea
                            value={specialNotes}
                            onChange={(e) => setSpecialNotes(e.target.value.slice(0, 1000))}
                            className="input-field min-h-[180px] resize-none"
                            placeholder="Examples:&#10;• Please focus on the kitchen&#10;• Avoid the nursery&#10;• Use eco-friendly products only&#10;• Dog-friendly cleaners preferred"
                            rows={6}
                        />
                        <p className="mt-2 text-xs text-gray-400 text-right">
                            {specialNotes.length}/1000 characters
                        </p>

                        {/* Quick suggestions */}
                        <div className="mt-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Quick adds:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Focus on bathrooms',
                                    'Pet-friendly products',
                                    'Eco-friendly only',
                                    'Light folding please',
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setSpecialNotes(prev =>
                                            prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`
                                        )}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full
                               hover:bg-gray-200 transition-colors"
                                    >
                                        + {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            // Step 6: Promo & Payment
            case 6:
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Pay</h2>
                        <p className="text-gray-500 mb-6">Complete your booking</p>

                        {/* Price breakdown */}
                        <div className="card mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        {selectedService?.name} ({selectedHouse?.sqft.toLocaleString()} sqft)
                                    </span>
                                    <span className="font-medium">${(pricing?.base ?? 0).toFixed(2)}</span>
                                </div>

                                {pricing?.addOns > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">
                                            Add-ons ({selectedAddOns.length})
                                        </span>
                                        <span className="font-medium">${(pricing.addOns ?? 0).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Taxes & fees</span>
                                    <span className="font-medium">${(pricing?.taxes ?? 0).toFixed(2)}</span>
                                </div>

                                {pricing?.promoDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-secondary-600">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-4 h-4" />
                                            Promo ({appliedPromo?.code})
                                        </span>
                                        <span className="font-medium">-${(pricing.promoDiscount ?? 0).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        ${(pricing?.total ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Promo code */}
                        {!appliedPromo && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            className="input-field pl-12"
                                            placeholder="Enter code"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyPromo}
                                        disabled={!promoCode}
                                        className="btn btn-outline px-6"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {promoError && (
                                    <p className="mt-2 text-sm text-error-500">{promoError}</p>
                                )}
                            </div>
                        )}

                        {appliedPromo && (
                            <div className="mb-6 p-4 bg-secondary-50 border border-secondary-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Tag className="w-5 h-5 text-secondary-500" />
                                    <div>
                                        <p className="font-medium text-secondary-700">{appliedPromo.code}</p>
                                        <p className="text-sm text-secondary-600">{appliedPromo.description}</p>
                                    </div>
                                </div>
                                <button onClick={removePromo} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Payment method */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Payment Method
                            </label>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                    ${paymentMethod === 'card'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-primary-500' : 'text-gray-400'
                                        }`} />
                                    <span className="text-sm font-medium">Card</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('apple')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                    ${paymentMethod === 'apple'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Apple className={`w-6 h-6 ${paymentMethod === 'apple' ? 'text-primary-500' : 'text-gray-400'
                                        }`} />
                                    <span className="text-sm font-medium">Apple</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('google')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                    ${paymentMethod === 'google'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Chrome className={`w-6 h-6 ${paymentMethod === 'google' ? 'text-primary-500' : 'text-gray-400'
                                        }`} />
                                    <span className="text-sm font-medium">Google</span>
                                </button>
                            </div>

                            {/* Card form */}
                            {paymentMethod === 'card' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            className="input-field"
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Expiry</label>
                                            <input
                                                type="text"
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                                className="input-field"
                                                placeholder="MM/YY"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">CVC</label>
                                            <input
                                                type="text"
                                                value={cardCvc}
                                                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                className="input-field"
                                                placeholder="123"
                                                maxLength={4}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">ZIP</label>
                                            <input
                                                type="text"
                                                value={cardZip}
                                                onChange={(e) => setCardZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                                className="input-field"
                                                placeholder="12345"
                                                maxLength={5}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod !== 'card' && (
                                <div className="p-6 bg-gray-50 rounded-xl text-center animate-fade-in">
                                    <p className="text-gray-600">
                                        Tap "Pay Now" to complete with {paymentMethod === 'apple' ? 'Apple Pay' : 'Google Pay'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-4 bg-error-50 border border-error-100 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-error-600">{error}</p>
                            </div>
                        )}
                    </div>
                );

            // Step 7: Confirmation
            case 7:
                return (
                    <div className="animate-fade-in text-center">
                        {/* Success animation */}
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-success-100 rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-gradient-to-br from-success-500 to-success-600 
                              rounded-full flex items-center justify-center shadow-lg shadow-success-500/30">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                        <p className="text-gray-500 mb-6">Your cleaning has been scheduled</p>

                        {/* Booking ID */}
                        <div className="card bg-gradient-to-br from-primary-50 to-teal-50 border-0 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                            <p className="text-2xl font-bold text-primary-600 font-mono">
                                {bookingResult?.id}
                            </p>
                        </div>

                        {/* Booking summary */}
                        <div className="card text-left mb-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedHouse?.name}</p>
                                        <p className="text-sm text-gray-500">{selectedHouse?.address.street}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedService?.name}</p>
                                        {selectedAddOns.length > 0 && (
                                            <p className="text-sm text-gray-500">
                                                + {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        {selectedDates.map((dateStr) => {
                                            const date = new Date(dateStr + 'T12:00:00');
                                            const slots = dateSlots[dateStr] || [];
                                            return (
                                                <p key={dateStr} className="text-sm">
                                                    <span className="font-medium text-gray-900">{formatDate(date)}</span>
                                                    <span className="text-gray-500">
                                                        {' - '}
                                                        {slots.map(s => TIME_SLOTS.find(t => t.id === s)?.label).join(', ')}
                                                    </span>
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="font-medium text-gray-900">Amount Paid</span>
                                    <span className="text-xl font-bold text-primary-600">
                                        ${(pricing?.total ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                            Finding your perfect cleaner...
                        </p>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={onComplete}
                                className="btn btn-primary w-full py-4"
                            >
                                View My Bookings
                            </button>

                            <button
                                onClick={onBack}
                                className="btn btn-ghost w-full"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                );

            default:
                console.error('Invalid step value:', step);
                return (
                    <div className="animate-fade-in text-center py-12">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-error-500" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-500 mb-6">Invalid step: {step}</p>
                        <button
                            onClick={() => setStep(1)}
                            className="btn btn-primary"
                        >
                            Start Over
                        </button>
                    </div>
                );
        }
    };

    // Total steps
    const totalSteps = 6;
    const stepLabels = ['Property', 'Service', 'Add-ons', 'Schedule', 'Notes', 'Payment'];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            {step < 7 && (
                <div className="app-bar">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={step > 1 ? () => setStep(step - 1) : onBack}
                            className="btn-ghost p-2 -ml-2 rounded-xl"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold">New Booking</h1>
                        <div className="w-10" />
                    </div>

                    {/* Progress */}
                    <div className="px-4 pb-3">
                        <div className="flex gap-1">
                            {Array.from({ length: totalSteps }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 h-1 rounded-full transition-colors ${idx + 1 <= step ? 'bg-primary-500' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Step {step} of {totalSteps}: {stepLabels[step - 1]}
                        </p>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto pb-32">
                {(() => {
                    try {
                        const content = renderStep();
                        if (content === null) {
                            console.error('renderStep returned null for step:', step);
                            return (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-error-500" />
                                    <p className="text-gray-600">Unable to render step {step}</p>
                                    <button onClick={() => setStep(1)} className="btn btn-primary mt-4">
                                        Restart
                                    </button>
                                </div>
                            );
                        }
                        return content;
                    } catch (err) {
                        console.error('Error rendering step:', step, err);
                        return (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-error-500" />
                                <p className="text-gray-600">Error: {err.message}</p>
                                <button onClick={() => setStep(1)} className="btn btn-primary mt-4">
                                    Restart
                                </button>
                            </div>
                        );
                    }
                })()}
            </div>

            {/* Footer */}
            {step < 7 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
                    {/* Price preview */}
                    {pricing && step >= 2 && step < 6 && (
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-sm text-gray-500">Estimated total</span>
                            <span className="text-lg font-bold text-primary-600">
                                ${pricing.total.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {step < 6 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="btn btn-primary w-full py-4"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !canProceed()}
                            className="btn btn-primary w-full py-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Processing Payment...
                                </>
                            ) : (
                                `Pay $${(pricing?.total ?? 0).toFixed(2)}`
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
