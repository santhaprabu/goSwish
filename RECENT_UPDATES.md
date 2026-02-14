# GoSwish App - Recent Updates (February 2026)

**Last Updated**: February 5, 2026
**App Version**: Running on localhost:5174

---

## Summary of Recent Fixes

This document summarizes the fixes and improvements made to the GoSwish application in the recent development session.

---

## 1. Date & Timezone Fixes

### Problem
Bookings were displaying on the wrong date in "Manage my Availability" (Shift Management). A Feb 6 evening booking was appearing on Feb 5.

### Root Cause
JavaScript's `new Date("2026-02-06")` interprets date-only strings as UTC midnight, which shifts the date when converted to local timezone.

### Solution
Created centralized date utilities in `src/utils/dateUtils.js`:

```javascript
// parseLocalDate - Parse date string as local timezone (not UTC)
// toLocalDateString - Convert Date to YYYY-MM-DD in local timezone
// extractHours - Extract hour from time strings like "3:00 PM"
// formatDisplayDate - Format date for UI display
```

### Files Updated
- `src/utils/dateUtils.js` - New centralized date utilities
- `src/utils/formatters.js` - Re-exports from dateUtils
- `src/storage/helpers.js` - Uses parseLocalDate, toLocalDateString
- `src/components/ShiftManagement.jsx` - Uses toLocalDateString, extractHours
- `src/components/CleanerSchedule.jsx` - Uses parseLocalDate for month filtering
- `src/matching/scoring.js` - Uses toLocalDateString for date comparison

---

## 2. Booking ID Display Fix

### Problem
Booking IDs were showing mangled format (e.g., "TX-0610498") instead of the proper format (e.g., "TX-2026-0206-49832").

### Root Cause
The `formatBookingId` regex only matched 4-digit suffixes, but the generator creates 5-digit suffixes.

### Solution
Updated regex in `src/utils/formatters.js`:

```javascript
// Before: /^[A-Z]{2}-\d{4}-\d{4}-\d{4}$/
// After:  /^[A-Z]{2}-\d{4}-\d{4}-\d{4,5}$/
```

### Booking ID Format
- Format: `XX-YYYY-MMDD-#####`
- Example: `TX-2026-0206-49832`
- XX = State code (TX)
- YYYY = Year (2026)
- MMDD = Month and day (0206 = Feb 6)
- ##### = 5-digit random suffix

---

## 3. Time Slot Display Fix

### Problem
Evening bookings were showing in the morning slot in Shift Management.

### Root Cause
Code was extracting hours from `scheduledDate` (which is date-only, returns midnight/0 hours) instead of `startTime` (which contains the actual time like "3:00 PM").

### Solution
Updated `ShiftManagement.jsx` to use `extractHours(job.startTime)`:

```javascript
// Get date from scheduledDate (YYYY-MM-DD format)
const dateStr = toLocalDateString(job.scheduledDate || job.startTime);

// Get hour from startTime (e.g., "3:00 PM")
const hour = extractHours(job.startTime);

let shift = 'morning';
if (hour >= 12 && hour < 15) shift = 'afternoon';
else if (hour >= 15) shift = 'evening';
```

---

## 4. Cleaner Availability Conflict Check

### Problem
Cleaners were receiving job notifications for time slots they had blocked in "Manage my Availability".

### Solution
Updated `checkCleanerConflict` in `src/storage/helpers.js` to check both existing jobs AND blocked availability:

```javascript
export const checkCleanerConflict = async (cleanerId, dates, timeSlots) => {
    const cleaner = await getDoc(COLLECTIONS.CLEANERS, cleanerId);
    const availability = cleaner?.availability || {};

    // Check blocked slots in cleaner's availability
    for (const date of dates) {
        const dayAvailability = availability[date] || {};
        for (const slot of requestedSlots) {
            if (dayAvailability[slot] === 'unavailable' ||
                dayAvailability[slot] === 'blocked') {
                return true; // Conflict found
            }
        }
    }
    // Also check existing jobs...
};
```

---

## 5. Messaging System Improvements

### Changes Made
1. **Header Alignment** - Fixed "Messages" header touching left border
2. **Booking Info in Chat** - Shows booking ID and address under cleaner name
3. **Service Type Formatting** - Converts to Title Case (e.g., "Deep Cleaning")
4. **Message Spacing** - Increased padding so messages don't touch screen edges

### Files Updated
- `src/components/CustomerMessaging.jsx`
- `src/components/CleanerMessaging.jsx`

### Header Fix
```jsx
// Before
<div className="app-bar">
    <button onClick={onBack} className="p-2">

// After
<div className="app-bar flex items-center justify-between px-4 py-3">
    <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
```

### Chat Header Info
```jsx
<div className="min-w-0 flex-1">
    <h1>{selectedConvo.cleanerName}</h1>
    <p>{selectedConvo.serviceType} • {formatBookingId(selectedConvo.bookingId)}</p>
    {selectedConvo.address && (
        <p><MapPin /> {selectedConvo.address}</p>
    )}
</div>
```

### Message Area Padding
```jsx
// Before: px-4, max-w-[75%]
// After:  px-6, mx-1, max-w-[70%]
```

---

## 6. Booking Lookup Fix for Messaging

### Problem
Clicking message icon from Job Details showed "Booking TX-2026-0205-28943 not found".

### Root Cause
Code was using `getDoc()` with the human-readable booking number, but the booking is stored with a document ID (e.g., "booking-1770091897037-fkl75so6w").

### Solution
Updated `getOrCreateConversationForBooking` in `src/storage/helpers.js` to use `getBookingById()` which resolves booking numbers to document IDs:

```javascript
// Before
const booking = await getDoc(COLLECTIONS.BOOKINGS, bookingId);

// After
const booking = await getBookingById(bookingId);
```

---

## 7. Recent Bookings Cards (Customer Home)

### Changes Made
1. Made booking cards clickable with navigation to booking details
2. Added back navigation from booking details to home
3. Shows property address instead of generic text
4. Shows correct service type (e.g., "Deep Cleaning" instead of just "Cleaning")

### Files Updated
- `src/App.jsx` - Added `onViewBooking` prop and back navigation
- `src/components/Screens.jsx` - Updated CustomerHome with clickable cards

---

## File Integrity Check

All key files verified:
- `src/components/CustomerMessaging.jsx` - Valid React component with default export
- `src/components/CleanerMessaging.jsx` - Valid React component with default export
- `src/components/LiveTracking.jsx` - Valid React component with default export
- `src/components/ShiftManagement.jsx` - Valid React component with default export
- `src/components/CleanerSchedule.jsx` - Valid React component with default export
- `src/utils/formatters.js` - Valid module with named exports
- `src/utils/dateUtils.js` - Valid module with named exports
- `src/storage/helpers.js` - Valid module with named exports

---

## App Status

**Status**: Running
**Port**: 5174
**URL**: http://localhost:5174

---

## Testing Checklist

- [ ] Create a new booking and verify booking ID format
- [ ] Check "Manage my Availability" shows bookings on correct dates
- [ ] Verify evening bookings appear in evening slot (not morning)
- [ ] Block a time slot and verify no job notifications for that slot
- [ ] Open messaging and verify header alignment
- [ ] Open a chat and verify booking ID and address are shown
- [ ] Verify service type shows as "Deep Cleaning" not "deep_cleaning"
- [ ] Verify messages have proper spacing from screen edges
- [ ] Click recent booking card and verify navigation works
- [ ] Click back from booking details and verify returns to home

---

**Document Version**: 1.0
**Generated**: February 5, 2026
