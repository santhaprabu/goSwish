# Firebase Database Setup Guide

## 🔥 Complete Database Creation for GoSwish

This guide will help you create and configure the entire Firestore database for your GoSwish app.

---

## 📋 Quick Setup (5 Minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add Project"** or select existing "GoSwish" project
3. Follow the wizard

### Step 2: Create Firestore Database
1. In Firebase Console, click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select location: **us-central1** (or closest to you)
5. Click **"Enable"**

### Step 3: Deploy Security Rules
1. In Firestore, click **"Rules"** tab
2. Copy content from `firestore.rules` file
3. Paste into the rules editor
4. Click **"Publish"**

### Step 4: Enable Storage
1. Click **"Storage"** in left menu
2. Click **"Get Started"**
3. Choose **"Start in production mode"**
4. Select same location as Firestore
5. Click **"Done"**

### Step 5: Deploy Storage Rules
1. In Storage, click **"Rules"** tab
2. Copy content from `storage.rules` file
3. Paste into the rules editor
4. Click **"Publish"**

### Step 6: Initialize Database
Run the initialization script:
```javascript
import { initializeDatabase } from './firebase/initDatabase';

// Run this once to create all collections
await initializeDatabase();
```

---

## 📊 Database Structure

### Collections Created

```
firestore/
├── users/                    # User profiles
│   ├── {userId}/
│   │   ├── houses/          # User's properties
│   │   └── paymentMethods/  # Payment info
├── cleaners/                 # Cleaner profiles
├── bookings/                 # All bookings
├── jobOffers/                # Job offers to cleaners
├── jobs/                     # Active/completed jobs
│   ├── {jobId}/
│   │   ├── photos/          # Job photos
│   │   └── checklist/       # Task checklist
├── reviews/                  # Customer reviews
├── payouts/                  # Cleaner payouts
├── teams/                    # Cleaning teams
├── messages/                 # In-app messaging
├── disputes/                 # Dispute resolution
├── supportTickets/           # Customer support
├── serviceTypes/             # Service catalog
├── addOns/                   # Available add-ons
├── metroMultipliers/         # Location pricing
├── promoCodes/               # Promo codes
├── settings/                 # App configuration
├── analytics/                # Usage analytics
└── notifications/            # User notifications
```

---

## 🗂️ Collection Details

### 1. Users Collection
```javascript
/users/{userId}
{
  uid: string,
  email: string,
  role: 'customer' | 'cleaner' | 'admin',
  emailVerified: boolean,
  photoURL: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  status: 'active' | 'suspended',
  profile: {
    name: string,
    phone: string,
    address: object
  },
  notificationPreferences: {
    bookingUpdates: boolean,
    jobOffers: boolean,
    earnings: boolean,
    messages: boolean,
    reviews: boolean,
    promotions: boolean
  }
}
```

### 2. Cleaners Collection
```javascript
/cleaners/{cleanerId}
{
  userId: string,
  name: string,
  headline: string,
  bio: string,
  yearsExperience: number,
  specialties: array,
  languages: array,
  photoURL: string,
  baseLocation: geopoint,
  serviceRadius: number,
  serviceTypes: array,
  availability: object,
  verificationStatus: 'pending' | 'approved' | 'rejected',
  backgroundCheck: {
    status: string,
    result: object
  },
  payments: {
    stripeAccountId: string,
    bankStatus: string
  },
  stats: {
    completedJobs: number,
    rating: number,
    totalReviews: number,
    acceptanceRate: number,
    cancellationRate: number,
    reliabilityScore: number
  },
  status: 'active' | 'inactive',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Bookings Collection
```javascript
/bookings/{bookingId}
{
  bookingId: string, // GS-2026-XXXXXX
  customerId: string,
  cleanerId: string,
  houseId: string,
  serviceType: string,
  addOns: array,
  selectedDate: {
    date: timestamp,
    timeSlot: string
  },
  pricingBreakdown: {
    basePrice: number,
    addOnsTotal: number,
    subtotal: number,
    discount: number,
    tax: number,
    total: number
  },
  status: 'confirmed' | 'matched' | 'in_progress' | 'completed' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'refunded',
  paymentId: string,
  promoCode: string,
  specialNotes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. Jobs Collection
```javascript
/jobs/{jobId}
{
  bookingId: string,
  customerId: string,
  cleanerId: string,
  houseId: string,
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled',
  startTime: timestamp,
  endTime: timestamp,
  checklistItems: array,
  photos: {
    before: array,
    during: array,
    after: array
  },
  location: {
    current: geopoint,
    destination: geopoint
  },
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. Service Types Collection (Pre-populated)
```javascript
/serviceTypes/{serviceId}
{
  id: 'regular' | 'deep' | 'move' | 'windows',
  name: string,
  description: string,
  basePrice: number,
  pricePerSqft: number,
  duration: number, // minutes
  icon: string,
  active: boolean,
  createdAt: timestamp
}
```

### 6. Add-ons Collection (Pre-populated)
```javascript
/addOns/{addonId}
{
  id: string,
  name: string,
  description: string,
  price: number,
  duration: number,
  icon: string,
  active: boolean,
  createdAt: timestamp
}
```

### 7. Promo Codes Collection (Pre-populated)
```javascript
/promoCodes/{promoId}
{
  code: string,
  type: 'percentage' | 'fixed',
  value: number,
  description: string,
  maxUses: number,
  usedCount: number,
  minAmount: number,
  maxDiscount: number,
  validFrom: timestamp,
  validUntil: timestamp,
  active: boolean,
  firstTimeOnly: boolean,
  serviceTypes: array (optional)
}
```

---

## 🔐 Security Rules Summary

### User Access
- ✅ Users can read any profile
- ✅ Users can only write their own data
- ✅ Users can manage their own houses

### Cleaner Access
- ✅ Anyone can read cleaner profiles
- ✅ Cleaners can only edit their own profile
- ✅ Admins can edit any profile

### Booking Access
- ✅ Customers and cleaners can read their bookings
- ✅ Anyone can create bookings
- ✅ Involved parties can update bookings

### Job Access
- ✅ Customer and cleaner can read job details
- ✅ Cleaner can upload photos
- ✅ Cleaner can update checklist

### Public Data
- ✅ Service types (read-only)
- ✅ Add-ons (read-only)
- ✅ Metro multipliers (read-only)
- ✅ App settings (read-only)

---

## 💾 Storage Structure

```
storage/
├── users/
│   └── {userId}/
│       └── profile/
│           └── {fileName}        # Profile photos
├── cleaners/
│   └── {cleanerId}/
│       ├── photos/
│       │   └── {fileName}        # Portfolio photos
│       └── documents/
│           └── {fileName}        # ID, certifications
├── jobs/
│   └── {jobId}/
│       └── photos/
│           └── {fileName}        # Before/after photos
├── houses/
│   └── {houseId}/
│       └── photos/
│           └── {fileName}        # House photos
├── bookings/
│   └── {bookingId}/
│       └── receipts/
│           └── {fileName}        # PDF receipts
├── disputes/
│   └── {disputeId}/
│       └── evidence/
│           └── {fileName}        # Evidence photos
└── support/
    └── {ticketId}/
        └── attachments/
            └── {fileName}        # Support attachments
```

---

## 🚀 Initialization Script

### Run Once After Setup

Create a temporary initialization page or run in console:

```javascript
// In your app (e.g., admin panel or console)
import { initializeDatabase, verifyDatabase } from './firebase/initDatabase';

// Initialize database
const result = await initializeDatabase();
if (result.success) {
  console.log('✅ Database initialized!');
  
  // Verify structure
  await verifyDatabase();
} else {
  console.error('❌ Error:', result.error);
}
```

This will create:
- ✅ 4 service types (Regular, Deep, Move In/Out, Windows)
- ✅ 5 add-ons (Fridge, Oven, Cabinets, Laundry, Dishes)
- ✅ 10 metro multipliers (NYC, SF, LA, etc.)
- ✅ 3 promo codes (WELCOME20, SAVE10, DEEP25)
- ✅ App settings (tax rate, fees, etc.)

---

## 📝 Manual Setup (Alternative)

If you prefer to create collections manually:

### 1. Create Service Types
```
Collection: serviceTypes
Documents:
  - regular: { name: "Regular Clean", basePrice: 25, ... }
  - deep: { name: "Deep Clean", basePrice: 40, ... }
  - move: { name: "Move In/Out", basePrice: 60, ... }
  - windows: { name: "Window Cleaning", basePrice: 30, ... }
```

### 2. Create Add-ons
```
Collection: addOns
Documents:
  - inside-fridge: { name: "Inside Fridge", price: 15, ... }
  - inside-oven: { name: "Inside Oven", price: 15, ... }
  - inside-cabinets: { name: "Inside Cabinets", price: 15, ... }
  - laundry: { name: "Laundry", price: 20, ... }
  - dishes: { name: "Dishes", price: 10, ... }
```

### 3. Create Settings
```
Collection: settings
Document: app
  {
    taxRate: 0.0825,
    platformFee: 0.15,
    cleanerEarningsRate: 0.70,
    minBookingAmount: 50,
    maxBookingAmount: 1000,
    ...
  }
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Storage enabled
- [ ] Storage rules deployed
- [ ] Service types collection exists
- [ ] Add-ons collection exists
- [ ] Metro multipliers collection exists
- [ ] Promo codes collection exists
- [ ] Settings collection exists
- [ ] Can create test user
- [ ] Can create test booking
- [ ] Can upload test photo

---

## 🧪 Testing

### Test User Creation
```javascript
import { signUpWithEmail } from './firebase/auth';

const result = await signUpWithEmail(
  'test@example.com',
  'Test1234',
  { name: 'Test User', role: 'customer' }
);
```

### Test Booking Creation
```javascript
import { createBooking } from './firebase/firestore';

const result = await createBooking({
  customerId: user.uid,
  serviceType: 'regular',
  // ... other data
});
```

### Test Photo Upload
```javascript
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase/config';

const photoRef = ref(storage, `users/${userId}/profile/photo.jpg`);
await uploadBytes(photoRef, file);
```

---

## 💰 Cost Estimate

### Free Tier (Spark Plan)
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ 10 GB/month transfer

**Perfect for development and testing!**

### Production (Blaze Plan)
For 1,000 active users:
- Firestore: ~$25-50/month
- Storage: ~$10-20/month
- **Total: ~$35-70/month**

---

## 🎯 Next Steps

1. ✅ Complete Firebase setup (above)
2. ✅ Deploy security rules
3. ✅ Run initialization script
4. ✅ Test database operations
5. ✅ Verify data persistence
6. ✅ Test real-time updates

---

**Status**: Database Setup Guide Complete! 🔥  
**Next**: Follow steps above to create your database!
