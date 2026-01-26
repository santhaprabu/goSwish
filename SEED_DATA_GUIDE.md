# 🌱 Seed Data Guide

## Quick Start

I've created a system to generate **30 customer profiles** and **30 cleaner profiles** with realistic Texas city data.

---

## 🚀 How to Use

### Option 1: Use the Seed Data Page (Recommended)

1. **Add the route** to your `App.jsx`:

```javascript
import SeedDataPage from './components/SeedDataPage';

// In your routes:
<Route path="/seed-data" element={<SeedDataPage />} />
```

2. **Start your dev server**:
```bash
npm run dev
```

3. **Visit the page**:
```
http://localhost:5173/seed-data
```

4. **Click "🌱 Seed All (30+30)"** to create all profiles

---

### Option 2: Use Programmatically

```javascript
import { initDB, initializeDatabase } from './storage';
import { seedAllData } from './storage/seedData';

// Initialize and seed
await initDB();
await initializeDatabase();

const result = await seedAllData();

if (result.success) {
  console.log(`Created ${result.customers.length} customers`);
  console.log(`Created ${result.cleaners.length} cleaners`);
}
```

---

## 🔑 Login Credentials

### Customers (30 profiles)
- **Emails**: `customer1@goswish.com` to `customer30@goswish.com`
- **Password**: `Customer123!`

### Cleaners (30 profiles)
- **Emails**: `cleaner1@goswish.com` to `cleaner30@goswish.com`
- **Password**: `Cleaner123!`

---

## 🌆 Texas Cities

Profiles are distributed across 5 major Texas cities:
- **Dallas** - 6 customers, 6 cleaners
- **Fort Worth** - 6 customers, 6 cleaners
- **Austin** - 6 customers, 6 cleaners
- **San Antonio** - 6 customers, 6 cleaners
- **Houston** - 6 customers, 6 cleaners

---

## 📊 What Gets Created

### Customer Profiles
Each customer has:
- ✅ User account with email/password
- ✅ Profile (name, phone, role)
- ✅ 1-2 houses with realistic addresses
- ✅ Property details (size, bedrooms, bathrooms)
- ✅ Access instructions, parking info, pet info

**Example Customer:**
```javascript
{
  email: "customer1@goswish.com",
  name: "James Wilson",
  role: "customer",
  phone: "555-123-4567",
  houses: [
    {
      nickname: "Home",
      address: {
        street: "1234 Main St",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        neighborhood: "Downtown"
      },
      size: 1500,
      bedrooms: 2,
      bathrooms: 2,
      propertyType: "apartment"
    }
  ]
}
```

### Cleaner Profiles
Each cleaner has:
- ✅ User account with email/password
- ✅ Profile (name, phone, role)
- ✅ Cleaner profile with bio, headline
- ✅ Years of experience (1-15 years)
- ✅ Specialties (Deep Cleaning, Move In/Out, etc.)
- ✅ Languages (English, Spanish, etc.)
- ✅ Service types and availability
- ✅ Location and service radius
- ✅ Rating and reviews (simulated)

**Example Cleaner:**
```javascript
{
  email: "cleaner1@goswish.com",
  name: "Maria Gonzalez",
  role: "cleaner",
  phone: "555-987-6543",
  cleanerProfile: {
    headline: "Professional & Reliable Cleaner",
    bio: "Professional cleaner with 5 years of experience...",
    yearsExperience: 5,
    specialties: ["Deep Cleaning", "Move In/Out"],
    languages: ["English", "Spanish"],
    baseLocation: {
      city: "Dallas",
      state: "TX",
      zip: "75201"
    },
    serviceRadius: 25,
    serviceTypes: ["regular", "deep", "move"],
    availability: {
      monday: ["9:00 AM", "5:00 PM"],
      tuesday: ["9:00 AM", "5:00 PM"],
      // ... more days
    },
    hourlyRate: 35,
    rating: 4.8,
    totalReviews: 87,
    completedJobs: 234
  }
}
```

---

## 🎯 Use Cases

### 1. Testing Booking Flow
```javascript
// Sign in as customer
await signInWithEmail('customer1@goswish.com', 'Customer123!');

// Get customer's houses
const houses = await getUserHouses(userId);

// Create booking with a cleaner
await createBooking({
  customerId: userId,
  cleanerId: 'cleaner-id-from-db',
  houseId: houses[0].id,
  serviceType: 'regular',
  // ... other data
});
```

### 2. Testing Cleaner Dashboard
```javascript
// Sign in as cleaner
await signInWithEmail('cleaner1@goswish.com', 'Cleaner123!');

// Get cleaner's bookings
const bookings = await getCleanerBookings(cleanerId);

// Get cleaner's jobs
const jobs = await getCleanerJobs(cleanerId);
```

### 3. Testing Search/Filter
```javascript
// Get all cleaners
const cleaners = await getAllCleaners();

// Filter by city
const dallasCleaners = cleaners.filter(c => 
  c.baseLocation.city === 'Dallas'
);

// Filter by specialty
const deepCleaners = cleaners.filter(c => 
  c.specialties.includes('Deep Cleaning')
);

// Filter by rating
const topCleaners = cleaners.filter(c => 
  c.rating >= 4.5
);
```

---

## 📈 Statistics

After seeding, you can view statistics:

```javascript
import { getSeedingStats } from './storage/seedData';

const stats = await getSeedingStats();

console.log(stats);
// {
//   total: {
//     users: 60,
//     customers: 30,
//     cleaners: 30,
//     cleanerProfiles: 30,
//     houses: 45
//   },
//   byCities: {
//     Dallas: { customers: 9, cleaners: 6 },
//     "Fort Worth": { customers: 9, cleaners: 6 },
//     Austin: { customers: 9, cleaners: 6 },
//     "San Antonio": { customers: 9, cleaners: 6 },
//     Houston: { customers: 9, cleaners: 6 }
//   }
// }
```

---

## 🔧 Advanced Usage

### Seed Only Customers
```javascript
import { createCustomerProfiles } from './storage/seedData';

const customers = await createCustomerProfiles();
console.log(`Created ${customers.length} customers`);
```

### Seed Only Cleaners
```javascript
import { createCleanerProfiles } from './storage/seedData';

const cleaners = await createCleanerProfiles();
console.log(`Created ${cleaners.length} cleaners`);
```

### Custom Seeding
You can modify `src/storage/seedData.js` to:
- Change the number of profiles
- Add more cities
- Customize names, specialties, etc.
- Add more data fields

---

## 🧹 Clean Up

To remove all seeded data:

```javascript
import { clearDatabase, initializeDatabase } from './storage';

// Clear everything
await clearDatabase();

// Reinitialize with default data only
await initializeDatabase();
```

Or use the "🗑️ Clear DB" button in the StorageTest page.

---

## ⚡ Performance

Seeding 60 profiles typically takes:
- **~10-15 seconds** for all 60 profiles
- **~5-7 seconds** for 30 customers
- **~5-7 seconds** for 30 cleaners

The process runs in the background and shows progress in the console.

---

## 🎨 Customization

### Add More Names
Edit `CUSTOMER_NAMES` and `CLEANER_NAMES` arrays in `seedData.js`

### Add More Cities
Edit `TEXAS_CITIES` object in `seedData.js`

### Change Specialties
Edit `SPECIALTIES` array in `seedData.js`

### Modify Profile Data
Edit the profile creation logic in `createCustomerProfiles()` and `createCleanerProfiles()`

---

## ✅ Checklist

- [ ] Add SeedDataPage route to App.jsx
- [ ] Start dev server: `npm run dev`
- [ ] Visit `/seed-data` page
- [ ] Click "🌱 Seed All (30+30)"
- [ ] Wait for completion (~10-15 seconds)
- [ ] View statistics
- [ ] Test login with `customer1@goswish.com` / `Customer123!`
- [ ] Test login with `cleaner1@goswish.com` / `Cleaner123!`

---

## 🎉 Ready to Use!

You now have 60 realistic test profiles ready for:
- ✅ Testing booking flows
- ✅ Testing cleaner dashboards
- ✅ Testing search and filters
- ✅ Demo presentations
- ✅ Development and debugging

**All with realistic Texas city data!** 🌆
