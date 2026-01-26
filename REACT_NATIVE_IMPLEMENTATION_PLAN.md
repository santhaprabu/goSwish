# GoSwish React Native - Complete Implementation Plan

## Project Overview
Building a production-ready, two-sided marketplace mobile application for iOS and Android that connects customers needing cleaning services with professional cleaners.

## Technology Stack

### Frontend (Mobile)
- **Framework**: React Native (latest stable)
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit + RTK Query
- **UI Components**: React Native Paper + Custom Components
- **Forms**: React Hook Form
- **Maps**: react-native-maps + Google Maps SDK
- **Image Handling**: react-native-image-picker + react-native-image-crop-picker
- **Permissions**: react-native-permissions
- **Storage**: @react-native-async-storage/async-storage
- **Deep Linking**: React Navigation deep linking

### Backend Services
- **Authentication**: Firebase Authentication
  - Email/Password
  - Google Sign-In (@react-native-google-signin/google-signin)
  - Apple Sign-In (@invertase/react-native-apple-authentication)
- **Database**: Cloud Firestore
- **Storage**: Firebase Cloud Storage
- **Functions**: Firebase Cloud Functions (Node.js)
- **Analytics**: Firebase Analytics
- **Crashlytics**: Firebase Crashlytics
- **Performance**: Firebase Performance Monitoring
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Payment Processing
- **Provider**: Stripe
- **Integration**: @stripe/stripe-react-native
- **Apple Pay**: Stripe Apple Pay
- **Google Pay**: Stripe Google Pay
- **Backend**: Stripe SDK in Cloud Functions

### Third-Party Services
- **Background Checks**: Checkr API or Stripe Identity
- **Maps & Geocoding**: Google Maps Platform
  - Maps SDK for iOS/Android
  - Places API
  - Geocoding API
  - Distance Matrix API
- **Email**: SendGrid (via Cloud Functions)
- **SMS**: Twilio (optional, for notifications)

## Project Structure

```
GoSwishMobile/
├── android/                    # Android native code
├── ios/                        # iOS native code
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── common/           # Buttons, inputs, cards, etc.
│   │   ├── auth/             # Auth-specific components
│   │   ├── booking/          # Booking flow components
│   │   ├── cleaner/          # Cleaner-specific components
│   │   └── customer/         # Customer-specific components
│   ├── screens/              # Screen components
│   │   ├── auth/
│   │   ├── customer/
│   │   ├── cleaner/
│   │   ├── shared/
│   │   └── onboarding/
│   ├── navigation/           # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── CustomerNavigator.tsx
│   │   ├── CleanerNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── store/                # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── bookingSlice.ts
│   │   │   ├── cleanerSlice.ts
│   │   │   └── uiSlice.ts
│   │   ├── api/
│   │   │   ├── authApi.ts
│   │   │   ├── bookingApi.ts
│   │   │   └── cleanerApi.ts
│   │   └── store.ts
│   ├── services/             # Service layer
│   │   ├── firebase/
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   ├── storage.ts
│   │   │   └── messaging.ts
│   │   ├── stripe/
│   │   │   └── payment.ts
│   │   ├── maps/
│   │   │   └── places.ts
│   │   └── notifications/
│   │       └── push.ts
│   ├── utils/                # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── pricing.ts
│   │   ├── distance.ts
│   │   └── date.ts
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   ├── useBooking.ts
│   │   └── usePermissions.ts
│   ├── constants/            # App constants
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── config.ts
│   ├── types/                # TypeScript types
│   │   ├── user.ts
│   │   ├── booking.ts
│   │   ├── cleaner.ts
│   │   └── navigation.ts
│   └── assets/               # Images, fonts, etc.
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── matching/
│   │   ├── payment/
│   │   ├── notifications/
│   │   └── verification/
│   └── package.json
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
├── firebase.json             # Firebase configuration
├── app.json                  # React Native configuration
├── package.json
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Project Setup & Infrastructure (Week 1)
**Goal**: Set up development environment and core infrastructure

#### Tasks:
1. **Initialize React Native Project**
   - Create new React Native project with TypeScript
   - Configure ESLint, Prettier
   - Set up folder structure
   - Configure absolute imports

2. **Firebase Setup**
   - Create Firebase project
   - Add iOS and Android apps
   - Install Firebase SDK packages
   - Configure Firebase in both platforms
   - Set up development and production environments

3. **Navigation Setup**
   - Install React Navigation
   - Configure stack, tab, and modal navigators
   - Set up deep linking
   - Create navigation types

4. **State Management**
   - Install Redux Toolkit
   - Configure store
   - Set up RTK Query for API calls
   - Create initial slices

5. **Design System**
   - Define color palette
   - Set up typography
   - Create spacing constants
   - Build base components (Button, Input, Card, etc.)

**Deliverables**:
- ✅ React Native project running on iOS and Android
- ✅ Firebase connected and configured
- ✅ Navigation structure in place
- ✅ Redux store configured
- ✅ Base UI components library

---

### Phase 2: Authentication System (Week 2)
**Goal**: Complete user authentication with all methods

#### Tasks:
1. **Splash Screen & Role Selection**
   - Animated splash screen
   - Role selection UI (Customer/Cleaner)
   - Persist role selection

2. **Email/Password Authentication**
   - Sign up form with validation
   - Password strength indicator
   - Login form
   - Email verification flow
   - Resend verification email

3. **Social Authentication**
   - Google Sign-In integration
   - Apple Sign-In integration (iOS)
   - Handle OAuth flows
   - Profile data extraction

4. **Password Reset**
   - Forgot password flow
   - Email link handling
   - Deep link to app

5. **Auth State Management**
   - Persist auth state
   - Auto-login on app launch
   - Token refresh handling
   - Logout functionality

**Deliverables**:
- ✅ Complete signup/login flows
- ✅ Email verification working
- ✅ Google and Apple Sign-In functional
- ✅ Password reset flow
- ✅ Persistent authentication

---

### Phase 3: Customer Profile & Houses (Week 3)
**Goal**: Customer profile creation and property management

#### Tasks:
1. **Profile Setup**
   - Profile creation form
   - Phone number formatting
   - Real-time validation
   - Profile photo upload
   - Image compression

2. **House Management**
   - Google Places Autocomplete integration
   - Address input with autocomplete
   - House details form (sqft, rooms, pets)
   - Access instructions
   - Save house to Firestore

3. **Multiple Houses**
   - House list screen
   - Add/edit/delete houses
   - Set default house
   - House cards with details

4. **Profile Editing**
   - Edit profile screen
   - Update photo
   - Update phone/name
   - Optimistic updates

**Deliverables**:
- ✅ Profile creation and editing
- ✅ Photo upload to Firebase Storage
- ✅ Google Places integration
- ✅ Full house management CRUD
- ✅ Default house selection

---

### Phase 4: Service Catalog & Pricing (Week 4)
**Goal**: Service selection and dynamic pricing engine

#### Tasks:
1. **Service Types**
   - Service catalog UI
   - Service cards with details
   - Service selection
   - Store service types in Firestore

2. **Pricing Engine**
   - Dynamic price calculation
   - Base rate by service type
   - Sqft multipliers
   - Room multipliers
   - Metro multipliers
   - Pet surcharge

3. **Add-ons**
   - Add-on selection UI
   - Price updates on toggle
   - Store selected add-ons

4. **Promo Codes**
   - Promo code input
   - Validation logic
   - Apply discount
   - Show discount in breakdown

5. **Price Breakdown**
   - Itemized breakdown UI
   - Real-time updates
   - Tax calculation
   - Total display

**Deliverables**:
- ✅ Service catalog with 4 service types
- ✅ Working pricing engine
- ✅ Add-on selection
- ✅ Promo code system
- ✅ Complete price breakdown

---

### Phase 5: Booking Flow (Week 5-6)
**Goal**: Complete booking creation with 3-date-choice system

#### Tasks:
1. **Date Selection**
   - Calendar UI
   - 3-date-choice system
   - Disable past dates
   - Date labels (1st, 2nd, 3rd choice)
   - Rearrange dates

2. **Time Slot Selection**
   - Time slot picker per date
   - Morning/Afternoon/Evening
   - Visual selection UI

3. **Special Notes**
   - Text area input
   - Character counter (500 max)
   - Placeholder text

4. **House Selection**
   - House selector in booking
   - Pre-select default
   - Change house option

5. **Review & Confirm**
   - Summary screen
   - Edit buttons for each section
   - Terms of service checkbox
   - Cancellation policy link

6. **Booking State Management**
   - Store booking in progress
   - Navigate between steps
   - Validate each step
   - Clear on completion

**Deliverables**:
- ✅ Complete booking flow UI
- ✅ 3-date-choice calendar
- ✅ Time slot selection
- ✅ Review screen
- ✅ Booking state management

---

### Phase 6: Payment Integration (Week 7)
**Goal**: Secure payment processing with Stripe

#### Tasks:
1. **Stripe Setup**
   - Create Stripe account
   - Install Stripe SDK
   - Configure publishable keys
   - Set up test mode

2. **Card Payment**
   - Stripe card input component
   - Card validation
   - Card brand detection
   - Save card option
   - Create Stripe Customer

3. **Apple Pay**
   - Configure Apple Pay
   - Apple Pay button
   - Payment sheet
   - Handle authorization

4. **Google Pay**
   - Configure Google Pay
   - Google Pay button
   - Payment sheet
   - Handle authorization

5. **Payment Processing (Cloud Functions)**
   - Create Payment Intent endpoint
   - Confirm payment
   - Handle webhooks
   - Store payment metadata
   - Handle failures

6. **Booking Creation**
   - Create booking after payment
   - Generate booking ID (GS-2026-XXXXXX)
   - Store in Firestore
   - Trigger matching function

**Deliverables**:
- ✅ Stripe integration complete
- ✅ Card payment working
- ✅ Apple Pay functional (iOS)
- ✅ Google Pay functional (Android)
- ✅ Payment Cloud Functions
- ✅ Booking creation after payment

---

### Phase 7: Booking Confirmation & History (Week 8)
**Goal**: Booking confirmation and customer booking management

#### Tasks:
1. **Confirmation Screen**
   - Success animation
   - Booking details display
   - Booking ID
   - Share functionality
   - Navigation buttons

2. **Booking List**
   - List all customer bookings
   - Filter by status
   - Sort by date
   - Booking cards

3. **Booking Details**
   - Full booking information
   - Status tracking
   - Cleaner info (when matched)
   - Cancel booking option

4. **Notifications**
   - Booking confirmation email
   - Push notification setup
   - Notification permissions

**Deliverables**:
- ✅ Booking confirmation screen
- ✅ Booking history list
- ✅ Booking detail screen
- ✅ Email notifications
- ✅ Push notification setup

---

### Phase 8: Cleaner Onboarding (Week 9-10)
**Goal**: Complete cleaner profile and onboarding system

#### Tasks:
1. **Cleaner Profile Creation**
   - Profile form (name, headline, bio)
   - Years of experience
   - Specialties multi-select
   - Languages spoken
   - Store in Firestore /cleaners

2. **Professional Photo**
   - Photo upload screen
   - Photo requirements guidance
   - Image picker
   - Compression
   - Upload to Storage

3. **Location & Service Radius**
   - Get device location
   - Manual address entry
   - Google Places validation
   - Service radius selector
   - Map preview

4. **Weekly Availability**
   - 7x3 grid (days × time slots)
   - Toggle availability
   - Select all / Clear all
   - Copy to all days
   - Store availability object

5. **Onboarding Checklist**
   - Progress tracker UI
   - 6 steps with status
   - Clickable steps
   - Locked steps
   - Progress percentage
   - Completion celebration

6. **Block Job Offers**
   - Check onboarding status
   - Hide offers if incomplete
   - Show locked state
   - Direct to checklist

**Deliverables**:
- ✅ Cleaner profile creation
- ✅ Photo upload
- ✅ Location and radius setup
- ✅ Availability scheduler
- ✅ Onboarding checklist
- ✅ Job offer gating

---

### Phase 9: Background Check & Verification (Week 11)
**Goal**: Background check integration and verification system

#### Tasks:
1. **Background Check Initiation**
   - Explanation screen
   - Consent form (FCRA compliant)
   - Data collection form
   - Checkr/Stripe Identity integration
   - Submit to vendor API

2. **Status Persistence**
   - Store check data in Firestore
   - Vendor ID
   - Status tracking
   - Result storage
   - Expiry date

3. **Webhook Integration**
   - Cloud Function webhook endpoint
   - Receive vendor updates
   - Update Firestore
   - Trigger notifications

4. **Status Display (Cleaner)**
   - Verification status screen
   - Status badge
   - Status descriptions
   - Expiry countdown
   - Renewal option

5. **Admin Verification Queue**
   - Admin dashboard
   - Pending cases list
   - Case details screen
   - Approve/Decline actions
   - Audit trail

6. **Firestore Security Rules**
   - Enforce verification status
   - Block job acceptances
   - Check expiry date
   - Role-based access

**Deliverables**:
- ✅ Background check integration
- ✅ Webhook handling
- ✅ Status tracking
- ✅ Cleaner status screen
- ✅ Admin queue (basic)
- ✅ Security rules enforcement

---

### Phase 10: Cleaner Matching & Job Offers (Week 12-13)
**Goal**: Intelligent matching and job offer system

#### Tasks:
1. **Eligibility Filtering (Cloud Function)**
   - Trigger on booking creation
   - Query cleaners with filters
   - Geographic search (geohash)
   - Distance calculation (Haversine)
   - Availability check
   - Service type match
   - Return top 50 cleaners

2. **Ranking Algorithm**
   - Scoring criteria
   - Distance weight
   - Rating weight
   - Acceptance rate
   - Recent activity
   - Calculate scores
   - Select top 10-20

3. **Job Offer Broadcast**
   - Create offer records
   - Store in /jobOffers
   - Set 15-min expiry
   - Send push notifications
   - Track offer status

4. **Job Offer Display (Cleaner)**
   - Available jobs list
   - Offer cards
   - Earnings display
   - Distance display
   - Expiry countdown
   - Sort/filter options

5. **Job Offer Details**
   - Full offer screen
   - Earnings breakdown
   - Customer info
   - House details
   - Map with route
   - Accept/Decline buttons

6. **Offer Expiry System**
   - Cloud Function scheduled task
   - Query expired offers
   - Mark as expired
   - Remove from view
   - Trigger second wave

**Deliverables**:
- ✅ Matching Cloud Function
- ✅ Ranking algorithm
- ✅ Job offer creation
- ✅ Cleaner job offers UI
- ✅ Offer details screen
- ✅ Expiry system

---

### Phase 11: Job Acceptance & Locking (Week 14)
**Goal**: Job acceptance with first-come locking

#### Tasks:
1. **Accept Job Flow**
   - Date selection from 3 options
   - Confirm availability
   - Create acceptance record
   - Call Cloud Function

2. **First-Come Locking (Cloud Function)**
   - Firestore transaction
   - Lock booking
   - Assign cleaner
   - Cancel other offers
   - Update statuses

3. **Success Confirmation**
   - Acceptance animation
   - Job details summary
   - Add to calendar
   - Navigate to My Jobs

4. **Race Condition Handling**
   - Check lock status
   - Show "already accepted" message
   - Remove offer
   - Suggest other offers

5. **Customer Notification**
   - Push notification
   - Email notification
   - In-app notification

6. **Decline Flow**
   - Decline button
   - Optional reason
   - Mark offer declined
   - Remove from view

**Deliverables**:
- ✅ Job acceptance flow
- ✅ Locking mechanism
- ✅ Success screen
- ✅ Race condition handling
- ✅ Notifications
- ✅ Decline functionality

---

### Phase 12: Cleaner App Screens (Week 15)
**Goal**: Complete cleaner-side navigation and screens

#### Tasks:
1. **Cleaner Home Screen**
   - Dashboard with metrics
   - Upcoming jobs
   - This week's earnings
   - Completed jobs count
   - Rating display

2. **Jobs Tab**
   - Sub-tabs: Available, Upcoming, Completed
   - Job cards
   - Filter/sort options
   - Badge for offer count

3. **Schedule Tab**
   - Calendar view
   - Accepted jobs
   - Color-coded by type
   - Day/week/month views

4. **Earnings Tab**
   - Total earnings
   - Pending payouts
   - Payout history
   - Connect bank account

5. **Profile Tab**
   - Personal info
   - Professional photo
   - Bio and specialties
   - Verification status
   - Settings

**Deliverables**:
- ✅ Cleaner home dashboard
- ✅ Jobs tab with sub-tabs
- ✅ Schedule calendar
- ✅ Earnings screen
- ✅ Profile screen

---

### Phase 13: Push Notifications (Week 16)
**Goal**: Complete push notification system

#### Tasks:
1. **FCM Setup**
   - Configure Firebase Cloud Messaging
   - iOS APNs certificates
   - Android FCM configuration
   - Request permissions

2. **Notification Handling**
   - Foreground notifications
   - Background notifications
   - Notification tap handling
   - Deep linking

3. **Notification Types**
   - Customer notifications
   - Cleaner notifications
   - Transactional notifications
   - Marketing notifications (optional)

4. **Cloud Functions**
   - Send notification function
   - Trigger on events
   - Batch notifications
   - Quiet hours logic

5. **Notification Preferences**
   - Settings screen
   - Per-type toggles
   - Quiet hours
   - Sound/vibration

**Deliverables**:
- ✅ FCM configured
- ✅ Notification handling
- ✅ All notification types
- ✅ Cloud Functions
- ✅ Preferences screen

---

### Phase 14: Security & Rules (Week 17)
**Goal**: Implement comprehensive security

#### Tasks:
1. **Firestore Security Rules**
   - User data rules
   - Booking rules
   - Cleaner rules
   - Job offer rules
   - Admin rules

2. **Storage Security Rules**
   - Profile photo rules
   - File size limits
   - File type restrictions

3. **Cloud Functions Security**
   - Authentication checks
   - Authorization logic
   - Rate limiting
   - Input validation

4. **API Key Security**
   - Restrict API keys
   - Bundle ID restrictions
   - Environment variables

5. **Data Encryption**
   - Sensitive data handling
   - Secure storage
   - HTTPS enforcement

**Deliverables**:
- ✅ Firestore rules deployed
- ✅ Storage rules deployed
- ✅ Secure Cloud Functions
- ✅ API keys restricted
- ✅ Security audit passed

---

### Phase 15: Testing & Quality Assurance (Week 18-19)
**Goal**: Comprehensive testing and bug fixes

#### Tasks:
1. **Unit Tests**
   - Pricing calculations
   - Validation functions
   - Date/time utilities
   - Distance calculations

2. **Integration Tests**
   - Authentication flows
   - Booking creation
   - Payment processing
   - Job acceptance

3. **E2E Tests**
   - Customer signup → book → pay
   - Cleaner signup → onboard → accept
   - Complete job lifecycle

4. **Device Testing**
   - iOS 15, 16, 17
   - Android 11, 12, 13, 14
   - Various screen sizes
   - Performance testing

5. **Network Testing**
   - WiFi, 4G, 3G
   - Offline scenarios
   - Poor connectivity
   - Network errors

6. **Bug Fixes**
   - Fix critical bugs
   - Fix high-priority bugs
   - Fix medium-priority bugs
   - Document known issues

**Deliverables**:
- ✅ Test suite complete
- ✅ All critical bugs fixed
- ✅ Device compatibility verified
- ✅ Network resilience tested
- ✅ Performance optimized

---

### Phase 16: Analytics & Monitoring (Week 20)
**Goal**: Implement analytics and monitoring

#### Tasks:
1. **Firebase Analytics**
   - Screen tracking
   - Event tracking
   - User properties
   - Conversion funnels

2. **Crashlytics**
   - Crash reporting
   - Error logging
   - Custom logs
   - User context

3. **Performance Monitoring**
   - App startup time
   - Screen rendering
   - Network requests
   - Custom traces

4. **Analytics Events**
   - Authentication events
   - Booking events
   - Payment events
   - Cleaner events
   - Matching events

5. **Dashboards**
   - Firebase console
   - Custom dashboards
   - Alerts setup

**Deliverables**:
- ✅ Analytics tracking
- ✅ Crashlytics enabled
- ✅ Performance monitoring
- ✅ All events logged
- ✅ Dashboards configured

---

### Phase 17: Polish & Optimization (Week 21)
**Goal**: Final polish and optimization

#### Tasks:
1. **UI/UX Polish**
   - Animation refinement
   - Transition smoothness
   - Loading states
   - Error states
   - Empty states

2. **Performance Optimization**
   - Image optimization
   - Bundle size reduction
   - Memory optimization
   - Battery optimization

3. **Accessibility**
   - Screen reader support
   - Contrast ratios
   - Touch targets
   - Dynamic type

4. **Offline Support**
   - Firestore offline persistence
   - Cached data
   - Queue actions
   - Sync on reconnect

5. **Localization Prep**
   - Extract strings
   - i18n setup
   - RTL support (if needed)

**Deliverables**:
- ✅ Polished UI/UX
- ✅ Optimized performance
- ✅ Accessible app
- ✅ Offline support
- ✅ Localization ready

---

### Phase 18: Production Deployment (Week 22)
**Goal**: Deploy to App Store and Google Play

#### Tasks:
1. **App Store Preparation**
   - App icons
   - Screenshots
   - App description
   - Privacy policy
   - Terms of service

2. **iOS Build**
   - Production certificates
   - Provisioning profiles
   - Archive and upload
   - TestFlight beta

3. **Google Play Preparation**
   - Store listing
   - Screenshots
   - Feature graphic
   - Privacy policy

4. **Android Build**
   - Signing key
   - Release build
   - Upload to Play Console
   - Internal testing

5. **Backend Production**
   - Firebase production project
   - Stripe production keys
   - Cloud Functions deployment
   - Security rules deployment

6. **Launch**
   - Submit for review
   - Monitor reviews
   - Address feedback
   - Gradual rollout

**Deliverables**:
- ✅ iOS app in App Store
- ✅ Android app in Google Play
- ✅ Backend in production
- ✅ Monitoring active
- ✅ Support ready

---

## Firebase Collections Schema

### /users/{uid}
```typescript
{
  email: string;
  role: 'customer' | 'cleaner' | 'both';
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'suspended';
  profile: {
    name: string;
    phone: string;
    defaultHouseId: string | null;
  };
}
```

### /users/{uid}/houses/{houseId}
```typescript
{
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    apt?: string;
  };
  location: GeoPoint;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  hasPets: boolean;
  petNotes?: string;
  accessInstructions?: string;
  nickname?: string;
  isDefault: boolean;
  createdAt: Timestamp;
}
```

### /bookings/{bookingId}
```typescript
{
  bookingId: string; // GS-2026-XXXXXX
  customerId: string;
  cleanerId: string | null;
  houseId: string;
  serviceType: string;
  dateOptions: Array<{
    date: string;
    timeSlot: 'morning' | 'afternoon' | 'evening';
    startTime: string;
    endTime: string;
  }>;
  selectedDate: {
    date: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
  } | null;
  addOns: string[];
  specialNotes?: string;
  pricingBreakdown: {
    base: number;
    addOns: number;
    subtotal: number;
    taxes: number;
    promoDiscount: number;
    total: number;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentId: string;
  status: 'confirmed' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  lockStatus: 'unlocked' | 'locked';
  lockedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### /cleaners/{uid}
```typescript
{
  userId: string;
  name: string;
  headline: string;
  bio: string;
  yearsExperience: number;
  specialties: string[];
  languages: string[];
  photoURL: string | null;
  baseLocation: GeoPoint;
  serviceRadius: number;
  serviceTypes: string[];
  availability: {
    monday: { morning: boolean; afternoon: boolean; evening: boolean };
    tuesday: { morning: boolean; afternoon: boolean; evening: boolean };
    // ... other days
  };
  verificationStatus: 'pending' | 'in_progress' | 'approved' | 'declined' | 'expired' | 'pending_review';
  backgroundCheck: {
    vendorId: string;
    status: 'pending' | 'in_progress' | 'completed';
    result: 'approved' | 'declined' | 'consider' | 'expired';
    createdAt: Timestamp;
    completedAt: Timestamp | null;
    expiryDate: Timestamp | null;
  };
  onboardingStatus: {
    profileComplete: boolean;
    photoUploaded: boolean;
    locationSet: boolean;
    availabilitySet: boolean;
    backgroundCheckComplete: boolean;
    bankConnected: boolean;
  };
  stats: {
    completedJobs: number;
    rating: number;
    acceptanceRate: number;
    responseTime: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### /jobOffers/{offerId}
```typescript
{
  bookingId: string;
  cleanerId: string;
  earnings: number;
  distance: number;
  dateTimeOptions: Array<{
    date: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
  }>;
  houseLocation: GeoPoint;
  serviceType: string;
  estimatedDuration: number;
  status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expiresAt: Timestamp;
  createdAt: Timestamp;
  viewedAt: Timestamp | null;
  respondedAt: Timestamp | null;
}
```

### /jobAcceptances/{acceptanceId}
```typescript
{
  bookingId: string;
  cleanerId: string;
  offerId: string;
  selectedDate: {
    date: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
  };
  acceptedAt: Timestamp;
  status: 'accepted' | 'confirmed' | 'started' | 'completed';
}
```

### /promoCodes/{codeId}
```typescript
{
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  perUserMaxUses: number;
  currentUses: number;
  validFrom: Timestamp;
  validUntil: Timestamp;
  isActive: boolean;
  eligibleServiceTypes: string[];
  firstTimeOnly: boolean;
}
```

## Cloud Functions

### Authentication Triggers
- `onUserCreate`: Create user profile in Firestore
- `onUserDelete`: Clean up user data

### Booking Functions
- `createBooking`: Validate and create booking after payment
- `onBookingCreate`: Trigger matching algorithm
- `cancelBooking`: Handle booking cancellation

### Matching Functions
- `findEligibleCleaners`: Query and filter cleaners
- `rankCleaners`: Score and rank cleaners
- `broadcastJobOffers`: Create and send job offers
- `expireJobOffers`: Scheduled function to expire offers

### Payment Functions
- `createPaymentIntent`: Create Stripe Payment Intent
- `handlePaymentWebhook`: Process Stripe webhooks
- `processRefund`: Handle refund requests

### Job Acceptance Functions
- `acceptJobOffer`: Handle job acceptance with locking
- `lockBooking`: Atomic booking lock
- `cancelOtherOffers`: Cancel offers after acceptance

### Notification Functions
- `sendPushNotification`: Send FCM notifications
- `sendEmail`: Send transactional emails
- `sendSMS`: Send SMS notifications (optional)

### Verification Functions
- `initiateBackgroundCheck`: Start background check with vendor
- `handleVerificationWebhook`: Process vendor webhooks
- `updateVerificationStatus`: Update cleaner verification

### Scheduled Functions
- `expireOffers`: Run every minute to expire old offers
- `sendReminders`: Send booking reminders
- `checkVerificationExpiry`: Check for expiring verifications

## Environment Variables

```env
# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Maps
GOOGLE_MAPS_API_KEY_IOS=
GOOGLE_MAPS_API_KEY_ANDROID=

# Checkr
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=

# SendGrid
SENDGRID_API_KEY=

# App Config
APP_ENV=development|staging|production
API_URL=
```

## Next Steps

1. **Set up React Native project**
2. **Configure Firebase project**
3. **Install dependencies**
4. **Start with Phase 1 implementation**
5. **Follow the week-by-week plan**

## Estimated Timeline
- **Total Duration**: 22 weeks (5.5 months)
- **Team Size**: 2-3 developers
- **Testing**: Ongoing + dedicated 2 weeks
- **Buffer**: Add 20% for unknowns (4-5 weeks)

## Success Metrics
- App Store rating: 4.5+ stars
- Customer booking completion rate: >80%
- Cleaner acceptance rate: >70%
- App crash rate: <1%
- Payment success rate: >95%
- Average booking time: <5 minutes
