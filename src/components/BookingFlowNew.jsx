
import { useState, useEffect, useRef, useMemo } from 'react';
/*
 * ============================================================================
 * BOOKING FLOW WIZARD (New V2)
 * ============================================================================
 * 
 * Purpose:
 * An optimized, step-by-step wizard for creating jobs.
 * 
 * Key Improvements over V1:
 * - Better state persistence between steps.
 * - Enhanced UI for Add-on selection.
 * - Integrated Payment method management (Stripe).
 * 
 * Steps:
 * 1. Select Property
 * 2. Select Service
 * 3. Add-ons
 * 4. Schedule
 * 5. Notes
 * 6. Payment
 */
/**
 * ============================================================================
 * BOOKING FLOW WIZARD
 * ============================================================================
 * 
 * Purpose:
 * This component guides the user through the 6-step process of creating a job.
 * 
 * Steps:
 * 1. Select Property (Where?)
 * 2. Select Service (What type?)
 * 3. Add-ons (Extras)
 * 4. Schedule (When?)
 * 5. Notes (Instructions)
 * 6. Payment (Stripe Integration)
 * 
 * DATA FLOW:
 * We collect partial state in local `useState` hooks. 
 * Only on Step 6 (Payment Success) do we call `createBooking()` to commit data to DB.
 * 
 * STRIPE INTEGRATION:
 * This component directly mounts Stripe Elements for PCI compliance.
 */
import {
    ArrowLeft, Home, Sparkles, Calendar, Clock, CreditCard,
    CheckCircle2, Loader2, Plus, Check, X, ChevronLeft, ChevronRight,
    Star, Info, MapPin, Shield, Zap, Coffee, SprayCan, Grid3X3
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Stripe Key
const STRIPE_KEY = 'pk_test_51QhLFoLAEV3Gm6SGlZotiAKqIC5G4nzcETJxRMf10G7zHAT3DKuLSvaiSn8ODOEAqPjUHYWLib23L7LW8MP95UdX00P19pkU7A';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
    { id: 'morning', label: 'Morning', time: '9 AM - 12 PM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12 PM - 3 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '3 PM - 6 PM', icon: '🌆' },
];

const serviceIcons = {
    Sparkles: Sparkles,
    SprayCan: SprayCan,
    Home: Home,
    Grid3X3: Grid3X3
};

export default function BookingFlowNew({ onBack, onComplete, initialHouseId }) {
    const {
        user, updateUser, getUserHouses, serviceTypes, addOns,
        createBooking, findEligibleCleaners, metroMultipliers,
        calculatePrice, validatePromoCode
    } = useApp();

    // Current step (1-6)
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [priceDetails, setPriceDetails] = useState(null);
    const [notifiedCleaners, setNotifiedCleaners] = useState([]);
    const [createdBooking, setCreatedBooking] = useState(null);

    // Step 1: Property
    const [houses, setHouses] = useState([]);
    const [selectedHouseId, setSelectedHouseId] = useState('');

    // Step 2: Service
    const [selectedServiceId, setSelectedServiceId] = useState('');

    // Step 3: Add-ons  
    const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);

    // Step 4: Date/Time
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Step 5: Notes
    const [notes, setNotes] = useState('');

    // Step 6: Payment
    const [cardError, setCardError] = useState(null);
    const [stripeObj, setStripeObj] = useState(null);
    const [cardElement, setCardElement] = useState(null);
    const [savedCards, setSavedCards] = useState([]);
    const [selectedPaymentOption, setSelectedPaymentOption] = useState('new');
    const [saveCardForFuture, setSaveCardForFuture] = useState(true);

    // Promo Code
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState(null);

    // Flag to handle initial house selection only once
    const initialSelectionDone = useRef(false);

    // Load houses and saved cards
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setLoading(true);
            try {
                const housesData = await getUserHouses();
                setHouses(housesData || []);
                if (isMounted) {
                    if (housesData && housesData.length > 0) {
                        const defaultHouse = housesData.find(h => h.isDefault) || housesData[0];

                        // Use initialHouseId if provided and selection not yet done
                        if (initialHouseId && !initialSelectionDone.current) {
                            setSelectedHouseId(initialHouseId);
                            setStep(2); // Jump to Step 2
                            initialSelectionDone.current = true;
                        } else {
                            setSelectedHouseId(defaultHouse.id);
                        }
                    }

                    if (user?.paymentMethods && user.paymentMethods.length > 0) {
                        setSavedCards(user.paymentMethods);
                        setSelectedPaymentOption(user.paymentMethods.find(c => c.isDefault)?.id || user.paymentMethods[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        loadData();

        return () => {
            isMounted = false;
        };
    }, [getUserHouses, user, initialHouseId]);

    // Update price details whenever selection changes
    useEffect(() => {
        const updatePrice = async () => {
            if (selectedHouseId && selectedServiceId) {
                const result = await calculatePrice(
                    selectedHouseId,
                    selectedServiceId,
                    selectedAddOnIds,
                    promoCode
                );
                setPriceDetails(result);
            } else {
                setPriceDetails(null);
            }
        };
        updatePrice();
    }, [selectedHouseId, selectedServiceId, selectedAddOnIds, promoCode, calculatePrice]);

    // Initialize Stripe when on Step 6
    useEffect(() => {
        if (step === 6) {
            if (window.Stripe && !stripeObj) {
                setStripeObj(window.Stripe(STRIPE_KEY));
            } else if (!window.Stripe) {
                setCardError("Stripe failed to load. Please refresh the page.");
            }
        }
    }, [step, stripeObj]);

    // Mount Stripe card element
    useEffect(() => {
        if (step === 6 && selectedPaymentOption === 'new' && stripeObj && !cardElement) {
            const elements = stripeObj.elements();
            const card = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#111827',
                        '::placeholder': { color: '#9ca3af' },
                    },
                    invalid: { color: '#ef4444' },
                },
            });

            setTimeout(() => {
                const mountPoint = document.getElementById('card-element-mount');
                if (mountPoint && !mountPoint.hasChildNodes()) {
                    card.mount('#card-element-mount');
                    setCardElement(card);
                    card.on('change', (event) => setCardError(event.error ? event.error.message : null));
                }
            }, 100);
        }
    }, [step, selectedPaymentOption, stripeObj, cardElement]);

    // Cleanup
    useEffect(() => {
        return () => { if (cardElement) cardElement.destroy(); };
    }, [cardElement]);

    const selectedHouse = useMemo(() => houses.find(h => h.id === selectedHouseId), [houses, selectedHouseId]);
    const selectedService = useMemo(() => serviceTypes.find(s => s.id === selectedServiceId), [serviceTypes, selectedServiceId]);

    // Navigation
    const handleNext = () => {
        if (step < 6) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else onBack();
    };

    const handleSubmit = async () => {
        if (selectedPaymentOption === 'new' && (!stripeObj || !cardElement)) return;

        setLoading(true);
        setCardError(null);

        try {
            let paymentMethodId = selectedPaymentOption;

            if (selectedPaymentOption === 'new') {
                const { error, paymentMethod } = await stripeObj.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (error) {
                    setCardError(error.message);
                    setLoading(false);
                    return;
                }

                paymentMethodId = paymentMethod.id;

                if (saveCardForFuture && (savedCards?.length || 0) < 5) {
                    const newCard = {
                        id: paymentMethod.id,
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        expMonth: paymentMethod.card.exp_month,
                        expYear: paymentMethod.card.exp_year,
                    };
                    await updateUser({ paymentMethods: [...savedCards, newCard] });
                }
            }

            const booking = await createBooking({
                houseId: selectedHouseId,
                serviceTypeId: selectedServiceId,
                addOnIds: selectedAddOnIds,
                dates: [selectedDate],
                timeSlots: { [selectedDate]: [selectedTimeSlot] },
                specialNotes: notes,
                totalAmount: priceDetails?.total || 0,
                pricingBreakdown: priceDetails,
                discount: priceDetails?.promoDiscount ? { type: priceDetails.promoDetails.type, value: priceDetails.promoDetails.value, code: promoCode } : null
            });

            setCreatedBooking(booking);

            try {
                const eligible = await findEligibleCleaners(selectedHouseId, selectedServiceId);
                setNotifiedCleaners(eligible || []);
            } catch (err) { console.warn(err); }

            setStep(7);
        } catch (error) {
            setCardError(error.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(currentYear, currentMonth, d));
        return days;
    };

    const isPastDate = (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Where should we clean?</h3>
                            <p className="text-sm text-gray-500">Pick a property from your list</p>
                        </div>
                        {houses.map(house => (
                            <button
                                key={house.id}
                                onClick={() => setSelectedHouseId(house.id)}
                                className={`w-full card text-left border-2 transition-all flex items-center gap-4 ${selectedHouseId === house.id ? 'border-secondary-500 bg-secondary-50/50 shadow-md' : 'border-transparent'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedHouseId === house.id ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    <Home className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900">{house.name}</h4>
                                    <p className="text-xs text-gray-500">{house.address.street}, {house.address.city}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">
                                            {house.sqft || house.size} sqft
                                        </span>
                                        {house.petInfo && house.petInfo !== 'No pets' && (
                                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                🐾 {house.petInfo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedHouseId === house.id && <CheckCircle2 className="w-6 h-6 text-secondary-500" />}
                            </button>
                        ))}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Select Service</h3>
                            <p className="text-sm text-gray-500">Choose the best cleaning for your needs</p>
                        </div>
                        {serviceTypes.map(service => {
                            const Icon = serviceIcons[service.icon] || Sparkles;
                            const isSelected = selectedServiceId === service.id;

                            // ESTIMATE CALCULATION (CRITICAL FIX)
                            const estimate = (() => {
                                if (!selectedHouse) return null;
                                const size = Number(selectedHouse.sqft || selectedHouse.size || 0);
                                if (size <= 0) return null;

                                const rate = Number(service.rate || 0);
                                let base = size * rate;

                                // Metro multiplier
                                const city = selectedHouse.address?.city;
                                const multiplier = (metroMultipliers && city) ? (metroMultipliers[city] || 1.0) : 1.0;
                                base *= multiplier;

                                // Pet fee
                                const hasPets = selectedHouse.pets?.hasPets || (selectedHouse.petInfo && selectedHouse.petInfo !== 'No pets');
                                if (hasPets) base += 10;

                                // Round UP to nearest 10
                                return Math.ceil(base / 10) * 10;
                            })();

                            return (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedServiceId(service.id)}
                                    className={`w-full card text-left border-2 transition-all ${isSelected ? 'border-secondary-500 bg-secondary-50/50 shadow-md' : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900">{service.name}</h4>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-lg font-bold text-secondary-600">
                                                            {estimate ? `$${estimate}` : `$${service.rate}/sqft`}
                                                        </span>
                                                        {estimate && (
                                                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter whitespace-nowrap">
                                                                FOR {selectedHouse?.sqft || selectedHouse?.size} SQFT
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed mb-3">{service.description}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {service.includes.slice(0, 3).map((item, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{item}</span>
                                                ))}
                                                {service.includes.length > 3 && (
                                                    <span className="text-[10px] text-secondary-600 font-medium">+{service.includes.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {selectedServiceId && (
                            <div className="p-4 bg-gray-100 rounded-xl flex items-start gap-3 mt-4 border border-gray-200">
                                <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Prices include a professional equipment fee and represent a base estimate for a {selectedHouse?.sqft || selectedHouse?.size} sqft home in {selectedHouse?.address?.city}. Final price confirmed at checkout.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Custom Add-ons</h3>
                            <p className="text-sm text-gray-500">Add specialized tasks to your cleaning</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {addOns.map(addon => {
                                const isSelected = selectedAddOnIds.includes(addon.id);
                                return (
                                    <button
                                        key={addon.id}
                                        onClick={() => {
                                            if (isSelected) setSelectedAddOnIds(selectedAddOnIds.filter(id => id !== addon.id));
                                            else setSelectedAddOnIds([...selectedAddOnIds, addon.id]);
                                        }}
                                        className={`p-4 rounded-2xl text-left transition-all border-2 flex flex-col items-center text-center gap-3 h-full ${isSelected ? 'border-secondary-500 bg-secondary-50/50 shadow-md' : 'border-gray-100 bg-white'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-secondary-500 text-white' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            <Plus className={`w-6 h-6 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="font-bold text-xs text-gray-900 leading-tight mb-1">{addon.name}</div>
                                            <div className="text-secondary-600 font-black text-sm">
                                                +${(() => {
                                                    const rawPrice = addon.rate && selectedHouse
                                                        ? Number(selectedHouse.sqft || selectedHouse.size || 0) * addon.rate
                                                        : addon.price;
                                                    return Math.ceil(rawPrice / 10) * 10;
                                                })()}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 4:
                const calendarDays = getDaysInMonth();
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-2">
                            <h3 className="text-xl font-bold text-gray-900">Schedule</h3>
                            <p className="text-sm text-gray-500 text-center">We clean when you're busy living</p>
                        </div>

                        <div className="bg-white rounded-3xl border-2 border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={() => {
                                    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                                    else setCurrentMonth(currentMonth - 1);
                                }} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="font-black text-gray-900 text-lg">{MONTHS[currentMonth]} {currentYear}</div>
                                <button onClick={() => {
                                    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                                    else setCurrentMonth(currentMonth + 1);
                                }} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS.map(day => <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase">{day}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((date, idx) => {
                                    if (!date) return <div key={idx} />;
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isPast = isPastDate(date);
                                    const isSelected = selectedDate === dateStr;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isPast && setSelectedDate(dateStr)}
                                            disabled={isPast}
                                            className={`h-11 flex items-center justify-center rounded-2xl text-sm font-bold transition-all ${isPast ? 'text-gray-200 cursor-not-allowed' :
                                                isSelected ? 'bg-secondary-500 text-white shadow-lg scale-110' : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedDate && (
                            <div className="space-y-3 animate-slide-up">
                                <div className="font-bold text-gray-900 ml-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-secondary-500" /> Preferred Arrival Window
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {TIME_SLOTS.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedTimeSlot(slot.id)}
                                            className={`p-3 rounded-2xl text-center border-2 transition-all ${selectedTimeSlot === slot.id ? 'border-secondary-500 bg-secondary-50/50 shadow-md' : 'border-gray-100 bg-white'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{slot.icon}</div>
                                            <div className="text-xs font-black text-gray-900 mb-0.5">{slot.label}</div>
                                            <div className="text-[9px] text-gray-500 font-medium whitespace-nowrap">{slot.time}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Notes & Special Request</h3>
                            <p className="text-sm text-gray-500">Provide details to help your cleaner</p>
                        </div>
                        <div className="relative">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-5 bg-white border-2 border-gray-100 rounded-3xl min-h-[160px] focus:border-secondary-500 focus:outline-none shadow-sm transition-all text-sm leading-relaxed"
                                placeholder="E.g. Focus on the kitchen, our dog stays in the garage, gate code is 1234..."
                            />
                            <div className="absolute top-4 right-4 text-gray-300">
                                <Zap className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {[
                                { t: 'Focus on bathrooms', i: '🚿' },
                                { t: 'Pet-friendly products', i: '🌿' },
                                { t: 'Key under mat', i: '🔑' },
                                { t: 'Don\'t ring doorbell', i: '🤫' },
                                { t: 'Change linens', i: '🛌' },
                                { t: 'Trash out', i: '🗑️' }
                            ].map(obj => (
                                <button
                                    key={obj.t}
                                    onClick={() => setNotes(notes ? `${notes}\n• ${obj.t}` : `• ${obj.t}`)}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs rounded-full hover:border-secondary-500 hover:text-secondary-600 transition-all font-medium flex items-center gap-2"
                                >
                                    <span>{obj.i}</span> {obj.t}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6 animate-fade-in pb-20">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">Final Summary</h3>
                            <p className="text-sm text-gray-500">Review and confirm your booking</p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-white rounded-3xl border-2 border-gray-50 shadow-md overflow-hidden">
                            <div className="p-5 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-black text-gray-900">{selectedService?.name}</div>
                                    <div className="bg-secondary-100 text-secondary-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        Estimated
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                                    <MapPin className="w-3 h-3" /> {selectedHouse?.address.street} • {selectedHouse?.sqft || selectedHouse?.size} sqft
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                                    <Calendar className="w-3 h-3" /> {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Date'} • {TIME_SLOTS.find(s => s.id === selectedTimeSlot)?.time}
                                </div>
                            </div>

                            <div className="p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Base Price</span>
                                    <span className="text-gray-900 font-bold">${priceDetails?.base.toFixed(2)}</span>
                                </div>

                                {priceDetails?.addOnDetails?.map((addon, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">{addon.name}</span>
                                        <span className="text-gray-900 font-bold">+${addon.price.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                        Taxes & Fees <Info className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-gray-900 font-bold">${priceDetails?.taxes.toFixed(2)}</span>
                                </div>

                                {priceDetails?.promoDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-secondary-600 bg-secondary-50 px-3 py-2 rounded-xl border border-secondary-100">
                                        <span className="font-bold flex items-center gap-2"><Zap className="w-4 h-4" /> Promo Code Applied</span>
                                        <span className="font-black">-${priceDetails.promoDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Pay</div>
                                        <div className="text-3xl font-black text-gray-900 mt-1">${priceDetails?.total.toFixed(2)}</div>
                                    </div>
                                    <Shield className="w-10 h-10 text-secondary-100 -mb-2" />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-gray-900">Payment Method</h4>
                                <button onClick={() => setSelectedPaymentOption('new')} className="text-xs font-bold text-secondary-600">+ Add Card</button>
                            </div>

                            {savedCards.map(card => (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedPaymentOption(card.id)}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${selectedPaymentOption === card.id ? 'border-secondary-500 bg-secondary-50/30' : 'border-gray-50 bg-white'
                                        }`}
                                >
                                    <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-[8px] font-black text-white italic tracking-tighter">
                                        {card.brand?.toUpperCase() || 'CARD'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-black text-gray-900 text-sm">•••• {card.last4}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Expires {card.expMonth}/{card.expYear}</div>
                                    </div>
                                    {selectedPaymentOption === card.id && <CheckCircle2 className="w-5 h-5 text-secondary-500" />}
                                </button>
                            ))}

                            <button
                                onClick={() => setSelectedPaymentOption('new')}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${selectedPaymentOption === 'new' ? 'border-secondary-500 bg-secondary-50/30' : 'border-gray-50 bg-white'
                                    }`}
                            >
                                <div className="w-12 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-gray-900 text-sm">Add New Payment</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Credit or Debit Card</div>
                                </div>
                                {selectedPaymentOption === 'new' && <CheckCircle2 className="w-5 h-5 text-secondary-500" />}
                            </button>

                            {selectedPaymentOption === 'new' && (
                                <div className="p-5 border-2 border-gray-100 rounded-3xl bg-white shadow-inner animate-slide-up">
                                    <div id="card-element-mount" className="mb-4" />
                                    {cardError && (
                                        <div className="text-[10px] font-bold text-error-500 bg-error-50 px-3 py-2 rounded-lg flex items-center gap-2">
                                            <X className="w-3 h-3" /> {cardError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Promo Input */}
                        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100">
                            <input
                                type="text"
                                placeholder="PROMO CODE"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="flex-1 px-4 py-2 text-sm font-black focus:outline-none"
                            />
                            <button className="bg-gray-900 text-white text-[10px] px-4 py-2 rounded-xl font-black active:scale-95 transition-transform uppercase">Apply</button>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="text-center py-12 animate-fade-in px-6">
                        <div className="w-24 h-24 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce-soft">
                            <Check className="w-12 h-12 stroke-[4px]" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">You're all set!</h2>
                        <p className="text-gray-500 text-sm mb-12">We've notified the top cleaners in your area. They will confirm your request shortly.</p>

                        <div className="bg-gray-900 rounded-3xl p-8 text-white text-left relative overflow-hidden shadow-2xl mb-12">
                            <div className="relative z-10">
                                <div className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-4">Confirmation ID</div>
                                <div className="text-3xl font-black mb-6 tracking-tighter">{createdBooking?.bookingId || 'SW-9283-X'}</div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-secondary-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="text-xs font-bold">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-secondary-400">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div className="text-xs font-bold">{notifiedCleaners.length} qualified cleaners reached</div>
                                    </div>
                                </div>
                            </div>
                            <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                        </div>

                        {notifiedCleaners.length > 0 && (
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden mb-12">
                                <h4 className="text-left font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-secondary-500" /> Vetted Cleaners Notified
                                </h4>
                                <div className="space-y-4">
                                    {notifiedCleaners.slice(0, 3).map(cleaner => (
                                        <div key={cleaner.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-white group-hover:border-secondary-500 transition-colors">
                                                    {cleaner.photoURL ? (
                                                        <img src={cleaner.photoURL} alt={cleaner.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Star className="w-5 h-5 text-amber-400" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-xs font-black text-gray-900">{cleaner.name || 'Professional Cleaner'}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold">{cleaner.distance} miles away • {cleaner.rating || '5.0'} ★</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-600">
                                                <Zap className="w-3 h-3 animate-pulse" /> Notified
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onComplete}
                            className="w-full btn btn-primary py-4 text-sm font-black tracking-widest uppercase"
                        >
                            View My Bookings
                        </button>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            {step < 7 && (
                <div className="p-4 flex items-center gap-4 bg-white border-b border-gray-100 pt-safe relative z-10">
                    <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-90">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <div className="flex-1 text-center">
                        <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Step {step} of 6</h2>
                        <div className="h-1.5 w-32 bg-gray-100 rounded-full mx-auto mt-2 overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-500 rounded-full"
                                style={{ width: `${(step / 6) * 100}%` }}
                            />
                        </div>
                    </div>
                    <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth pb-32 no-scrollbar">
                <div className="max-w-md mx-auto">
                    {renderStep()}
                </div>
            </div>

            {/* Sticky Actions */}
            {step < 7 && (
                <div className="p-4 bg-white border-t border-gray-100 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
                    <div className="max-w-md mx-auto flex items-center gap-4">
                        {step === 6 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || (selectedPaymentOption === 'new' && (!stripeObj || !cardElement))}
                                className={`flex-1 btn btn-secondary h-14 text-sm font-black tracking-widest uppercase flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                {loading ? 'Processing...' : 'Secure Booking'}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && !selectedHouseId) ||
                                    (step === 2 && !selectedServiceId) ||
                                    (step === 4 && (!selectedDate || !selectedTimeSlot))
                                }
                                className={`flex-1 btn btn-primary h-14 text-sm font-black tracking-widest uppercase ${((step === 1 && !selectedHouseId) || (step === 2 && !selectedServiceId) || (step === 4 && (!selectedDate || !selectedTimeSlot)))
                                    ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'
                                    }`}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
