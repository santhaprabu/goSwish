# Firebase Backend - Quick Reference

## 🚀 Quick Start

### 1. Install Firebase (In Progress)
```bash
npm install firebase@10.13.2 --legacy-peer-deps
```

### 2. Get Your Firebase Config
1. Go to https://console.firebase.google.com/
2. Create project: "GoSwish"
3. Add web app
4. Copy config object

### 3. Update Config File
Edit `src/firebase/config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Enable Services
- ✅ Authentication → Email/Password
- ✅ Authentication → Google
- ✅ Firestore Database → Create
- ✅ Storage → Enable

### 5. Test It!
```bash
npm run dev
# Try signing up!
```

---

## 📖 Common Operations

### Sign Up User
```javascript
import { signUpWithEmail } from './firebase/auth';

const result = await signUpWithEmail(
  'user@example.com',
  'password123',
  { name: 'John', role: 'customer' }
);
```

### Sign In User
```javascript
import { signInWithEmail } from './firebase/auth';

const result = await signInWithEmail(
  'user@example.com',
  'password123'
);
```

### Create Booking
```javascript
import { createBooking } from './firebase/firestore';

const result = await createBooking({
  customerId: user.uid,
  serviceType: 'deep',
  // ... other data
});
```

### Listen to Updates
```javascript
import { subscribeToBooking } from './firebase/firestore';

const unsubscribe = subscribeToBooking(
  bookingId,
  (booking) => {
    console.log('Updated:', booking);
  }
);
```

---

## 🔐 Security Rules

### Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /jobs/{jobId}/photos/{photoId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🐛 Troubleshooting

### Firebase Not Connecting
1. Check config in `src/firebase/config.js`
2. Verify project ID matches
3. Check browser console for errors

### Auth Not Working
1. Enable Email/Password in Firebase Console
2. Enable Google Sign-In
3. Add authorized domain

### Data Not Saving
1. Check Firestore rules
2. Verify user is authenticated
3. Check browser console

---

## 📚 Documentation

- **Setup**: `FIREBASE_SETUP.md`
- **Integration**: `FIREBASE_INTEGRATION.md`
- **Complete Guide**: `COMPLETE_SUMMARY.md`

---

## ✅ Checklist

- [ ] Firebase installed
- [ ] Config added
- [ ] Auth enabled
- [ ] Firestore created
- [ ] Rules added
- [ ] Tested signup
- [ ] Tested signin
- [ ] Tested database

---

**Status**: Installing Firebase...  
**Next**: Complete setup steps above!
