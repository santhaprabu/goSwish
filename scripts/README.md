# 🤖 Automated Customer Booking Flow

This directory contains scripts and guides for automating and testing the complete customer booking flow in GoSwish.

## 📁 Files

### Scripts
- **`automate-booking.js`** - Browser automation script for complete booking flow
- **`run-booking-test.js`** - Helper script that displays instructions

### Documentation
- **`../BOOKING_FLOW_TESTING_GUIDE.md`** - Comprehensive testing guide
- **`../ASYNC_FIXES_SUMMARY.md`** - Documentation of async code fixes

---

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The app will run on http://localhost:5173/

### 2. Open Browser

Navigate to http://localhost:5173/ in your browser

### 3. Run Automation

Open Browser DevTools (F12 or Cmd+Option+I), go to Console tab, then:

```javascript
// Copy and paste the entire contents of scripts/automate-booking.js
// Then run:
await automateCustomerBooking()
```

### 4. Watch It Work! ✨

The script will automatically:
1. Select Customer role
2. Login as customer1@goswish.com  
3. Start new booking
4. Select first property
5. Choose Regular Clean service
6. Select tomorrow morning slot
7. Add special notes
8. Complete payment with test card
9. Show booking confirmation

---

## 📖 What the Automation Does

### Step-by-Step Flow

| Step | Action | Details |
|------|--------|---------|
| 1 | **Role Selection** | Clicks "I'm a Customer" |
| 2 | **Login** | Uses customer1@goswish.com / Customer123! |
| 3 | **Navigate** | Clicks "Book a Cleaning" |
| 4 | **Property** | Selects first available house |
| 5 | **Service** | Chooses Regular Clean |
| 6 | **Add-ons** | Skips (optional) |
| 7 | **Date/Time** | Tomorrow + Morning slot |
| 8 | **Notes** | Adds "Focus on kitchen" |
| 9 | **Payment** | Test card: 4242 4242 4242 4242 |
| 10 | **Confirm** | Shows booking ID |

---

## 🧪 Testing

### Automated Testing

```bash
# Show instructions
node scripts/run-booking-test.js
```

Then follow the displayed instructions to run the automation in your browser.

### Manual Testing

See `../BOOKING_FLOW_TESTING_GUIDE.md` for detailed manual testing steps.

---

## 🔧 Customization

### Modify the Script

Edit `automate-booking.js` to customize:

```javascript
// Change login credentials
await fillInput('input[type="email"]', 'customer2@goswish.com', 'Email field');

// Select different service
const deepCleanButton = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('Deep'));

// Add different notes
notesArea.value = 'Your custom instructions here';

// Use different test card
input.value = '4000 0566 5566 5556'; // Different test card
```

### Helper Functions Available

```javascript
wait(ms)                          // Async delay
clickElement(selector, desc)      // Click by selector
clickByText(text, desc)          // Click by text content
fillInput(selector, value, desc)  // Fill input field
clickFirstVisibleButton(text)    // Click first matching button
```

---

## 🎯 Success Criteria

After running the automation, verify:

✅ Booking confirmation screen appears  
✅ Booking ID is displayed (format: BKG-XXXXXX)  
✅ Property details are correct  
✅ Service and date match selections  
✅ Payment amount is shown  
✅ No console errors  
✅ Booking appears in "My Bookings" tab  

---

## ⚠️ Troubleshooting

### Script Fails to Start

**Issue:** "Element not found" errors  
**Solution:** 
- Refresh the page
- Make sure you're on http://localhost:5173/
- Check that dev server is running

### Login Fails

**Issue:** Can't login with test credentials  
**Solution:**
- Verify email: customer1@goswish.com
- Verify password: Customer123!
- Clear browser cache if needed

### Payment Fails

**Issue:** Payment doesn't process  
**Solution:**
- Check test card: 4242 4242 4242 4242
- Wait for form to be fully loaded
- Try manual testing instead

### Async Issues

**Issue:** Components unmount during automation  
**Solution:**
- All async issues have been fixed!
- See `../ASYNC_FIXES_SUMMARY.md` for details
- No action needed - script handles this

---

## 📊 Test Data

### Customer Accounts (30 total)
```
Email: customer1@goswish.com to customer30@goswish.com
Password: Customer123!
Properties: 2-4 per customer
```

### Cleaner Accounts (20 total)
```
Email: cleaner1@goswish.com to cleaner20@goswish.com  
Password: Cleaner123!
```

### Test Payment Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
```

---

## 🔍 Debugging

### Enable Verbose Logging

The automation script already logs each step. Check browser console for:

```
🖱️  Clicking: [description]
⌨️  Filling: [field] = [value]
📋 Step X: [action]
✅ SUCCESS! Booking completed
```

### Pause Execution

Add breakpoints in the script:

```javascript
// Add after any step
debugger;  // Script will pause here
await wait(5000);  // Or add longer delay
```

### Manual Fallback

If automation fails at any step, continue manually from that point.

---

## 📝 Notes

- **Simulation Time:** ~30 seconds for complete flow
- **Payment Delay:** 2.5 seconds (simulated processing)
- **Failure Rate:** 10% random payment failure (for testing)
- **Data Persistence:** In-memory only (resets on refresh)
- **Async Safety:** All cleanup functions active ✅

---

## 🎬 Demo Mode

Perfect 5-minute demo flow:

```javascript
// Run standard automation
await automateCustomerBooking()

// Then manually:
// 1. Show booking in "My Bookings"
// 2. Navigate to Profile
// 3. Switch to Cleaner view
// 4. Show job offers
// 5. Accept a job
// 6. Show job execution
```

---

## 📚 Additional Resources

- **Testing Guide:** ../BOOKING_FLOW_TESTING_GUIDE.md
- **Async Fixes:** ../ASYNC_FIXES_SUMMARY.md
- **Multi-Home Info:** ../MULTI_HOME_UPDATE.md

---

## ✨ Features

### What's Automated
✅ Complete booking flow  
✅ Form field population  
✅ Date and time selection  
✅ Payment processing  
✅ Error handling  
✅ Success verification  

### What's NOT Automated
❌ Email verification  
❌ Photo uploads  
❌ Real payment processing  
❌ Cleaner matching (instant in demo)  
❌ Live tracking  

---

## 🚀 Ready to Test!

1. **Start server:** `npm run dev`
2. **Run helper:** `node scripts/run-booking-test.js`
3. **Follow instructions**
4. **Watch the magic!** ✨

For any issues, check the troubleshooting section above or refer to the testing guide.

**Happy Testing! 🎉**
