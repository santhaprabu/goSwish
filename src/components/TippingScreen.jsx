import { useState } from 'react';
import { DollarSign, Star, Heart, ThumbsUp, X } from 'lucide-react';

// Tipping Screen - After job approval
export default function TippingScreen({ job, cleaner, onComplete, onSkip }) {
    const [tipAmount, setTipAmount] = useState(null);
    const [customTip, setCustomTip] = useState('');
    const [processing, setProcessing] = useState(false);

    const jobTotal = job.pricingBreakdown?.total || 0;
    const suggestedTips = [
        { label: '10%', amount: Math.round(jobTotal * 0.1) },
        { label: '15%', amount: Math.round(jobTotal * 0.15) },
        { label: '20%', amount: Math.round(jobTotal * 0.20) },
    ];

    const handleSelectTip = (amount) => {
        setTipAmount(amount);
        setCustomTip('');
    };

    const handleCustomTip = (value) => {
        setCustomTip(value);
        const amount = parseFloat(value);
        if (!isNaN(amount) && amount > 0) {
            setTipAmount(amount);
        } else {
            setTipAmount(null);
        }
    };

    const handleConfirmTip = async () => {
        if (!tipAmount || tipAmount <= 0) return;

        setProcessing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProcessing(false);
        onComplete(tipAmount);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="app-bar">
                <button onClick={onSkip} className="p-2">
                    <X className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Add a Tip</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 px-6 py-6 space-y-6">
                {/* Cleaner Info */}
                <div className="text-center">
                    <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        {cleaner.photoURL ? (
                            <img
                                src={cleaner.photoURL}
                                alt={cleaner.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-secondary-600">
                                {cleaner.name?.charAt(0)}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{cleaner.name}</h2>
                    <div className="flex items-center justify-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(cleaner.rating || 5)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                            />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">
                            {cleaner.rating || 5.0}
                        </span>
                    </div>
                    <p className="text-gray-600">
                        Show your appreciation for great work!
                    </p>
                </div>

                {/* Suggested Tips */}
                <div>
                    <label className="label mb-3">Suggested Tips</label>
                    <div className="grid grid-cols-3 gap-3">
                        {suggestedTips.map((tip) => (
                            <button
                                key={tip.label}
                                onClick={() => handleSelectTip(tip.amount)}
                                className={`p-4 rounded-xl border-2 transition-all
                  ${tipAmount === tip.amount && !customTip
                                        ? 'border-secondary-500 bg-secondary-50'
                                        : 'border-gray-200 hover:border-secondary-300'
                                    }`}
                            >
                                <p className="text-sm text-gray-500 mb-1">{tip.label}</p>
                                <p className="text-lg font-bold text-gray-900">${tip.amount}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Tip */}
                <div>
                    <label className="label mb-2">Custom Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                            $
                        </span>
                        <input
                            type="number"
                            value={customTip}
                            onChange={(e) => handleCustomTip(e.target.value)}
                            placeholder="0"
                            className="input pl-8 text-lg"
                            min="0"
                            step="1"
                        />
                    </div>
                </div>

                {/* Quick Messages */}
                <div>
                    <label className="label mb-3">Quick Message (Optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-secondary-300 transition-all text-left">
                            <ThumbsUp className="w-5 h-5 text-secondary-600 mb-1" />
                            <p className="text-sm font-medium text-gray-900">Great job!</p>
                        </button>
                        <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-secondary-300 transition-all text-left">
                            <Star className="w-5 h-5 text-yellow-500 mb-1" />
                            <p className="text-sm font-medium text-gray-900">Excellent work</p>
                        </button>
                        <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-secondary-300 transition-all text-left">
                            <Heart className="w-5 h-5 text-error-500 mb-1" />
                            <p className="text-sm font-medium text-gray-900">Thank you!</p>
                        </button>
                        <button className="p-3 rounded-lg border-2 border-gray-200 hover:border-secondary-300 transition-all text-left">
                            <DollarSign className="w-5 h-5 text-success-600 mb-1" />
                            <p className="text-sm font-medium text-gray-900">Worth every penny</p>
                        </button>
                    </div>
                </div>

                {/* Job Summary */}
                <div className="card p-4 bg-gray-50">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Service Total</span>
                        <span className="font-medium text-gray-900">${jobTotal.toFixed(2)}</span>
                    </div>
                    {tipAmount > 0 && (
                        <>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Tip</span>
                                <span className="font-medium text-secondary-600">
                                    ${tipAmount.toFixed(2)}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-gray-900">
                                        ${(jobTotal + tipAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe space-y-3">
                <button
                    onClick={handleConfirmTip}
                    disabled={!tipAmount || tipAmount <= 0 || processing}
                    className="btn btn-secondary w-full py-4"
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        `Add $${tipAmount || 0} Tip`
                    )}
                </button>

                <button
                    onClick={onSkip}
                    className="btn btn-ghost w-full"
                >
                    Skip for Now
                </button>
            </div>
        </div>
    );
}
