# 🚀 GoSwish Customer Booking Flow - Testing Guide

## Quick Start - Automated Testing

### Option 1: Run Automation Script (Recommended)

1. **Make sure the app is running:**
   ```bash
   npm run dev
   ```

2. **Open the browser:**
   - Navigate to http://localhost:5173/

3. **Open Browser DevTools:**
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Go to the **Console** tab

4. **Load and run the automation:**
   ```javascript
   // Copy and paste the entire contents of scripts/automate-booking.js
   // Then run:
   await automateCustomerBooking()
   ```

5. **Watch the magic happen! ✨**
   - The script will automatically complete the entire booking flow
   - Check the console for progress updates
   - Final booking confirmation will appear on screen

---

## Option 2: Manual Testing Steps

### Step 1: Select Role
- Click **"I'm a Customer"**

### Step 2: Login
- **Email:** `customer1@goswish.com`
- **Password:** `Customer123!`
- Click **"Continue"**

### Step 3: Start Booking
- Click **"Book a Cleaning"** button on home screen

### Step 4: Select Property ✅
- Choose any house from your properties
- Click **"Continue"**

### Step 5: Select Service Type ✨
- Choose **"Regular Clean"** (or any service)
- Click **"Continue"**

### Step 6: Add-ons (Optional) 🎁
- Select any add-ons or skip
- Click **"Continue"**

### Step 7: Date & Time Selection 📅
- Click a future date on the calendar
- Select a time slot:
  - **Morning** (9 AM - 12 PM)
  - **Afternoon** (12 PM - 3 PM)
  - **Evening** (3 PM - 6 PM)
- Click **"Continue"**

### Step 8: Special Notes 📝
- Add any special instructions (optional)
- Example: "Please focus on the kitchen"
- Click **"Continue"**

### Step 9: Payment 💳
Fill in the test card details:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** `12/25`
- **CVC:** `123`
- **ZIP Code:** `75201`
- Click **"Complete Booking"**

### Step 10: Confirmation ✅
- Wait for booking confirmation screen
- Note the **Booking ID** (format: BKG-XXXXXX)
- Check booking details

---

## Test Credentials

### Customer Accounts (1-30)
- **Email:** `customer1@goswish.com` to `customer30@goswish.com`
- **Password:** `Customer123!`
- Each customer has 2-4 properties

### Cleaner Accounts (1-20)
- **Email:** `cleaner1@goswish.com` to `cleaner20@goswish.com`
- **Password:** `Cleaner123!`

---

## Expected Results

### ✅ Successful Booking Should Show:
1. **Booking confirmation screen**
2. **Booking ID** (e.g., BKG-123456)
3. **Selected property details**
4. **Service type and date**
5. **Total amount charged**
6. **Cleaner matching status**

### 📊 Booking Status Flow:
1. **confirmed** - Initial state after payment
2. **matched** - Cleaner assigned
3. **in-progress** - Cleaning started
4. **completed** - Job finished

---

## Verification Checklist

After completing a booking, verify:

- [ ] Booking appears in "My Bookings" tab
- [ ] Booking ID is displayed
- [ ] Property details are correct
- [ ] Service type matches selection
- [ ] Date and time are accurate
- [ ] Payment amount is correct
- [ ] No console errors
- [ ] No memory leak warnings

---

## Troubleshooting

### ❌ If Login Fails:
- Verify credentials: `customer1@goswish.com` / `Customer123!`
- Check browser console for errors
- Clear browser cache and reload

### ❌ If Property Selection Fails:
- Make sure customer has houses added
- Check "My Properties" tab
- Add a property if none exist

### ❌ If Payment Fails:
- Use test card: `4242 4242 4242 4242`
- Check all fields are filled correctly
- Wait for payment processing (2-3 seconds)

### ❌ If Automation Script Fails:
- Refresh the page and try again
- Check browser console for specific error
- Try manual testing steps instead

---

## Performance Testing

### Test Async Fixes:
1. **Start a booking**
2. **Rapidly navigate away** (click back multiple times)
3. **Check console** - should have no warnings
4. **Return and complete booking**
5. **Verify** no memory leaks or stale data

### Test Multiple Bookings:
1. Complete 3-5 bookings in succession
2. Check "My Bookings" tab
3. Verify all bookings appear correctly
4. No duplicate IDs should exist

---

## Demo Flow (5 minutes)

**Perfect for demonstrating the app:**

1. **Start:** Home screen (0:00)
2. **Login:** customer1@goswish.com (0:30)
3. **Select:** First property + Regular Clean (1:00)
4. **Date:** Tomorrow morning (1:30)
5. **Notes:** "Please focus on kitchen" (2:00)
6. **Pay:** Test card details (2:30)
7. **Confirm:** Show booking ID (3:00)
8. **Navigate:** Show in My Bookings (3:30)
9. **Switch:** Show cleaner view (4:00)
10. **Jobs:** Show job offers (4:30)

---

## Notes

- **Payment simulation:** 2.5 second delay
- **10% chance:** Random payment failure (for testing error handling)
- **Booking matching:** Automatic in demo (real app uses Cloud Functions)
- **All data:** In-memory (resets on page refresh)

---

## Quick Commands

### Start Development Server:
```bash
cd "/Users/santhajeyaseelan/Library/Mobile Documents/com~apple~CloudDocs/Drive-08082025/MyBusiness/Trivine Technology Solutions/GoSwish/Workspace"
npm run dev
```

### Run Automation (Browser Console):
```javascript
await automateCustomerBooking()
```

### Clear All Data:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

**Happy Testing! 🎉**
