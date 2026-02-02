import { useState, useRef, useEffect } from 'react';
/*
 * ============================================================================
 * REUSABLE OTP INPUT
 * ============================================================================
 * 
 * Purpose:
 * A polished, auto-focusing multi-box input for 6-digit codes.
 * 
 * Features:
 * - Auto-focus next box on type.
 * - Backspace support (move to prev).
 * - Paste support (fills all boxes).
 */

/**
 * Premium OTP Input Component
 * Features:
 * - Individual boxes for each digit
 * - Auto-focus on next box
 * - Backspace handling
 * - Paste handling
 * - Error state support
 * - Smooth animations
 */
export default function OTPInput({ length = 6, value, onChange, disabled, error }) {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const inputs = useRef([]);

    // Sync external value with local state
    useEffect(() => {
        if (value !== undefined) {
            const newOtp = value.split('').slice(0, length);
            setOtp([...newOtp, ...new Array(length - newOtp.length).fill('')]);
        }
    }, [value, length]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        // Only take the last character if multiple are entered (handled by paste separately)
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        const combined = newOtp.join('');
        onChange(combined);

        // Move to next input if value is entered
        if (val && index < length - 1) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current is empty, move to previous and delete that
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
                inputs.current[index - 1].focus();
            } else {
                // Just delete current
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        if (isNaN(data)) return;

        const pastedData = data.split('').slice(0, length);
        const newOtp = [...pastedData, ...new Array(length - pastedData.length).fill('')].slice(0, length);

        setOtp(newOtp);
        onChange(newOtp.join(''));

        // Focus the last input or the one after the last pasted digit
        const lastIndex = Math.min(pastedData.length, length - 1);
        inputs.current[lastIndex].focus();
    };

    return (
        <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`
                        w-10 h-14 sm:w-12 sm:h-16 
                        flex items-center justify-center text-center 
                        text-2xl font-bold rounded-xl border-2 transition-all duration-200
                        ${digit ? 'border-black bg-white shadow-md' : 'border-gray-200 bg-gray-50'}
                        ${error ? 'border-red-500 bg-red-50 text-red-600' : 'focus:border-black focus:ring-2 focus:ring-black/5'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                        outline-none
                    `}
                />
            ))}
        </div>
    );
}
