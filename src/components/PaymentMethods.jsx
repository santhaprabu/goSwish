
import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, ChevronLeft, CheckCircle2, Wallet, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Stripe Key from User
const STRIPE_KEY = 'pk_test_51QhLFoLAEV3Gm6SGlZotiAKqIC5G4nzcETJxRMf10G7zHAT3DKuLSvaiSn8ODOEAqPjUHYWLib23L7LW8MP95UdX00P19pkU7A';

export default function PaymentMethods({ onBack }) {
    const { user } = useApp();
    const [cards, setCards] = useState([
        { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true },
        { id: '2', brand: 'mastercard', last4: '8899', expMonth: 10, expYear: 2027, isDefault: false }
    ]);
    const [showAddForm, setShowAddForm] = useState(false);

    // Stripe State
    const [stripeObj, setStripeObj] = useState(null);
    const [cardElement, setCardElement] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    const handleDelete = (id) => {
        setCards(cards.filter(c => c.id !== id));
    };

    const handleSetDefault = (id) => {
        setCards(cards.map(c => ({
            ...c,
            isDefault: c.id === id
        })));
    };

    const handleCardAdded = (newCard) => {
        setCards([...cards, { ...newCard, isDefault: cards.length === 0 }]);
        setShowAddForm(false);
    };

    // Initialize Stripe when form opens
    useEffect(() => {
        if (showAddForm) {
            if (window.Stripe) {
                const stripe = window.Stripe(STRIPE_KEY);
                setStripeObj(stripe);
                const elements = stripe.elements();
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

                // Wait for DOM
                setTimeout(() => {
                    if (document.getElementById('card-element-pm')) {
                        card.mount('#card-element-pm');
                        setCardElement(card);
                        card.on('change', (event) => {
                            setError(event.error ? event.error.message : null);
                        });
                    }
                }, 100);
            } else {
                setError("Stripe failed to load. Check internet connection.");
            }
        }

        return () => {
            if (cardElement) {
                cardElement.destroy();
                setCardElement(null);
            }
        };
    }, [showAddForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripeObj || !cardElement) return;

        setLoading(true);
        setError(null);

        const { error: stripeError, paymentMethod } = await stripeObj.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: name,
            },
        });

        if (stripeError) {
            setError(stripeError.message);
            setLoading(false);
        } else {
            console.log('[PaymentMethod Success]', paymentMethod);
            handleCardAdded({
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
                isDefault: false
            });
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setCardElement(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="app-bar">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="btn-ghost p-2 -ml-2 rounded-xl">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Payment Methods</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="flex-1 px-6 py-6">
                {!showAddForm ? (
                    <div className="space-y-6">
                        {/* Cards List */}
                        <div className="space-y-4">
                            {cards.map((card) => (
                                <div key={card.id} className="card relative overflow-hidden group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center uppercase font-bold text-xs text-gray-500">
                                                {card.brand}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">
                                                    {card.brand} ending in {card.last4}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                                                </p>
                                            </div>
                                        </div>

                                        {card.isDefault ? (
                                            <span className="badge badge-primary text-xs">Default</span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(card.id)}
                                                className="text-sm text-gray-400 hover:text-primary-600 font-medium"
                                            >
                                                Set Default
                                            </button>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end pt-2 border-t border-gray-50">
                                        <button
                                            onClick={() => handleDelete(card.id)}
                                            className="p-2 text-gray-400 hover:text-error-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add New Button */}
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl
                                     flex items-center justify-center gap-2 text-gray-500
                                     hover:border-primary-300 hover:text-primary-500 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Add Payment Method</span>
                        </button>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                            <div className="mt-0.5">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <p>
                                Payments are secured by Stripe.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Add Card Form (Vanilla Stripe)
                    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                        <div className="card space-y-4">
                            <div>
                                <label className="label">Card Details</label>
                                <div className="p-3 border border-gray-200 rounded-xl bg-white">
                                    <div id="card-element-pm" style={{ minHeight: '40px' }} />
                                </div>
                            </div>

                            <div>
                                <label className="label">Cardholder Name</label>
                                <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="input pl-12"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex-1"
                                disabled={!stripeObj || loading}
                            >
                                {loading ? 'Processing...' : 'Add Card'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
