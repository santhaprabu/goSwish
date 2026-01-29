# GoSwish Deployment Guide

This guide explains how to deploy your GoSwish application to the cloud so others can access it.

Since your app uses **Vite + React** for the frontend and **Firebase** for the backend, you have two excellent options:
1.  **Vercel** (Easiest, zero-config).
2.  **Firebase Hosting** (Keeps everything in one place).

---

## 🛑 CRITICAL STEP: Firebase Configuration

**Before deploying**, you must replace the placeholder values in your `.env` file with your actual Firebase credentials.
Currently, your `.env` file has placeholders like `YOUR_API_KEY`.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**GoSwish**).
3.  Click the **Gear Icon** (Settings) > **Project settings**.
4.  Scroll down to the **Your apps** section.
5.  Copy the configuration values (apiKey, authDomain, etc.).
6.  Update your `.env` file (or keep them ready to paste into Vercel).

---

## Option 1: Deploy to Vercel (Recommended for Speed)

Vercel is optimized for frontend frameworks and is very easy to set up.

### Method A: Using Git (Best Practice)
1.  Push your code to **GitHub**, **GitLab**, or **Bitbucket**.
2.  Go to [Vercel.com](https://vercel.com) and sign up/login.
3.  Click **"Add New..."** > **"Project"**.
4.  Import your GoSwish repository.
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add each variable from your `.env` file (e.g., `VITE_FIREBASE_API_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, etc.).
6.  Click **Deploy**.

### Method B: Using Vercel CLI (Manual)
1.  Install Vercel CLI:
    ```bash
    npm install -g vercel
    ```
2.  Run the deploy command:
    ```bash
    vercel
    ```
3.  Follow the prompts (login, confirm project settings).
4.  When asked about existing environment variables, choose to upload them or manually add them in the dashboard later.

---

## Option 2: Deploy to Firebase Hosting

Since you are already using Firebase for Auth and Database, using Firebase Hosting is a natural choice.

### 1. Install Firebase Tools
If you haven't already:
```bash
npm install -g firebase-tools
```

### 2. Login
```bash
firebase login
```

### 3. Initialize Hosting
Run this in your project root:
```bash
firebase init hosting
```
*   **Select Project**: Choose your existing **GoSwish** project.
*   **Public directory**: Type `dist` (Vite builds to `dist`, not public).
*   **Configure as a single-page app (rewrite all urls to /index.html)?**: **Yes** (Important for React Router).
*   **Set up automatic builds and deploys with GitHub?**: Optional (No for now).
*   **File exists (dist/index.html)? Overwrite?**: **No** (if asked).

### 4. Build and Deploy
You must build your local project first so the env vars are baked in:
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://your-project-id.web.app`!

---

## Troubleshooting

### "White Screen" after deployment
*   Check the browser console (F12). If you see 404s for assets, ensure your build settings are correct (Output directory: `dist`).
*   If you see Firebase errors, checking your **Environment Variables** is the first step. They must be set in the deployment platform settings (Vercel) or baked into the build (Firebase Hosting).

### Authentication Errors (Google Sign-In)
*   You must add your new domain (e.g., `goswish.vercel.app` or `goswish.web.app`) to the **Authorized Domains** list in Firebase Console.
    *   Go to **Authentication** > **Settings** > **Authorized domains**.
    *   Add your deployed URL.
