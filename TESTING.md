# Day of Cleaning - Testing Guide

Since the "Day of Cleaning" flow involves complex real-time interactions between two users (Customer and Cleaner) and device-specific features (Geolocation), manual testing is recommended.

## Manual E2E Test Script

### Step 1: Create a Job (Customer)
1. **Login** as a Customer (e.g., `customer1@goswish.com` / `Customer123!`).
2. Click **+ New Booking**.
3. Select a Property, choose **Regular Clean**, and select **Today's Date**.
   - *Note: If no slots are available today, choose the earliest available.*
4. Confirm Booking.
5. Go to **My Bookings** to confirm it is listed.
6. **Logout** (Profile -> Logout).

### Step 2: Start the Job (Cleaner)
1. **Login** as a Cleaner (e.g., `cleaner1@goswish.com` / `Cleaner123!`).
2. Go to **Jobs** tab.
3. If the job is not in "My Schedule", check **New Offers** and **Accept** it.
4. Open the Job Details.
5. Click **Start Trip** (Wait a few seconds for simulation).
6. Click **I've Arrived**.
7. **Important**: You will see a "Verification Code" (e.g., `Your Code: 1234`). **Write this down.**
8. **Logout**.

### Step 3: Verify & Track (Customer)
1. **Login** as the Customer again.
2. Go to **My Bookings**.
3. You should see a **Track Job** button (since status is 'Arrived'). Click it.
4. You will be asked to "Enter Cleaner's Code".
   - Enter the code you wrote down in Step 2.
5. Click **Verify**.
6. Steps should advance to **Cleaning in Progress**.
7. **Logout**.

### Step 4: Complete the Job (Cleaner)
1. **Login** as the Cleaner.
2. Open the Job. It should now be in **Execution Mode** (Checklist).
3. Check off all tasks.
4. Click **Complete Job**, then Submit.
5. **Logout**.

### Step 5: Approval (Customer)
1. **Login** as the Customer.
2. Go to **My Bookings**.
3. Click **Review Job**.
4. Review the summary and click **Approve & Pay**.
5. Leave a rating and submit.
6. The flow is complete!
