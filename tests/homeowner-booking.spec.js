import { test, expect } from '@playwright/test';

/**
 * Home Owner (Customer) Booking Flow Automation
 * This test automates the process of a Home Owner logging in and creating a cleaning booking.
 */

test.describe('Home Owner Booking Flow', () => {
    test('should login as a home owner and create a booking', async ({ page }) => {
        console.log('🚀 Starting GoSwish Home Owner Booking Flow Automation...\n');

        // Set timeout for the entire test
        test.setTimeout(120000); // 2 minutes

        try {
            // Step 1: Navigate to the application
            console.log('📱 Step 1: Navigating to GoSwish application...');
            await page.goto('http://localhost:5173/');
            await page.waitForLoadState('networkidle');
            // Wait for splash screen or landing page
            await page.waitForTimeout(2000);
            console.log('✅ Application loaded\n');

            // Step 2: Select role as Home Owner (Customer)
            console.log('👤 Step 2: Selecting "Home Owner" (Customer) role...');
            // In the UI, the button text is "I'm a Customer"
            const customerButton = page.locator('text=I\'m a Customer');
            if (await customerButton.isVisible()) {
                await customerButton.click();
                console.log('✅ Home Owner role selected');
            } else {
                console.log('ℹ️  Role selection screen not visible, moving to login...');
            }
            await page.waitForTimeout(1000);
            console.log('\n');

            // Step 3: Login as Home Owner
            console.log('🔐 Step 3: Logging in as Home Owner...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.fill('input[type="email"]', 'customer1@goswish.com');
            await page.fill('input[type="password"]', 'Customer123!');

            await page.click('button:has-text("Continue")');
            // Wait for authentication and navigation to home/dashboard
            await page.waitForTimeout(3000);

            // Verify login success - check for user-specific content or 'Logout'
            const isLoggedInd = await page.isVisible('text=Last cleaned') || await page.isVisible('text=Book');
            if (isLoggedInd) {
                console.log('✅ Logged in successfully as Home Owner\n');
            } else {
                console.log('⚠️ Login might have failed or dashboard is taking time to load\n');
            }

            // Step 4: Initiate Booking
            console.log('🏠 Step 4: Initiating new booking...');
            // There might be a "Book a Cleaning" or "Book" button
            const bookButton = page.locator('text=Book a Clean').first(); // Using the updated button text from previous edits
            if (await bookButton.isVisible()) {
                await bookButton.click();
                console.log('✅ "Book a Clean" button clicked');
            } else {
                const altBookButton = page.locator('text=Book a Cleaning').first();
                if (await altBookButton.isVisible()) {
                    await altBookButton.click();
                    console.log('✅ "Book a Cleaning" button clicked');
                } else {
                    console.log('❌ Could not find booking button');
                    throw new Error('Booking button not found');
                }
            }
            await page.waitForTimeout(1500);
            console.log('\n');

            // Step 5: Select Property (If not auto-selected)
            // Note: In previous edits, we made 'Book a Clean' take the user straight to step 2 if a house was selected.
            // But if they clicked from home screen 'Book a Cleaning', they might need to select a house.
            console.log('🏡 Step 5: Handling Property selection...');
            const selectPropertyTitle = page.locator('text=Select Property');
            if (await selectPropertyTitle.isVisible()) {
                console.log('📍 Selecting the first available property...');
                // Select the first property card that has house stats
                await page.locator('button:has-text("sqft")').first().click();
                await page.waitForTimeout(500);
                await page.click('button:has-text("Continue")');
            } else {
                console.log('ℹ️  Property already selected (auto-advanced), moving to service selection');
            }
            await page.waitForTimeout(1000);
            console.log('\n');

            // Step 6: Select Service Type
            console.log('✨ Step 6: Selecting cleaning service...');
            await page.waitForSelector('text=Regular Clean', { timeout: 10000 });
            await page.click('text=Regular Clean');
            await page.waitForTimeout(500);
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            console.log('✅ Service selected\n');

            // Step 7: Add-ons
            console.log('🎁 Step 7: Handling Add-ons (skipping for now)...');
            await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            console.log('✅ Add-ons step completed\n');

            // Step 8: Select Date & Time
            console.log('📅 Step 8: Selecting Date and Time...');
            await page.waitForTimeout(1000);

            // Find and click the first non-disabled day in the calendar
            const dayButtons = await page.$$('button:not([disabled])');
            let dayClicked = false;
            for (const btn of dayButtons) {
                const text = await btn.textContent();
                if (text && text.trim().match(/^\d+$/)) {
                    await btn.click();
                    dayClicked = true;
                    console.log(`📍 Selected day: ${text.trim()}`);
                    break;
                }
            }

            if (!dayClicked) {
                // If no day found in current month, try next month
                await page.click('button >> .lucide-chevron-right');
                await page.waitForTimeout(500);
                await page.locator('button:not([disabled]) >> text=/^\\d+$/').first().click();
            }

            // Select Afternoon time slot
            await page.waitForTimeout(500);
            const afternoonSlot = page.locator('text=Afternoon');
            if (await afternoonSlot.isVisible()) {
                await afternoonSlot.click();
                console.log('📍 Selected Afternoon slot');
            } else {
                await page.locator('button:has-text("Morning")').click();
                console.log('📍 Selected Morning slot (fallback)');
            }

            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            console.log('✅ Date and time confirmed\n');

            // Step 9: Special Notes
            console.log('📝 Step 9: Adding special instructions...');
            const textarea = await page.locator('textarea');
            if (await textarea.isVisible()) {
                await textarea.fill('Automated Home Owner test booking. Please be mindful of the pet cat.');
            }
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            console.log('✅ Instructions added\n');

            // Step 10: Payment & Confirmation
            console.log('💳 Step 10: Finalizing booking and payment...');
            await page.waitForTimeout(1000);

            // Check if card info is already there or if we need to fill it
            const cardInput = page.locator('input[placeholder*="Card"]');
            if (await cardInput.isVisible()) {
                await cardInput.fill('4242 4242 4242 4242');
                await page.locator('input[placeholder*="MM/YY"]').fill('12/26');
                await page.locator('input[placeholder*="CVC"]').fill('123');
                await page.locator('input[placeholder*="ZIP"]').fill('75201');
                console.log('📍 Payment details entered');
            }

            console.log('💰 Submitting booking...');
            await page.click('button:has-text("Complete Booking")');

            // Wait for the booking to process
            console.log('⏳ Processing... this may take a few seconds');
            await page.waitForTimeout(5000);

            // Step 11: Confirmation Verification
            console.log('🏁 Step 11: Verifying booking confirmation...');
            const successText = page.locator('text=/Confirmed|Success|BKG-/').first();
            await expect(successText).toBeVisible({ timeout: 15000 });

            const confirmationMsg = await successText.textContent();
            console.log(`🎉 SUCCESS! Booking finalized: ${confirmationMsg?.trim()}`);

            const bookingIdMatch = (await page.content()).match(/BKG-[A-Z0-9]+/);
            if (bookingIdMatch) {
                console.log(`📋 Booking Reference: ${bookingIdMatch[0]}`);
            }

            console.log('\n✅ Home Owner booking flow automation completed successfully!');

        } catch (error) {
            console.error('\n❌ Error during automation execution:', error.message);
            // Take a screenshot on failure for debugging
            await page.screenshot({ path: 'test-results/homeowner-booking-failure.png' });
            throw error;
        }
    });
});
