
import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Home, Sparkles, Calendar, Clock, CreditCard,
    CheckCircle2, Loader2, Plus, Check, X, ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { validatePromoCode } from '../storage';

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

export default function BookingFlowNew({ onBack, onComplete }) {
    const { user, updateUser, getUserHouses, serviceTypes, addOns, createBooking, findEligibleCleaners } = useApp();

    // Current step (1-6)
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
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
    const [selectedPaymentOption, setSelectedPaymentOption] = useState('new'); // 'new' or cardId
    const [saveCardForFuture, setSaveCardForFuture] = useState(true);

    // Promo Code
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState({ type: null, value: 0 });
    const [promoMessage, setPromoMessage] = useState(null);
    const [promoError, setPromoError] = useState(null);

    // Load houses and saved cards
    useEffect(() => {
        async function loadData() {
            try {
                const housesData = await getUserHouses();
                setHouses(housesData || []);
                if (housesData && housesData.length > 0) {
                    const defaultHouse = housesData.find(h => h.isDefault) || housesData[0];
                    setSelectedHouseId(defaultHouse.id);
                }

                if (user?.paymentMethods && user.paymentMethods.length > 0) {
                    setSavedCards(user.paymentMethods);
                    // Default to first saved card
                    setSelectedPaymentOption(user.paymentMethods.find(c => c.isDefault)?.id || user.paymentMethods[0].id);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        loadData();
    }, [getUserHouses, user]);

    // Initialize Stripe when on Step 6
    useEffect(() => {
        if (step === 6) {
            // Check if Stripe is loaded
            if (window.Stripe && !stripeObj) {
                const stripe = window.Stripe(STRIPE_KEY);
                setStripeObj(stripe);
            } else if (!window.Stripe) {
                setCardError("Stripe failed to load. Please refresh the page.");
            }
        }
    }, [step, stripeObj]);

    // Mount Stripe card element when "new" payment option is selected
    useEffect(() => {
        if (step === 6 && selectedPaymentOption === 'new' && stripeObj && !cardElement) {
            const elements = stripeObj.elements();
            const card = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });

            // Mount to div with a slight delay to ensure DOM is ready
            setTimeout(() => {
                const mountPoint = document.getElementById('card-element-mount');
                if (mountPoint && !mountPoint.hasChildNodes()) {
                    card.mount('#card-element-mount');
                    setCardElement(card);

                    card.on('change', (event) => {
                        if (event.error) {
                            setCardError(event.error.message);
                        } else {
                            setCardError(null);
                        }
                    });
                }
            }, 100);
        }
    }, [step, selectedPaymentOption, stripeObj, cardElement]);

    // Cleanup Stripe
    useEffect(() => {
        return () => {
            if (cardElement) {
                cardElement.destroy();
            }
        };
    }, [cardElement]);

    // Get selected data
    const selectedHouse = houses.find(h => h.id === selectedHouseId);
    const selectedService = serviceTypes.find(s => s.id === selectedServiceId);
    const selectedAddOnsData = addOns.filter(a => selectedAddOnIds.includes(a.id));

    // Calculate price
    const calculateTotal = () => {
        if (!selectedHouse || !selectedService) return 0;

        let total = (selectedHouse.size || selectedHouse.sqft || 0) * selectedService.rate;

        selectedAddOnsData.forEach(addon => {
            total += addon.price;
        });

        // Apply Discount
        let discountAmount = 0;
        if (discount.type === 'percent') {
            discountAmount = total * (discount.value / 100);
        } else if (discount.type === 'fixed') {
            discountAmount = Math.min(total, discount.value);
        }
        total -= discountAmount;

        const tax = total * 0.08;
        return { total: total + tax, subtotal: total + discountAmount, discountAmount, tax };
    };

    const handleApplyPromo = async () => {
        setPromoError(null);
        setPromoMessage(null);
        const code = promoCode.trim().toUpperCase();

        if (!code) return;

        try {
            setLoading(true);
            // Calculate subtotal for validation (before existing discount)
            const houseSize = selectedHouse.size || selectedHouse.sqft || 0;
            const currentSubtotal = houseSize * selectedService.rate +
                selectedAddOnsData.reduce((sum, a) => sum + a.price, 0);

            const result = await validatePromoCode(code, user?.uid, selectedServiceId, currentSubtotal);

            if (result.valid) {
                setDiscount({
                    type: result.promo.type,
                    value: result.promo.value,
                    code: result.promo.code
                });
                setPromoMessage(`${result.promo.description || 'Discount'} applied!`);
            } else {
                setDiscount({ type: null, value: 0 });
                setPromoError(result.error);
            }
        } catch (error) {
            console.error('Promo validation error:', error);
            setPromoError('Failed to validate promo code');
        } finally {
            setLoading(false);
        }
    };

    // Calendar helpers
    const getDaysInMonth = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const days = [];

        // Add empty cells
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(currentYear, currentMonth, d));
        }

        return days;
    };

    const isPastDate = (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // Navigation
    const canContinue = () => {
        switch (step) {
            case 1: return !!selectedHouseId;
            case 2: return !!selectedServiceId;
            case 3: return true; // Add-ons optional
            case 4: return !!selectedDate && !!selectedTimeSlot;
            case 5: return true; // Notes optional
            case 6:
                // For payment: either saved card selected, or new card with Stripe ready
                if (selectedPaymentOption === 'new') {
                    return !!stripeObj; // Just check if Stripe is loaded, card element can load on demand
                }
                return !!selectedPaymentOption; // Saved card selected
            default: return false;
        }
    };

    const handleNext = () => {
        if (canContinue() && step < 6) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            onBack();
        }
    };

    const handleSubmit = async () => {
        console.log('Payment submit clicked', {
            selectedPaymentOption,
            hasStripe: !!stripeObj,
            hasCardElement: !!cardElement
        });

        // If new card selected, we need stripeObj and cardElement
        if (selectedPaymentOption === 'new' && (!stripeObj || !cardElement)) {
            const errorMsg = !stripeObj
                ? 'Stripe is still loading. Please wait a moment and try again.'
                : 'Card form is loading. Please wait a moment and try again.';
            setCardError(errorMsg);
            console.error('Payment validation failed:', errorMsg);
            return;
        }

        try {
            setLoading(true);
            setCardError(null);

            let paymentMethodId = selectedPaymentOption;

            // Handle New Customer Card
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

                // Save for future?
                if (saveCardForFuture && (savedCards?.length || 0) < 2) {
                    const newCard = {
                        id: paymentMethod.id,
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        expMonth: paymentMethod.card.exp_month,
                        expYear: paymentMethod.card.exp_year,
                        isDefault: false
                    };
                    const updatedCards = [...savedCards, newCard];
                    // Save to user profile
                    await updateUser({ paymentMethods: updatedCards });
                }
                console.log('Payment Success (New):', paymentMethod);
            } else {
                console.log('Payment Success (Saved):', paymentMethodId);
            }

            const booking = await createBooking({
                houseId: selectedHouseId,
                serviceTypeId: selectedServiceId,
                addOnIds: selectedAddOnIds,
                dates: [selectedDate],
                timeSlots: { [selectedDate]: [selectedTimeSlot] },
                specialNotes: notes,
                totalAmount: calculateTotal().total,
                discount: discount
            });

            // Store the created booking for confirmation screen
            setCreatedBooking(booking);

            // Fetch eligible cleaners to show who was notified
            try {
                const eligible = await findEligibleCleaners(selectedHouseId, selectedServiceId);
                setNotifiedCleaners(eligible || []);
            } catch (err) {
                console.warn('Failed to fetch notified cleaners', err);
            }

            setStep(7); // Confirmation
            // Removed auto-redirect so user can see the notified cleaners table

        } catch (error) {
            console.error('Booking error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                error: error
            });
            // Show detailed error message
            const errorMessage = error.message || 'Payment failed processing. Please try again.';
            setCardError(`Payment failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Render current step
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Select Property</h2>
                        <p className="text-gray-500">Choose which property needs cleaning</p>

                        {houses.map(house => (
                            <button
                                key={house.id}
                                onClick={() => setSelectedHouseId(house.id)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedHouseId === house.id
                                    ? 'border-teal-600 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Home className="w-6 h-6" />
                                    <div className="flex-1">
                                        <div className="font-bold">{house.name}</div>
                                        <div className="text-sm text-gray-500">{house.address.street}</div>
                                        <div className="text-sm text-gray-400">{house.size || house.sqft} sqft</div>
                                    </div>
                                    {selectedHouseId === house.id && (
                                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Choose Service</h2>
                        <p className="text-gray-500">Select the type of cleaning</p>

                        {serviceTypes.map(service => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedServiceId(service.id)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedServiceId === service.id
                                    ? 'border-teal-600 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6" />
                                    <div className="flex-1">
                                        <div className="font-bold">{service.name}</div>
                                        <div className="text-sm text-gray-500">{service.description}</div>
                                    </div>
                                    {selectedServiceId === service.id && (
                                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                    )}
                                </div>
                            </button>
                        ))}


                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Add-On Services</h2>
                        <p className="text-gray-500">Optional extras (tap to select)</p>

                        {addOns.map(addon => {
                            const isSelected = selectedAddOnIds.includes(addon.id);
                            return (
                                <button
                                    key={addon.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedAddOnIds(selectedAddOnIds.filter(id => id !== addon.id));
                                        } else {
                                            setSelectedAddOnIds([...selectedAddOnIds, addon.id]);
                                        }
                                    }}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Plus className="w-6 h-6" />
                                        <div className="flex-1">
                                            <div className="font-bold">{addon.name}</div>
                                            <div className="text-sm text-green-600 font-semibold">
                                                +${addon.price}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-6 h-6 text-green-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case 4:
                const calendarDays = getDaysInMonth();
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Pick Date & Time</h2>
                        <p className="text-gray-500">Select your preferred date and time</p>

                        {/* Calendar */}
                        <div className="bg-white rounded-xl border p-4">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => {
                                        if (currentMonth === 0) {
                                            setCurrentMonth(11);
                                            setCurrentYear(currentYear - 1);
                                        } else {
                                            setCurrentMonth(currentMonth - 1);
                                        }
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="font-bold">
                                    {MONTHS[currentMonth]} {currentYear}
                                </div>
                                <button
                                    onClick={() => {
                                        if (currentMonth === 11) {
                                            setCurrentMonth(0);
                                            setCurrentYear(currentYear + 1);
                                        } else {
                                            setCurrentMonth(currentMonth + 1);
                                        }
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS.map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
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
                                            className={`p-2 text-center rounded-lg ${isPast
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-teal-600 text-white font-bold'
                                                    : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div className="space-y-2">
                                <div className="font-semibold">Select time slot</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {TIME_SLOTS.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedTimeSlot(slot.id)}
                                            className={`p-3 rounded-lg text-center ${selectedTimeSlot === slot.id
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="text-lg mb-1">{slot.icon}</div>
                                            <div className="text-sm font-bold">{slot.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Special Instructions</h2>
                        <p className="text-gray-500">Any special notes for your cleaner? (optional)</p>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-4 border-2 border-gray-200 rounded-xl min-h-[150px] focus:border-teal-600 focus:outline-none"
                            placeholder="E.g., Please focus on the kitchen, avoid the nursery, etc."
                        />

                        <div className="flex flex-wrap gap-2">
                            {['Focus on bathrooms', 'Pet-friendly products', 'Eco-friendly only', 'Key under mat', 'Don\'t ring doorbell', 'Trash out', 'Change bed linens', 'Call upon arrival'].map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => setNotes(notes ? `${notes}\n• ${suggestion}` : `• ${suggestion}`)}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200"
                                >
                                    + {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 6:
                const { total, subtotal, discountAmount, tax } = calculateTotal();
                const canSaveNewCard = (savedCards?.length || 0) < 2;

                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Payment</h2>
                        <p className="text-gray-500">Complete your booking with Stripe</p>

                        {/* General Error Display */}
                        {cardError && selectedPaymentOption !== 'new' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {cardError}
                            </div>
                        )}

                        {/* Promo Code */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    placeholder="Promo Code (e.g. SAVE10)"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-600 uppercase"
                                />
                                {promoMessage && <p className="text-green-600 text-xs mt-1 absolute -bottom-5">{promoMessage}</p>}
                                {promoError && <p className="text-red-500 text-xs mt-1 absolute -bottom-5">{promoError}</p>}
                            </div>
                            <button
                                onClick={handleApplyPromo}
                                className="px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
                            >
                                Apply
                            </button>
                        </div>
                        <div className="h-4"></div>

                        {/* Summary */}
                        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {selectedAddOnsData.length > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Add-ons</span>
                                    <span className="font-medium">
                                        ${selectedAddOnsData.reduce((sum, a) => sum + a.price, 0).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax & fees (8%)</span>
                                <span className="font-medium">${tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-bold">Total</span>
                                <span className="text-2xl font-bold text-teal-700">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900 mt-4">Payment Method</h3>

                            {/* Saved Cards */}
                            {savedCards.map(card => (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedPaymentOption(card.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${selectedPaymentOption === card.id
                                        ? 'border-teal-600 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-100'
                                        }`}
                                >
                                    {(() => {
                                        const b = (card.brand || '').toLowerCase();
                                        if (b === 'visa') return (
                                            <div className="w-10 h-7 bg-[#1A1F71] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[10px] font-black italic text-white tracking-tight leading-none">VISA</span>
                                            </div>
                                        );
                                        if (b === 'mastercard') return (
                                            <div className="w-10 h-7 bg-[#252525] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <div className="flex -space-x-1.5">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]"></div>
                                                    <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]"></div>
                                                </div>
                                            </div>
                                        );
                                        if (b === 'amex') return (
                                            <div className="w-10 h-7 bg-[#006FCF] rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-[8px] font-bold text-white leading-none text-center">AM<br />EX</span>
                                            </div>
                                        );
                                        return (
                                            <div className="w-10 h-7 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center flex-shrink-0">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                            </div>
                                        );
                                    })()}
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">•••• {card.last4}</div>
                                        <div className="text-xs text-gray-500">Expires {card.expMonth}/{card.expYear}</div>
                                    </div>
                                    {selectedPaymentOption === card.id && (
                                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                                    )}
                                </button>
                            ))}

                            {/* New Card Option */}
                            <button
                                onClick={() => setSelectedPaymentOption('new')}
                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${selectedPaymentOption === 'new'
                                    ? 'border-teal-600 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-100'
                                    }`}
                            >
                                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className="font-bold text-gray-900">Add New Card</span>
                                {selectedPaymentOption === 'new' && (
                                    <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto" />
                                )}
                            </button>

                            {/* Stripe Element (Only if 'new' selected) */}
                            {selectedPaymentOption === 'new' && (
                                <div className="space-y-3 animate-fade-in pl-1">
                                    <div className="p-4 border-2 border-gray-200 rounded-lg bg-white">
                                        <div id="card-element-mount" style={{ minHeight: '40px' }} />
                                    </div>

                                    {/* Save Card Checkbox */}
                                    {canSaveNewCard && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={saveCardForFuture}
                                                onChange={(e) => setSaveCardForFuture(e.target.checked)}
                                                className="checkbox checkbox-sm checkbox-primary rounded"
                                            />
                                            <span className="text-sm text-gray-600">Save card for future bookings</span>
                                        </label>
                                    )}
                                    {!canSaveNewCard && (
                                        <p className="text-xs text-gray-400 italic">
                                            You have reached the limit of 2 saved cards. Manage them in your Profile.
                                        </p>
                                    )}

                                    {cardError && (
                                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                                            {cardError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                        <p className="text-gray-500">Your cleaning has been scheduled</p>
                        <div className="p-4 bg-teal-50 rounded-xl">
                            <div className="text-sm text-gray-600">Booking ID</div>
                            <div className="text-xl font-bold text-teal-700">{createdBooking?.bookingId || 'Generating...'}</div>
                        </div>

                        {/* Notified Cleaners Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-6">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 text-sm">Notified Cleaners</h3>
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                    {notifiedCleaners.length} Sent
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-400 font-medium border-b border-gray-50">
                                            <th className="px-4 py-3 font-medium">Cleaner</th>
                                            <th className="px-4 py-3 font-medium">Distance</th>
                                            <th className="px-4 py-3 font-medium">Rating</th>
                                            <th className="px-4 py-3 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {notifiedCleaners.length > 0 ? (
                                            notifiedCleaners.map((cleaner) => (
                                                <tr key={cleaner.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold overflow-hidden">
                                                                {cleaner.photoURL ? (
                                                                    <img src={cleaner.photoURL} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    cleaner.name?.[0] || 'C'
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{cleaner.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-600">
                                                        {cleaner.distance ? `${cleaner.distance} mi` : '--'}
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                            <span>{cleaner.stats?.rating || 'New'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">
                                                            Notified
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">
                                                    Broadcasting to all cleaners in your area...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                            Waiting for a cleaner to accept...
                        </p>

                        <button
                            onClick={() => onComplete(null)} // Pass null or booking if needed
                            className="btn btn-primary w-full mt-6"
                        >
                            View My Bookings
                        </button>
                    </div>
                );

            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            {step < 7 && (
                <div className="bg-white border-b px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold">New Booking</h1>
                        <div className="w-10" />
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div
                                key={i}
                                className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-teal-600' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        Step {step} of 6: {['Property', 'Service', 'Add-ons', 'Schedule', 'Notes', 'Payment'][step - 1]}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto pb-24">
                {renderStep()}
            </div>

            {/* Footer */}
            {step < 7 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                    {step < 6 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canContinue()}
                            className="w-full py-4 bg-teal-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !canContinue()}
                            className="w-full py-4 bg-teal-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Pay $${calculateTotal().total.toFixed(2)}`
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
