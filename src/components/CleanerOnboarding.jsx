import { useState } from 'react';
/*
 * ============================================================================
 * CLEANER ONBOARDING WIZARD
 * ============================================================================
 * 
 * Purpose:
 * Forces new cleaners to complete a profile before accessing the dashboard.
 * 
 * Steps:
 * 1. Profile (Bio, Experience, Languages)
 * 2. Photo (Face detection placeholder)
 * 3. Location (Service Radius logic)
 * 4. Availability (Weekly schedule)
 * 5. Verification (Mock SSN/Background check)
 * 6. Bank (Stripe Connect placeholder)
 * 
 * Logic:
 * Uses `useApp().updateUser()` to save progress incrementally.
 */
import { useApp } from '../context/AppContext';
import {
  User, Camera, MapPin, Calendar, Shield, DollarSign,
  Check, Lock, ChevronRight, Upload, Loader2
} from 'lucide-react';

// Cleaner Onboarding with 6-step checklist
export default function CleanerOnboarding({ onComplete }) {
  const { user, updateUser } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [profile, setProfile] = useState({
    headline: '',
    bio: '',
    yearsExperience: '',
    specialties: [],
    languages: []
  });

  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    serviceRadius: 15
  });
  const [availability, setAvailability] = useState({
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false }
  });
  const [backgroundCheck, setBackgroundCheck] = useState({
    fullName: user?.name || '',
    dob: '',
    ssn: '',
    consent: false
  });

  // Onboarding status
  const [onboardingStatus, setOnboardingStatus] = useState({
    profileComplete: false,
    photoUploaded: false,
    locationSet: false,
    availabilitySet: false,
    backgroundCheckComplete: false,
    bankConnected: false
  });

  const specialtiesOptions = [
    'Deep Cleaning',
    'Move-Out Cleaning',
    'Pet-Friendly Homes',
    'Eco-Friendly Products',
    'Post-Construction',
    'Organizing',
    'Laundry Services',
    'Window Cleaning'
  ];

  const languagesOptions = [
    'English',
    'Spanish',
    'French',
    'Mandarin',
    'Vietnamese',
    'Korean',
    'Arabic',
    'Portuguese'
  ];

  const steps = [
    { id: 1, name: 'Profile', icon: User, status: onboardingStatus.profileComplete },
    { id: 2, name: 'Photo', icon: Camera, status: onboardingStatus.photoUploaded },
    { id: 3, name: 'Location', icon: MapPin, status: onboardingStatus.locationSet },
    { id: 4, name: 'Availability', icon: Calendar, status: onboardingStatus.availabilitySet },
    { id: 5, name: 'Verification', icon: Shield, status: onboardingStatus.backgroundCheckComplete },
    { id: 6, name: 'Bank Account', icon: DollarSign, status: onboardingStatus.bankConnected }
  ];

  const completedSteps = steps.filter(s => s.status).length;
  const progress = (completedSteps / steps.length) * 100;

  // Handle profile form
  const handleProfileSubmit = () => {
    if (profile.headline && profile.bio && profile.yearsExperience &&
      profile.specialties.length > 0 && profile.languages.length > 0) {
      setOnboardingStatus(prev => ({ ...prev, profileComplete: true }));
      setCurrentStep(2);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      // Simulate upload
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhoto(reader.result);
          setOnboardingStatus(prev => ({ ...prev, photoUploaded: true }));
          setUploading(false);
          setCurrentStep(3);
        };
        reader.readAsDataURL(file);
      }, 1500);
    }
  };

  // Handle location
  const handleLocationSubmit = () => {
    if (location.street && location.city && location.state && location.zipcode) {
      setOnboardingStatus(prev => ({ ...prev, locationSet: true }));
      setCurrentStep(4);
    }
  };

  // Handle availability
  const toggleAvailability = (day, slot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot]
      }
    }));
  };

  const handleAvailabilitySubmit = () => {
    const hasAvailability = Object.values(availability).some(day =>
      day.morning || day.afternoon || day.evening
    );
    if (hasAvailability) {
      setOnboardingStatus(prev => ({ ...prev, availabilitySet: true }));
      setCurrentStep(5);
    }
  };

  // Handle background check
  const handleBackgroundCheckSubmit = () => {
    if (backgroundCheck.fullName && backgroundCheck.dob &&
      backgroundCheck.ssn && backgroundCheck.consent) {
      setOnboardingStatus(prev => ({ ...prev, backgroundCheckComplete: true }));
      // Simulate background check submission
      updateUser({
        uid: user.uid,
        cleanerStatus: 'pending',
        verificationStatus: 'pending'
      });
      setCurrentStep(6);
    }
  };

  // Handle bank connection
  const handleBankConnect = () => {
    setOnboardingStatus(prev => ({ ...prev, bankConnected: true }));
    // Complete onboarding
    updateUser({
      uid: user.uid,
      cleanerProfile: {
        ...profile,
        photo,
        location,
        availability
      },
      onboardingComplete: true
    });
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // Render checklist view
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-center">Get Started</h1>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {completedSteps} of {steps.length} complete
              </span>
              <span className="text-sm font-medium text-primary-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLocked = index > 0 && !steps[index - 1].status;
              const canStart = index === 0 || steps[index - 1].status;

              return (
                <button
                  key={step.id}
                  onClick={() => canStart && setCurrentStep(step.id)}
                  disabled={isLocked}
                  className={`w-full card p-4 flex items-center gap-4 transition-all
                    ${step.status ? 'bg-success-50 border-success-200' : ''}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
                  `}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center
                    ${step.status ? 'bg-success-500 text-white' :
                      isLocked ? 'bg-gray-200 text-gray-400' : 'bg-primary-100 text-primary-600'}
                  `}>
                    {step.status ? (
                      <Check className="w-6 h-6" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${step.status ? 'text-success-900' : 'text-gray-900'}`}>
                      {step.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {step.status ? 'Complete' :
                        isLocked ? `Complete ${steps[index - 1].name} first` : 'Not started'}
                    </p>
                  </div>

                  {!step.status && !isLocked && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Completion message */}
          {completedSteps === steps.length && (
            <div className="mt-6 card p-6 bg-gradient-to-br from-success-50 to-primary-50 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">
                Ready to Accept Jobs!
              </h3>
              <p className="text-gray-600 mb-4">
                You've completed all onboarding steps. Start earning today!
              </p>
              <button onClick={onComplete} className="btn btn-primary">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Profile
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Create Profile</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <p className="text-gray-600 mb-6">
              Tell customers about your experience and expertise
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Professional Headline</label>
                <input
                  type="text"
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  placeholder="e.g., Experienced Deep Cleaner - 5+ years"
                  className="input"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{profile.headline.length}/60</p>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Share your experience, approach, and what makes you great..."
                  className="input min-h-[120px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{profile.bio.length}/500</p>
              </div>

              <div>
                <label className="label">Years of Experience</label>
                <select
                  value={profile.yearsExperience}
                  onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="<1">Less than 1 year</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div>
                <label className="label">Specialties</label>
                <div className="grid grid-cols-2 gap-2">
                  {specialtiesOptions.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          specialties: prev.specialties.includes(specialty)
                            ? prev.specialties.filter(s => s !== specialty)
                            : [...prev.specialties, specialty]
                        }));
                      }}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                        ${profile.specialties.includes(specialty)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-primary-200'
                        }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Languages Spoken</label>
                <div className="grid grid-cols-2 gap-2">
                  {languagesOptions.map(language => (
                    <button
                      key={language}
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          languages: prev.languages.includes(language)
                            ? prev.languages.filter(l => l !== language)
                            : [...prev.languages, language]
                        }));
                      }}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                        ${profile.languages.includes(language)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-primary-200'
                        }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleProfileSubmit}
            disabled={!profile.headline || !profile.bio || !profile.yearsExperience ||
              profile.specialties.length === 0 || profile.languages.length === 0}
            className="btn btn-primary w-full"
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Photo
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Professional Photo</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">
              Upload a clear, friendly photo
            </p>
            <p className="text-sm text-gray-500">
              Customers love to see who's coming!
            </p>
          </div>

          <div className="card p-8 text-center">
            {photo ? (
              <div className="space-y-4">
                <img
                  src={photo}
                  alt="Profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary-100"
                />
                <p className="text-success-600 font-medium">Photo uploaded!</p>
                <label className="btn btn-ghost inline-flex items-center gap-2 cursor-pointer">
                  <Camera className="w-5 h-5" />
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-full mx-auto bg-gray-100 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                  ) : (
                    <Camera className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="btn btn-primary inline-flex items-center gap-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>✓ Face clearly visible</p>
                  <p>✓ Professional appearance</p>
                  <p>✓ Good lighting</p>
                </div>
              </div>
            )}
          </div>

          {photo && (
            <button
              onClick={() => setCurrentStep(0)}
              className="btn btn-primary w-full mt-6"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Location & Service Radius
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Location & Radius</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="label">Street Address</label>
              <input
                type="text"
                value={location.street}
                onChange={(e) => setLocation({ ...location, street: e.target.value })}
                placeholder="123 Main St"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  placeholder="Dallas"
                  className="input"
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  type="text"
                  value={location.state}
                  onChange={(e) => setLocation({ ...location, state: e.target.value })}
                  placeholder="TX"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Zip Code</label>
              <input
                type="text"
                value={location.zipcode}
                onChange={(e) => setLocation({ ...location, zipcode: e.target.value })}
                placeholder="75201"
                className="input"
              />
            </div>

            <p className="text-xs text-gray-500">
              This is your starting point for calculating distances
            </p>
          </div>

          <div>
            <label className="label">Service Radius</label>
            <p className="text-sm text-gray-600 mb-3">
              How far are you willing to travel for jobs?
            </p>
            <div className="space-y-3">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={location.serviceRadius}
                onChange={(e) => setLocation({ ...location, serviceRadius: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>5 miles</span>
                <span className="font-semibold text-primary-600 text-lg">
                  {location.serviceRadius} miles
                </span>
                <span>50 miles</span>
              </div>
            </div>
          </div>

          <div className="card p-4 bg-primary-50 border-primary-200">
            <p className="text-sm text-primary-900">
              💡 <strong>Tip:</strong> A larger radius means more job opportunities, but longer travel times.
            </p>
          </div>

          <button
            onClick={handleLocationSubmit}
            disabled={!location.street || !location.city || !location.state || !location.zipcode}
            className="btn btn-primary w-full"
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Availability (continued in next part due to length)
  if (currentStep === 4) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slots = ['morning', 'afternoon', 'evening'];
    const slotLabels = {
      morning: '9 AM - 12 PM',
      afternoon: '12 PM - 3 PM',
      evening: '3 PM - 6 PM'
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Weekly Availability</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-gray-600">
            Select the days and times you're available to work
          </p>

          <div className="space-y-4">
            {days.map(day => (
              <div key={day} className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 capitalize">{day}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => toggleAvailability(day, slot)}
                      className={`p-3 rounded-lg border-2 text-xs font-medium transition-all
                        ${availability[day][slot]
                          ? 'border-success-500 bg-success-50 text-success-700'
                          : 'border-gray-200 text-gray-600 hover:border-success-200'
                        }`}
                    >
                      <div className="capitalize mb-1">{slot}</div>
                      <div className="text-[10px] opacity-75">{slotLabels[slot]}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAvailabilitySubmit}
            className="btn btn-primary w-full"
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Background Check
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Background Check</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="card p-6 bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-primary-900 mb-3">Why is this required?</h3>
            <ul className="text-sm text-primary-800 space-y-2">
              <li>✓ Ensures customer safety and trust</li>
              <li>✓ Verifies identity and criminal records</li>
              <li>✓ Usually completes within 24-48 hours</li>
              <li>✓ Your data is secure and never shared</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Full Legal Name</label>
              <input
                type="text"
                value={backgroundCheck.fullName}
                onChange={(e) => setBackgroundCheck({ ...backgroundCheck, fullName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                value={backgroundCheck.dob}
                onChange={(e) => setBackgroundCheck({ ...backgroundCheck, dob: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Social Security Number (Last 4 digits)</label>
              <input
                type="text"
                value={backgroundCheck.ssn}
                onChange={(e) => setBackgroundCheck({ ...backgroundCheck, ssn: e.target.value })}
                placeholder="XXXX"
                maxLength={4}
                className="input"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={backgroundCheck.consent}
                onChange={(e) => setBackgroundCheck({ ...backgroundCheck, consent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I consent to a background check and understand this is required to accept jobs.
                I certify that the information provided is accurate.
              </span>
            </label>
          </div>

          <button
            onClick={handleBackgroundCheckSubmit}
            disabled={!backgroundCheck.fullName || !backgroundCheck.dob ||
              !backgroundCheck.ssn || !backgroundCheck.consent}
            className="btn btn-primary w-full"
          >
            Submit for Verification
          </button>
        </div>
      </div>
    );
  }

  // Step 6: Bank Account
  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="app-bar">
          <button onClick={() => setCurrentStep(0)} className="p-2">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-semibold">Connect Bank Account</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Get Paid Fast
            </h2>
            <p className="text-gray-600">
              Connect your bank account to receive payments via direct deposit
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Secure Connection</p>
                <p className="text-sm text-gray-500">Bank-level encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Fast Deposits</p>
                <p className="text-sm text-gray-500">Paid within 48 hours after job completion</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">No Fees</p>
                <p className="text-sm text-gray-500">Free direct deposit</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleBankConnect}
            className="btn btn-primary w-full"
          >
            Connect with Stripe
          </button>

          <p className="text-xs text-center text-gray-500">
            By connecting your bank account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return null;
}
