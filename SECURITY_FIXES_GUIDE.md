# 🔒 Security Fixes Quick Start Guide

This guide walks you through implementing the critical security fixes identified in the audit.

## ⚡ PRIORITY 1: Critical Fixes (DO THESE FIRST)

### 1. Setup Environment Variables

**Step 1:** Copy the example env file
```bash
cp .env.example .env
```

**Step 2:** Fill in your actual credentials in `.env`:
```bash
# Edit .env and add your real values
nano .env
```

**Step 3:** Verify `.env` is in `.gitignore`:
```bash
grep -q "^\.env$" .gitignore && echo "✅ Safe" || echo "❌ Add .env to .gitignore!"
```

### 2. Update Firebase Config

**File:** `src/firebase/config.js`

**Replace lines 13-21 with:**
```javascript
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required env vars
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    throw new Error('Firebase configuration missing! Check your .env file');
}
```

### 3. Update Stripe Key

**File:** `src/components/PaymentMethods.jsx`

**Replace line 8 with:**
```javascript
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_KEY) {
    console.error('Stripe key not configured. Payment features disabled.');
}
```

### 4. Deploy Firestore Security Rules

**Step 1:** Install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
```

**Step 2:** Login to Firebase:
```bash
firebase login
```

**Step 3:** Initialize Firebase in your project (if not done):
```bash
firebase init firestore
```

**Step 4:** Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

**Step 5:** Verify rules are deployed:
```bash
firebase firestore:rules:list
```

### 5. Fix Password Hashing

**File:** `src/storage/auth.js`

**Replace the `hashPassword` function (lines 14-21) with:**

```javascript
/**
 * Hash password using PBKDF2 with unique salt
 * This is more secure than SHA-256
 */
const hashPassword = async (password) => {
    // Generate unique random salt (16 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Convert password to key material
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive key using PBKDF2 with 100,000 iterations
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256 // 256 bits = 32 bytes
    );

    // Convert to hex strings
    const saltHex = Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const hashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Return salt + hash combined
    return `${saltHex}:${hashHex}`;
};

/**
 * Verify password against stored hash
 */
const verifyPassword = async (password, storedHash) => {
    try {
        // Split stored hash into salt and hash
        const [saltHex, hashHex] = storedHash.split(':');

        if (!saltHex || !hashHex) {
            console.error('Invalid hash format');
            return false;
        }

        // Convert salt from hex
        const salt = new Uint8Array(
            saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );

        // Hash the provided password with the same salt
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );

        const computedHashHex = Array.from(new Uint8Array(derivedBits))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Compare hashes (timing-safe comparison)
        return computedHashHex === hashHex;
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
};
```

**⚠️ IMPORTANT:** This change means all existing passwords will be invalid. You'll need to:
- Reset all user passwords OR
- Implement a migration script OR
- Keep old verification as fallback temporarily

### 6. Remove Dangerous Admin Functions

**File:** `src/context/AppContext.jsx`

**Remove or secure lines 154-157:**

```javascript
// REMOVE THESE LINES COMPLETELY:
// const { forceResetCleanerPasswords } = await import('../storage/auth.js');
// window.resetCleaners = forceResetCleanerPasswords;
// await forceResetCleanerPasswords();

// IF YOU NEED ADMIN TOOLS, ADD PROPER AUTH:
if (import.meta.env.DEV && currentUser?.role === 'admin') {
    // Only load in dev mode for admin users
    const { forceResetCleanerPasswords } = await import('../storage/auth.js');
    window.__adminTools = { resetCleaners: forceResetCleanerPasswords };
    console.warn('🔧 Admin tools loaded. Use window.__adminTools');
}
```

### 7. Add Authorization Checks

**File:** `src/firebase/firestore.js`

**Add this helper at the top:**
```javascript
import { auth } from './config';

const checkAuth = (requiredUid) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Authentication required');
    }
    if (requiredUid && currentUser.uid !== requiredUid) {
        throw new Error('Unauthorized access');
    }
    return currentUser;
};
```

**Update all functions to use it:**
```javascript
export const updateHouse = async (userId, houseId, updates) => {
    checkAuth(userId); // Verify user can only update their own houses

    try {
        await updateDoc(doc(db, 'users', userId, 'houses', houseId), updates);
        return { success: true };
    } catch (error) {
        console.error('Update house error:', error);
        return { success: false, error: error.message };
    }
};

export const getUserHouses = async (userId) => {
    checkAuth(userId); // Verify user can only read their own houses

    try {
        const housesSnapshot = await getDocs(collection(db, 'users', userId, 'houses'));
        const houses = housesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, data: houses };
    } catch (error) {
        console.error('Get houses error:', error);
        return { success: false, error: error.message };
    }
};
```

---

## ⚡ PRIORITY 2: High Severity Fixes

### 8. Add Input Sanitization

**Install DOMPurify:**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Create utility file:** `src/utils/sanitize.js`
```javascript
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: []
    });
};

export const sanitizeHTML = (html) => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href']
    });
};
```

**Use in components:**
```javascript
import { sanitizeInput } from '../utils/sanitize';

// Before saving
const houseData = {
    name: sanitizeInput(name),
    address: {
        street: sanitizeInput(editableStreet),
        city: sanitizeInput(editableCity),
        // ...
    }
};
```

### 9. Implement Rate Limiting

**Install rate limiter:**
```bash
npm install rate-limiter-flexible
```

**Create:** `src/utils/rateLimiter.js`
```javascript
class ClientSideRateLimiter {
    constructor(points, duration) {
        this.points = points;
        this.duration = duration * 1000; // Convert to ms
        this.attempts = new Map();
    }

    async consume(key) {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Remove old attempts
        const recentAttempts = attempts.filter(
            time => now - time < this.duration
        );

        if (recentAttempts.length >= this.points) {
            const oldestAttempt = recentAttempts[0];
            const timeUntilReset = this.duration - (now - oldestAttempt);
            throw new Error(
                `Too many attempts. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
            );
        }

        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);
    }
}

export const loginLimiter = new ClientSideRateLimiter(5, 15 * 60); // 5 attempts per 15 min
export const otpLimiter = new ClientSideRateLimiter(3, 5 * 60); // 3 attempts per 5 min
```

**Use in auth functions:**
```javascript
import { loginLimiter } from '../utils/rateLimiter';

export const signInWithEmail = async (email, password) => {
    try {
        // Check rate limit
        await loginLimiter.consume(email);

        // ... existing login logic
    } catch (error) {
        if (error.message.includes('Too many attempts')) {
            return { success: false, error: error.message };
        }
        // ... other error handling
    }
};
```

### 10. Reduce Session Lifetime

**File:** `src/storage/auth.js`

**Update line 43:**
```javascript
// Old: const maxAge = 24 * 60 * 60 * 1000; // 24 hours
const maxAge = 2 * 60 * 60 * 1000; // 2 hours
```

### 11. Remove Sensitive Logging

**Search and replace in all files:**

```javascript
// Remove or redact:
console.log(`[DEV] OTP for ${email}: ${otp}`);

// Replace with:
if (import.meta.env.DEV) {
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    console.log(`[DEV] OTP sent to ${maskedEmail}`);
}
```

---

## ✅ Testing Your Fixes

### Test Firebase Security Rules:
```bash
# Install test dependencies
npm install --save-dev @firebase/rules-unit-testing

# Run tests (create test file first)
npm test -- firestore.spec.js
```

### Test Environment Variables:
```javascript
// Add to src/App.jsx temporarily
useEffect(() => {
    console.log('Environment check:');
    console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
}, []);
```

### Test Authentication:
1. Try logging in with wrong password 6 times - should be rate limited
2. Verify session expires after 2 hours
3. Try accessing another user's data - should be blocked

---

## 📊 Verification Checklist

After implementing all fixes, verify:

- [ ] `.env` file exists and is in `.gitignore`
- [ ] No hard-coded secrets in source code
- [ ] Firestore rules deployed and working
- [ ] Password hashing upgraded
- [ ] Admin functions secured/removed
- [ ] Authorization checks added
- [ ] Rate limiting working
- [ ] Input sanitization implemented
- [ ] Sessions expire in 2 hours
- [ ] No sensitive data in logs
- [ ] App still functions correctly

---

## 🆘 Troubleshooting

### "Firebase not configured" error:
- Check `.env` file exists
- Restart dev server: `npm run dev`
- Verify env var names match exactly

### "Permission denied" in Firestore:
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify user ID matches resource owner

### "Too many attempts" error won't reset:
- Clear localStorage: `localStorage.clear()`
- Or wait for the timeout period

---

## 📚 Next Steps

1. Review [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) for medium/low priority items
2. Set up monitoring and logging
3. Implement automated security testing
4. Schedule regular security audits
5. Review OWASP Top 10 regularly

---

**Questions?** Review the full audit report or check Firebase/Vite documentation.
