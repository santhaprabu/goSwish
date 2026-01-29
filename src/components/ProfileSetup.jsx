import { useState, useEffect } from 'react';
import {
    User, Phone, Camera, ArrowLeft, Check, Loader2,
    AlertCircle, X, ImagePlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// US phone format validation
function formatPhoneNumber(value) {
    const phone = value.replace(/\D/g, '');
    if (phone.length < 4) return phone;
    if (phone.length < 7) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
}

function isValidName(name) {
    return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
}

export default function ProfileSetup({ onBack, onComplete, isEditing = false }) {
    const { user, updateUser, selectedRole } = useApp();

    const [firstName, setFirstName] = useState(user?.profile?.firstName || user?.firstName || user?.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user?.profile?.lastName || user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
    const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || user?.profile?.phone || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || user?.profile?.photoURL || null);
    const [photoFile, setPhotoFile] = useState(null);

    const [address, setAddress] = useState({
        street: user?.location?.street || '',
        city: user?.location?.city || '',
        state: user?.location?.state || '',
        zipcode: user?.location?.zipcode || ''
    });

    const [loading, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [firstNameTouched, setFirstNameTouched] = useState(false);
    const [lastNameTouched, setLastNameTouched] = useState(false);
    const [phoneTouched, setPhoneTouched] = useState(false);

    const firstNameValid = isValidName(firstName);
    const lastNameValid = isValidName(lastName);
    const phoneValid = isValidPhone(phone);
    const isCustomer = selectedRole === 'homeowner';

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB before compression)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be less than 5MB');
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURL(reader.result);
                setPhotoFile(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstNameValid || !lastNameValid) {
            setError('Please enter valid first and last names (2-50 characters, letters/spaces only)');
            return;
        }

        if (phone && !phoneValid) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setSaving(true);

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await updateUser({
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim(),
                phoneNumber: phone,
                photoURL,
                isProfileComplete: true,
                location: !isCustomer ? address : user?.location
            });

            setSuccess(true);

            setTimeout(() => {
                onComplete?.();
            }, 1000);
        } catch (err) {
            setError('Failed to save profile. Please try again.');
        }

        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="app-bar">
                <div className="flex items-center justify-between px-4 py-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="btn-ghost p-2 -ml-2 rounded-xl"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className="text-lg font-semibold">
                        {isEditing ? 'Edit Profile' : 'Complete Your Profile'}
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
                {/* Success message */}
                {success && (
                    <div className="mb-6 p-4 bg-success-50 border border-success-100 rounded-xl flex items-center gap-3 animate-slide-up">
                        <Check className="w-5 h-5 text-success-500" />
                        <p className="text-sm text-success-600 font-medium">Profile saved successfully!</p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-error-50 border border-error-100 rounded-xl flex items-start gap-3 animate-slide-up">
                        <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-error-600">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto">
                            <X className="w-4 h-4 text-error-400" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 
                              ${isCustomer ? 'border-primary-100' : 'border-secondary-100'}
                              shadow-lg`}>
                                {photoURL ? (
                                    <img
                                        src={photoURL}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center
                                   ${isCustomer ? 'bg-primary-50' : 'bg-secondary-50'}`}>
                                        <User className={`w-12 h-12 ${isCustomer ? 'text-primary-300' : 'text-secondary-300'}`} />
                                    </div>
                                )}
                            </div>

                            <label className={`absolute bottom-0 right-0 w-10 h-10 rounded-full 
                                 ${isCustomer
                                    ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                                    : 'bg-gradient-to-br from-secondary-500 to-secondary-600'}
                                 flex items-center justify-center cursor-pointer
                                 shadow-lg hover:scale-105 active:scale-95 transition-transform`}>
                                <Camera className="w-5 h-5 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">Tap to add photo</p>
                    </div>

                    {/* First and Last Name */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onBlur={() => setFirstNameTouched(true)}
                                className={`input-field ${firstNameTouched && !firstNameValid && firstName.length > 0 ? 'input-error' : ''} ${firstNameTouched && firstNameValid ? 'input-success' : ''}`}
                                placeholder="John"
                                maxLength={50}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onBlur={() => setLastNameTouched(true)}
                                className={`input-field ${lastNameTouched && !lastNameValid && lastName.length > 0 ? 'input-error' : ''} ${lastNameTouched && lastNameValid ? 'input-success' : ''}`}
                                placeholder="Doe"
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                onBlur={() => setPhoneTouched(true)}
                                className={`input-field pl-12 ${phoneTouched && phone.length > 0 && !phoneValid ? 'input-error' : ''
                                    } ${phoneTouched && phoneValid ? 'input-success' : ''}`}
                                placeholder="(555) 123-4567"
                                maxLength={14}
                            />
                        </div>
                        {phoneTouched && phone.length > 0 && !phoneValid && (
                            <p className="mt-1.5 text-sm text-error-500">
                                Please enter a valid 10-digit phone number
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">US format: (XXX) XXX-XXXX</p>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                    </div>

                    {!isCustomer && (
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <h3 className="font-bold text-gray-900">Professional Address</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                                <input
                                    type="text"
                                    value={address.street}
                                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                    className="input-field"
                                    placeholder="123 Main St"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="input-field"
                                        placeholder="Dallas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="input-field"
                                        placeholder="TX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                                <input
                                    type="text"
                                    value={address.zipcode}
                                    onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                                    className="input-field"
                                    placeholder="75201"
                                />
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-safe">
                <button
                    onClick={handleSubmit}
                    disabled={loading || !firstNameValid || !lastNameValid || (!isCustomer && (!address.street || !address.city || !address.state || !address.zipcode))}
                    className={`btn w-full py-4 ${isCustomer ? 'btn-primary' : 'btn-secondary'}`}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isEditing ? (
                        'Save Changes'
                    ) : (
                        'Continue'
                    )}
                </button>
            </div>
        </div>
    );
}
