# Stripe Integration Test Guide

## Test Account
- **Email**: customer7@goswish.com
- **Password**: Customer123!

## Stripe Test Card
- **Card Number**: 4242 4242 4242 4242
- **Expiry**: 12/28 (or any future date)
- **CVC**: 123 (or any 3 digits)

## Test Procedure

### 1. Login
1. Open http://localhost:5173
2. Enter email: `customer7@goswish.com`
3. Click "Continue"
4. Enter password: `Customer123!`
5. Click "Login with Password"

### 2. Complete Profile (if prompted)
If you see "Complete Your Profile":
- First Name: Customer
- Last Name: Seven
- Phone: Any valid format (e.g., 555-123-4567)
- Click "Continue"

### 3. Add a Property (if needed)
If you don't have properties:
1. Click "Add Your First Property" or navigate to Houses tab
2. Fill in property details:
   - Nickname: My Home
   - Street: 123 Main St
   - City: Dallas
   - State: TX
   - ZIP: 75001
   - Square Feet: 2000
   - Bedrooms: 3
   - Bathrooms: 2
3. Click "Save Property"

### 4. Test Booking Flow with Stripe

#### Step 1: Start Booking
1. Go to Home tab
2. Click "Book a Cleaning" button

#### Step 2: Select Property
1. Select your property
2. Click "Continue"

#### Step 3: Choose Service
1. Select "Regular Clean"
2. Note the estimated price
3. Click "Continue"

#### Step 4: Add-ons (Optional)
1. Select any add-ons if desired
2. Click "Continue"

#### Step 5: Schedule
1. Select a date (tomorrow or later)
2. Select a time slot (Morning, Afternoon, or Evening)
3. Click "Continue"

#### Step 6: Special Instructions (Optional)
1. Add any notes or skip
2. Click "Continue"

#### Step 7: Payment (STRIPE TEST)
**This is where Stripe integration is tested:**

1. You should see:
   - Order summary with total
   - A Stripe card input field (single field for card, expiry, CVC)
   
2. Enter test card details:
   - Type: `4242424242424242` (no spaces needed, Stripe formats it)
   - The field will show: `4242 4242 4242 4242`
   - Expiry: `1228` (will format to `12/28`)
   - CVC: `123`

3. Click the "Pay $XX.XX" button

4. **Expected Results:**
   - Loading indicator appears
   - Payment processes through Stripe
   - Success screen appears with "Booking Confirmed!"
   - Booking ID is displayed

### 5. Verify Payment Method Storage

1. Go to Profile tab
2. Click "Payment Methods"
3. You should see the card ending in 4242 listed

## Expected Console Output

Open browser DevTools (F12) and check Console for:
```
Payment Success: {id: "pm_...", card: {...}}
```

## Troubleshooting

### If you see errors about missing modules:
The app is using Stripe.js from CDN (loaded in index.html), so npm packages aren't required.

### If card input doesn't appear:
1. Check browser console for errors
2. Verify Stripe.js loaded: Type `Stripe` in console - should show function
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### If payment fails:
1. Check console for error messages
2. Verify test card number is exactly: 4242424242424242
3. Ensure expiry is in future
4. Try different test cards from: https://stripe.com/docs/testing

## Additional Test Cards

### Success Cards:
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **Amex**: 3782 822463 10005

### Decline Cards (for testing error handling):
- **Generic Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

## Success Criteria

✅ Card input field renders properly (Stripe Elements)
✅ Test card is accepted
✅ Payment processes without errors
✅ Booking confirmation appears
✅ Console shows payment method ID
✅ Card appears in Payment Methods screen

## Notes

- All payments are in TEST mode
- No real charges are made
- Payment methods are tokenized by Stripe
- The Secret Key is NOT used in the frontend (security best practice)
