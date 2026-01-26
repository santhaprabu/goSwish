import { useState } from 'react';
import {
    User, Camera, Star, MapPin, Clock, Briefcase, Award,
    ChevronRight, ChevronLeft, Edit2, Plus, Trash2, Check,
    Shield, Calendar, DollarSign, Languages, Wrench, Image
} from 'lucide-react';

// Mock cleaner profile data
const mockCleanerProfile = {
    id: 'cleaner-001',
    userId: 'user-001',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '(214) 555-0123',
    photoURL: null,
    headline: 'Professional Home Cleaner with 5+ Years Experience',
    bio: 'Passionate about creating spotless, healthy living spaces. I take pride in my attention to detail and always go the extra mile for my clients.',
    experience: '5+ years',
    rating: 4.9,
    reviewCount: 156,
    completedJobs: 423,
    responseTime: '< 1 hour',
    joinedDate: '2024-03-15',
    verified: true,
    backgroundCheckDate: '2024-03-20',
    // Specialties
    specialties: ['Deep Cleaning', 'Move-In/Out', 'Pet-Friendly', 'Eco Products', 'Organization'],
    // Languages
    languages: ['English', 'Spanish'],
    // Service area
    serviceArea: {
        baseLocation: '1234 Main St, Dallas, TX 75201',
        radius: 25, // miles
        cities: ['Dallas', 'Fort Worth', 'Plano', 'Irving']
    },
    // Availability
    availability: {
        monday: { available: true, slots: ['morning', 'afternoon'] },
        tuesday: { available: true, slots: ['morning', 'afternoon', 'evening'] },
        wednesday: { available: true, slots: ['morning', 'afternoon'] },
        thursday: { available: false, slots: [] },
        friday: { available: true, slots: ['morning', 'afternoon', 'evening'] },
        saturday: { available: true, slots: ['morning'] },
        sunday: { available: false, slots: [] }
    },
    // Certifications
    certifications: [
        { name: 'ISSA Cleaning Professional', date: '2024-01' },
        { name: 'Green Cleaning Certified', date: '2023-06' }
    ],
    // Portfolio
    portfolio: [
        { id: 'port-1', url: null, caption: 'Kitchen transformation' },
        { id: 'port-2', url: null, caption: 'Living room deep clean' },
        { id: 'port-3', url: null, caption: 'Bathroom sparkle' }
    ],
    // Stats
    stats: {
        onTimeRate: 98,
        repeatClients: 72,
        avgJobRating: 4.9,
        totalEarnings: 68420
    }
};

const specialtyOptions = [
    'Deep Cleaning', 'Regular Cleaning', 'Move-In/Out', 'Pet-Friendly',
    'Eco Products', 'Organization', 'Laundry', 'Window Cleaning',
    'Carpet Cleaning', 'Post-Construction'
];

const languageOptions = [
    'English', 'Spanish', 'French', 'Mandarin', 'Vietnamese',
    'Arabic', 'Portuguese', 'Korean', 'Hindi', 'Tagalog'
];

export default function CleanerProfileEnhanced({ onBack, onEdit }) {
    const [profile, setProfile] = useState(mockCleanerProfile);
    const [activeSection, setActiveSection] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const handleSaveField = (field) => {
        setProfile(prev => ({ ...prev, [field]: tempValue }));
        setEditingField(null);
    };

    const toggleSpecialty = (specialty) => {
        setProfile(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty]
        }));
    };

    const toggleLanguage = (language) => {
        setProfile(prev => ({
            ...prev,
            languages: prev.languages.includes(language)
                ? prev.languages.filter(l => l !== language)
                : [...prev.languages, language]
        }));
    };

    // Section editing views
    if (activeSection === 'specialties') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setActiveSection(null)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Edit Specialties</h1>
                    <button onClick={() => setActiveSection(null)} className="p-2 text-secondary-600 font-medium">
                        Done
                    </button>
                </div>

                <div className="px-6 py-6">
                    <p className="text-sm text-gray-500 mb-4">Select your areas of expertise (max 6)</p>
                    <div className="space-y-2">
                        {specialtyOptions.map(specialty => (
                            <button
                                key={specialty}
                                onClick={() => toggleSpecialty(specialty)}
                                disabled={!profile.specialties.includes(specialty) && profile.specialties.length >= 6}
                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                                    ${profile.specialties.includes(specialty)
                                        ? 'border-secondary-500 bg-secondary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                    ${!profile.specialties.includes(specialty) && profile.specialties.length >= 6 ? 'opacity-50' : ''}`}
                            >
                                <span className={`font-medium ${profile.specialties.includes(specialty) ? 'text-secondary-700' : 'text-gray-900'}`}>
                                    {specialty}
                                </span>
                                {profile.specialties.includes(specialty) && (
                                    <Check className="w-5 h-5 text-secondary-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (activeSection === 'languages') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setActiveSection(null)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Languages</h1>
                    <button onClick={() => setActiveSection(null)} className="p-2 text-secondary-600 font-medium">
                        Done
                    </button>
                </div>

                <div className="px-6 py-6">
                    <p className="text-sm text-gray-500 mb-4">Select languages you can communicate in</p>
                    <div className="space-y-2">
                        {languageOptions.map(language => (
                            <button
                                key={language}
                                onClick={() => toggleLanguage(language)}
                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                                    ${profile.languages.includes(language)
                                        ? 'border-secondary-500 bg-secondary-50'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className={`font-medium ${profile.languages.includes(language) ? 'text-secondary-700' : 'text-gray-900'}`}>
                                    {language}
                                </span>
                                {profile.languages.includes(language) && (
                                    <Check className="w-5 h-5 text-secondary-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (activeSection === 'portfolio') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                <div className="app-bar">
                    <button onClick={() => setActiveSection(null)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">Portfolio</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6 py-6">
                    <p className="text-sm text-gray-500 mb-4">Showcase your best work to attract more clients</p>

                    <div className="grid grid-cols-2 gap-3">
                        {profile.portfolio.map((item, i) => (
                            <div key={item.id} className="relative">
                                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                                    {item.url ? (
                                        <img src={item.url} alt="" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <Image className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">{item.caption}</p>
                                <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm">
                                    <Trash2 className="w-4 h-4 text-error-500" />
                                </button>
                            </div>
                        ))}

                        {/* Add new */}
                        <button className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-secondary-400 hover:bg-secondary-50 transition-colors">
                            <Plus className="w-8 h-8 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add Photo</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="app-bar">
                <button onClick={onBack} className="p-2">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">My Profile</h1>
                <button onClick={onEdit} className="p-2">
                    <Edit2 className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Profile Header */}
            <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-6 pt-6 pb-12">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg">
                            <Camera className="w-4 h-4 text-secondary-600" />
                        </button>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{profile.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-current text-yellow-400" />
                                <span className="font-semibold">{profile.rating}</span>
                            </div>
                            <span className="text-white/60">•</span>
                            <span className="text-white/80">{profile.reviewCount} reviews</span>
                        </div>
                        {profile.verified && (
                            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                <Shield className="w-3 h-3" />
                                Verified
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 -mt-6">
                <div className="card grid grid-cols-4 divide-x divide-gray-100">
                    <div className="p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{profile.completedJobs}</p>
                        <p className="text-xs text-gray-500">Jobs</p>
                    </div>
                    <div className="p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{profile.stats.onTimeRate}%</p>
                        <p className="text-xs text-gray-500">On Time</p>
                    </div>
                    <div className="p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{profile.stats.repeatClients}%</p>
                        <p className="text-xs text-gray-500">Repeat</p>
                    </div>
                    <div className="p-3 text-center">
                        <p className="text-lg font-bold text-secondary-600">${Math.round(profile.stats.totalEarnings / 1000)}k</p>
                        <p className="text-xs text-gray-500">Earned</p>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="px-6 mt-6">
                <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                    <p className="text-sm text-gray-600 mb-3">{profile.headline}</p>
                    <p className="text-sm text-gray-500">{profile.bio}</p>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{profile.experience}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{profile.responseTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Specialties */}
            <div className="px-6 mt-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Specialties</h3>
                        <button onClick={() => setActiveSection('specialties')} className="text-secondary-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.specialties.map(specialty => (
                            <span key={specialty} className="px-3 py-1.5 bg-secondary-50 text-secondary-700 rounded-full text-sm">
                                {specialty}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Languages */}
            <div className="px-6 mt-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Languages</h3>
                        <button onClick={() => setActiveSection('languages')} className="text-secondary-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{profile.languages.join(', ')}</span>
                    </div>
                </div>
            </div>

            {/* Service Area */}
            <div className="px-6 mt-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Service Area</h3>
                        <button className="text-secondary-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-gray-700">{profile.serviceArea.baseLocation}</p>
                                <p className="text-sm text-gray-500">{profile.serviceArea.radius} mile radius</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {profile.serviceArea.cities.map(city => (
                                <span key={city} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    {city}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Certifications */}
            <div className="px-6 mt-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Certifications</h3>
                        <button className="text-secondary-600">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    {profile.certifications.length > 0 ? (
                        <div className="space-y-3">
                            {profile.certifications.map((cert, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Award className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{cert.name}</p>
                                        <p className="text-xs text-gray-500">Earned {cert.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Add certifications to stand out</p>
                    )}
                </div>
            </div>

            {/* Portfolio */}
            <div className="px-6 mt-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Portfolio</h3>
                        <button onClick={() => setActiveSection('portfolio')} className="text-secondary-600 text-sm font-medium">
                            Manage
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {profile.portfolio.map((item) => (
                            <div key={item.id} className="w-24 flex-shrink-0">
                                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                    {item.url ? (
                                        <img src={item.url} alt="" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Image className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => setActiveSection('portfolio')}
                            className="w-24 flex-shrink-0 aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                        >
                            <Plus className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Verification Status */}
            <div className="px-6 mt-4">
                <div className="card p-6 bg-success-50 border-success-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                            <Shield className="w-6 h-6 text-success-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-success-900">Background Verified</h3>
                            <p className="text-sm text-success-700">
                                Last verified: {profile.backgroundCheckDate}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
