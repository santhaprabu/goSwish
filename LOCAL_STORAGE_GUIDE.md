# Local Storage System - Complete Guide

## 🎯 Overview

This is a **complete persistent data storage solution** for GoSwish that:
- ✅ **Works offline** - No internet required
- ✅ **Persists data** - Survives page refreshes and browser restarts
- ✅ **Zero configuration** - No API keys or external services needed
- ✅ **Firebase-like API** - Easy to migrate to Firebase later
- ✅ **Fast & reliable** - Uses IndexedDB for optimal performance

---

## 🚀 Quick Start

### 1. Initialize the Database

Run this **once** when your app starts (e.g., in `App.jsx`):

```javascript
import { initDB, initializeDatabase } from './storage';

// Initialize database on app load
useEffect(() => {
  const setupDatabase = async () => {
    await initDB();
    await initializeDatabase();
    console.log('✅ Database ready!');
  };
  
  setupDatabase();
}, []);
```

### 2. Use Authentication

```javascript
import { signUpWithEmail, signInWithEmail, getCurrentUser, signOut } from './storage';

// Sign up
const handleSignUp = async () => {
  const result = await signUpWithEmail(
    'user@example.com',
    'password123',
    {
      name: 'John Doe',
      role: 'customer',
      phone: '555-1234',
    }
  );
  
  if (result.success) {
    console.log('User created:', result.user);
  } else {
    console.error('Error:', result.error);
  }
};

// Sign in
const handleSignIn = async () => {
  const result = await signInWithEmail('user@example.com', 'password123');
  
  if (result.success) {
    console.log('Logged in:', result.user);
  }
};

// Get current user
const user = getCurrentUser();

// Sign out
await signOut();
```

### 3. Create and Manage Data

```javascript
import {
  createHouse,
  createBooking,
  getCustomerBookings,
  getServiceTypes,
  validatePromoCode,
} from './storage';

// Create a house
const house = await createHouse(userId, {
  nickname: 'My Home',
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
  },
  size: 1500,
  bedrooms: 2,
  bathrooms: 2,
});

// Get service types
const services = await getServiceTypes();

// Validate promo code
const promoResult = await validatePromoCode('WELCOME20', userId, 'regular', 100);
if (promoResult.valid) {
  console.log('Promo code valid!', promoResult.promo);
}

// Create a booking
const booking = await createBooking({
  customerId: userId,
  cleanerId: 'cleaner-123',
  houseId: house.id,
  serviceType: 'regular',
  addOns: ['inside-fridge'],
  selectedDate: {
    date: new Date().toISOString(),
    timeSlot: '9:00 AM - 12:00 PM',
  },
  pricingBreakdown: {
    basePrice: 100,
    addOnsTotal: 15,
    subtotal: 115,
    discount: 23,
    tax: 7.59,
    total: 99.59,
  },
  promoCode: 'WELCOME20',
});

// Get user's bookings
const bookings = await getCustomerBookings(userId);
```

---

## 📚 API Reference

### Authentication

#### `signUpWithEmail(email, password, userData)`
Create a new user account.

```javascript
const result = await signUpWithEmail(
  'user@example.com',
  'password123',
  {
    name: 'John Doe',
    role: 'customer', // 'customer' or 'cleaner'
    phone: '555-1234',
  }
);
```

#### `signInWithEmail(email, password)`
Sign in an existing user.

```javascript
const result = await signInWithEmail('user@example.com', 'password123');
```

#### `getCurrentUser()`
Get the currently logged-in user (from session).

```javascript
const user = getCurrentUser();
if (user) {
  console.log('Logged in as:', user.email);
}
```

#### `signOut()`
Sign out the current user.

```javascript
await signOut();
```

#### `updateUserProfile(userId, updates)`
Update user profile information.

```javascript
await updateUserProfile(userId, {
  name: 'Jane Doe',
  phone: '555-5678',
  photoURL: 'https://...',
});
```

---

### Houses

#### `createHouse(userId, houseData)`
Create a new property.

```javascript
const house = await createHouse(userId, {
  nickname: 'My Apartment',
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
  },
  size: 1200,
  bedrooms: 2,
  bathrooms: 1,
  propertyType: 'apartment',
  accessInstructions: 'Use code 1234',
  parkingInfo: 'Street parking',
  petInfo: 'One small dog',
});
```

#### `getUserHouses(userId)`
Get all houses for a user.

```javascript
const houses = await getUserHouses(userId);
```

#### `updateHouse(houseId, updates)`
Update house information.

```javascript
await updateHouse(houseId, {
  nickname: 'Updated Name',
  size: 1300,
});
```

#### `deleteHouse(houseId)`
Delete a house.

```javascript
await deleteHouse(houseId);
```

---

### Bookings

#### `createBooking(bookingData)`
Create a new booking.

```javascript
const booking = await createBooking({
  customerId: userId,
  cleanerId: 'cleaner-123',
  houseId: house.id,
  serviceType: 'regular',
  addOns: ['inside-fridge', 'inside-oven'],
  selectedDate: {
    date: new Date().toISOString(),
    timeSlot: '9:00 AM - 12:00 PM',
  },
  pricingBreakdown: {
    basePrice: 100,
    addOnsTotal: 30,
    subtotal: 130,
    discount: 0,
    tax: 10.73,
    total: 140.73,
  },
  specialNotes: 'Please be careful with the antique vase',
});
```

#### `getCustomerBookings(customerId)`
Get all bookings for a customer.

```javascript
const bookings = await getCustomerBookings(userId);
```

#### `getCleanerBookings(cleanerId)`
Get all bookings for a cleaner.

```javascript
const bookings = await getCleanerBookings(cleanerId);
```

#### `updateBooking(bookingId, updates)`
Update booking information.

```javascript
await updateBooking(bookingId, {
  status: 'in_progress',
  specialNotes: 'Updated notes',
});
```

#### `cancelBooking(bookingId, reason)`
Cancel a booking.

```javascript
await cancelBooking(bookingId, 'Customer requested cancellation');
```

---

### Service Types & Add-ons

#### `getServiceTypes()`
Get all available service types.

```javascript
const services = await getServiceTypes();
// Returns: [{ id: 'regular', name: 'Regular Clean', ... }, ...]
```

#### `getAddOns()`
Get all available add-ons.

```javascript
const addOns = await getAddOns();
// Returns: [{ id: 'inside-fridge', name: 'Inside Fridge', ... }, ...]
```

---

### Promo Codes

#### `validatePromoCode(code, userId, serviceType, amount)`
Validate a promo code.

```javascript
const result = await validatePromoCode('WELCOME20', userId, 'regular', 100);

if (result.valid) {
  const discount = result.promo.type === 'percentage'
    ? (amount * result.promo.value / 100)
    : result.promo.value;
  
  console.log('Discount:', discount);
}
```

#### `applyPromoCode(promoId)`
Mark a promo code as used.

```javascript
await applyPromoCode(promo.id);
```

---

### Cleaners

#### `createCleanerProfile(userId, cleanerData)`
Create a cleaner profile.

```javascript
const cleaner = await createCleanerProfile(userId, {
  name: 'Jane Smith',
  headline: 'Professional Cleaner',
  bio: 'I love making homes sparkle!',
  yearsExperience: 5,
  specialties: ['Deep Cleaning', 'Move In/Out'],
  languages: ['English', 'Spanish'],
  serviceTypes: ['regular', 'deep', 'move'],
  availability: {
    monday: ['9:00 AM', '5:00 PM'],
    tuesday: ['9:00 AM', '5:00 PM'],
    // ...
  },
});
```

#### `getAllCleaners()`
Get all cleaner profiles.

```javascript
const cleaners = await getAllCleaners();
```

---

### Jobs

#### `createJob(bookingId)`
Create a job from a booking.

```javascript
const job = await createJob(booking.id);
```

#### `updateJobStatus(jobId, status)`
Update job status.

```javascript
await updateJobStatus(jobId, 'in_progress');
// Status: 'scheduled', 'en_route', 'in_progress', 'completed', 'cancelled'
```

---

### Notifications

#### `createNotification(userId, notificationData)`
Create a notification.

```javascript
await createNotification(userId, {
  type: 'booking_confirmed',
  title: 'Booking Confirmed',
  message: 'Your cleaning is scheduled for tomorrow at 9 AM',
  data: { bookingId: booking.id },
});
```

#### `getUserNotifications(userId)`
Get user's notifications.

```javascript
const notifications = await getUserNotifications(userId);
```

#### `markNotificationAsRead(notificationId)`
Mark notification as read.

```javascript
await markNotificationAsRead(notificationId);
```

---

## 🔧 Advanced Usage

### Export/Import Data

```javascript
import { exportDatabase, importDatabase } from './storage';

// Export all data (for backup)
const data = await exportDatabase();
console.log('Exported data:', data);

// Save to file
const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download...

// Import data (from backup)
await importDatabase(data);
```

### Direct Database Access

```javascript
import { getDoc, setDoc, updateDoc, deleteDoc, COLLECTIONS } from './storage';

// Get document
const user = await getDoc(COLLECTIONS.USERS, userId);

// Set document
await setDoc(COLLECTIONS.USERS, userId, userData);

// Update document
await updateDoc(COLLECTIONS.USERS, userId, { name: 'New Name' });

// Delete document
await deleteDoc(COLLECTIONS.USERS, userId);
```

---

## 🎨 Integration with React

### Create a Storage Context

```javascript
// src/context/StorageContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDB, initializeDatabase, getCurrentUser } from '../storage';

const StorageContext = createContext();

export const StorageProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const setup = async () => {
      await initDB();
      await initializeDatabase();
      const user = getCurrentUser();
      setCurrentUser(user);
      setIsReady(true);
    };
    
    setup();
  }, []);

  return (
    <StorageContext.Provider value={{ isReady, currentUser, setCurrentUser }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => useContext(StorageContext);
```

### Use in Components

```javascript
import { useStorage } from './context/StorageContext';
import { signInWithEmail } from './storage';

function LoginPage() {
  const { setCurrentUser } = useStorage();

  const handleLogin = async (email, password) => {
    const result = await signInWithEmail(email, password);
    
    if (result.success) {
      setCurrentUser(result.user);
      // Navigate to dashboard...
    }
  };

  return (
    // Your login form...
  );
}
```

---

## 📊 Data Structure

### Collections

- `users` - User accounts
- `cleaners` - Cleaner profiles
- `houses` - Customer properties
- `bookings` - Booking records
- `jobs` - Active/completed jobs
- `reviews` - Customer reviews
- `serviceTypes` - Available services
- `addOns` - Available add-ons
- `promoCodes` - Promotional codes
- `settings` - App configuration
- `notifications` - User notifications
- `messages` - In-app messages
- `paymentMethods` - Payment information

---

## 🔒 Security Notes

1. **Password Hashing**: Uses SHA-256 (for demo). In production, use bcrypt or similar.
2. **Session Management**: 24-hour session timeout.
3. **Data Validation**: Always validate data before storing.
4. **User Permissions**: Implement proper access control in your app logic.

---

## 🚀 Migration to Firebase

When ready to migrate to Firebase, you can:

1. Export your data: `const data = await exportDatabase()`
2. Set up Firebase
3. Import data to Firestore
4. Update imports to use Firebase functions

The API is designed to be compatible, so minimal code changes are needed!

---

## ✅ Pre-loaded Data

The database comes with:
- ✅ 4 service types (Regular, Deep, Move In/Out, Windows)
- ✅ 5 add-ons (Fridge, Oven, Cabinets, Laundry, Dishes)
- ✅ 3 promo codes (WELCOME20, SAVE10, DEEP25)
- ✅ App settings (tax rate, fees, etc.)

---

## 🎯 Next Steps

1. ✅ Initialize database in your app
2. ✅ Update authentication to use new storage
3. ✅ Update booking flow to use new storage
4. ✅ Test all features
5. ✅ Enjoy persistent data! 🎉

---

**Status**: Complete and ready to use! 🚀
