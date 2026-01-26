# Firebase Backend Setup Guide

## 🔥 Firebase Integration Complete!

Your GoSwish app now has Firebase backend support with:
- ✅ Authentication (Email/Password, Google)
- ✅ Firestore Database
- ✅ Cloud Storage (ready)
- ✅ Cloud Functions (ready)

---

## 📋 Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: **GoSwish**
4. Enable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Register Web App

1. In Firebase Console, click the **Web icon** (</>)
2. Register app name: **GoSwish Web**
3. Enable Firebase Hosting (optional)
4. Click "Register app"
5. **Copy the Firebase configuration object**

### Step 3: Add Firebase Configuration

1. Open `src/firebase/config.js`
2. Replace the placeholder config with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX" // Optional
};
```

### Step 4: Enable Authentication

1. In Firebase Console → **Authentication**
2. Click "Get Started"
3. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. Enable **Google Sign-In**:
   - Click "Google"
   - Toggle "Enable"
   - Enter support email
   - Click "Save"

### Step 5: Create Firestore Database

1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll add rules later)
4. Select location (e.g., `us-central1`)
5. Click "Enable"

### Step 6: Set Up Firestore Security Rules

1. In Firestore → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
      
      // Houses subcollection
      match /houses/{houseId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Cleaners collection
    match /cleaners/{cleanerId} {
      allow read: if isSignedIn();
      allow write: if isOwner(cleanerId);
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if isSignedIn() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.cleanerId == request.auth.uid
      );
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.cleanerId == request.auth.uid
      );
    }
    
    // Job Offers collection
    match /jobOffers/{offerId} {
      allow read: if isSignedIn() && resource.data.cleanerId == request.auth.uid;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.cleanerId == request.auth.uid;
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      allow read: if isSignedIn() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.cleanerId == request.auth.uid
      );
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.cleanerId == request.auth.uid
      );
      
      // Photos subcollection
      match /photos/{photoId} {
        allow read, write: if isSignedIn();
      }
      
      // Checklist subcollection
      match /checklist/{itemId} {
        allow read, write: if isSignedIn();
      }
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if resource.data.isPublic == true || isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.customerId == request.auth.uid;
    }
  }
}
```

3. Click "Publish"

### Step 7: Enable Cloud Storage

1. In Firebase Console → **Storage**
2. Click "Get Started"
3. Choose **Production mode**
4. Select same location as Firestore
5. Click "Done"

### Step 8: Set Up Storage Security Rules

1. In Storage → **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Job photos
    match /jobs/{jobId}/photos/{photoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // User profile photos
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cleaner photos
    match /cleaners/{cleanerId}/photos/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == cleanerId;
    }
  }
}
```

3. Click "Publish"

---

## 🔧 Environment Variables (Optional)

Create `.env` file in project root:

```env
# Firebase Emulators (for local development)
VITE_USE_FIREBASE_EMULATORS=false

# Set to true to use local emulators
# VITE_USE_FIREBASE_EMULATORS=true
```

---

## 🧪 Testing Firebase Connection

### Test Authentication

1. Run your app: `npm run dev`
2. Try signing up with email/password
3. Check Firebase Console → Authentication → Users
4. You should see the new user!

### Test Firestore

1. Create a booking in your app
2. Check Firebase Console → Firestore Database
3. You should see the `bookings` collection!

### Test Real-time Updates

1. Open your app in two browser tabs
2. Make a change in one tab
3. See it update in the other tab!

---

## 📊 Firestore Collections Structure

Your database will have these collections:

```
/users/{userId}
  - email, role, profile, notificationPreferences
  /houses/{houseId}
    - address, sqft, bedrooms, bathrooms

/cleaners/{cleanerId}
  - name, bio, rating, stats, onboardingStatus

/bookings/{bookingId}
  - customerId, cleanerId, serviceType, status, pricing

/jobOffers/{offerId}
  - bookingId, cleanerId, earnings, status

/jobs/{jobId}
  - bookingId, cleanerId, status, photos, checklist
  /photos/{photoId}
  /checklist/{itemId}

/reviews/{reviewId}
  - customerId, cleanerId, rating, text

/payouts/{payoutId}
  - cleanerId, amount, status, jobIds

/teams/{teamId}
  - leaderId, members, stats
```

---

## 🚀 Next Steps

### Immediate
1. ✅ Complete Firebase setup (above steps)
2. ✅ Test authentication
3. ✅ Test database operations
4. ✅ Verify security rules

### Short Term
1. Add Cloud Functions for:
   - Auto-approval after 24 hours
   - Job matching algorithm
   - Email notifications
   - Payout processing
2. Add Firebase Cloud Messaging for push notifications
3. Add Firebase Analytics

### Production
1. Upgrade to Blaze plan (pay-as-you-go)
2. Set up billing alerts
3. Enable backups
4. Add monitoring
5. Deploy to Firebase Hosting

---

## 💰 Pricing Estimate

### Spark Plan (Free)
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ 10 GB/month transfer
- ✅ Good for development & testing

### Blaze Plan (Production)
Estimated monthly cost for 1,000 active users:
- Firestore: ~$25-50
- Storage: ~$10-20
- Functions: ~$10-30
- **Total: ~$45-100/month**

---

## 🔐 Security Best Practices

1. **Never commit Firebase config to public repos**
   - Add `.env` to `.gitignore`
   - Use environment variables

2. **Use Security Rules**
   - Test rules in Firebase Console
   - Restrict access appropriately

3. **Enable App Check** (recommended)
   - Protects against abuse
   - Free tier available

4. **Monitor Usage**
   - Set up billing alerts
   - Review usage regularly

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✅ Checklist

- [ ] Create Firebase project
- [ ] Register web app
- [ ] Add Firebase config to `src/firebase/config.js`
- [ ] Enable Email/Password authentication
- [ ] Enable Google Sign-In
- [ ] Create Firestore database
- [ ] Set up Firestore security rules
- [ ] Enable Cloud Storage
- [ ] Set up Storage security rules
- [ ] Test authentication
- [ ] Test database operations
- [ ] Verify real-time updates work

---

**Status**: Firebase Backend Ready! 🔥  
**Next**: Complete setup steps above and test!
