// Firebase Configuration
// This file contains Firebase initialization and configuration

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration from environment variables
// This keeps sensitive credentials out of source code
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate configuration in development
if (import.meta.env.DEV) {
    const missingVars = [];
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') missingVars.push('VITE_FIREBASE_API_KEY');
    if (!firebaseConfig.authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
    if (!firebaseConfig.projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');

    if (missingVars.length > 0) {
        console.warn('⚠️ Firebase configuration incomplete. Missing:', missingVars.join(', '));
        console.warn('📝 Please check your .env file');
    }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development (optional but recommended)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    console.log('🔧 Connecting to Firebase Emulators...');

    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);

    console.log('✅ Connected to Firebase Emulators');
}

export default app;
