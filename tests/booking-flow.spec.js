import { test, expect } from '@playwright/test';

/**
 * Complete Customer Booking Flow Automation
 * This test automates the entire booking process from login to payment confirmation
 */

test.describe('Customer Booking Flow', () => {
    test('should complete full booking flow from login to payment', async ({ page }) => {
        console.log('🚀 Starting GoSwish Customer Booking Flow Automation...\n');

        // Set longer timeout for the entire test
        test.setTimeout(120000); // 2 minutes

        try {
            // Step 1: Navigate to app
            console.log('📱 Step 1: Opening GoSwish app...');
            await page.goto('http://localhost:5173/');
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: 'test-results/01-landing-page.png' });
            console.log('✅ App loaded\n');

            // Step 2: Select Customer Role
            console.log('👤 Step 2: Selecting Customer role...');
            await page.waitForSelector('text=I\'m a Customer', { timeout: 10000 });
            await page.click('text=I\'m a Customer');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/02-role-selected.png' });
            console.log('✅ Customer role selected\n');

            // Step 3: Login
            console.log('🔐 Step 3: Logging in...');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.fill('input[type="email"]', 'customer1@goswish.com');
            await page.fill('input[type="password"]', 'Customer123!');
            await page.screenshot({ path: 'test-results/03-login-form.png' });

            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-results/04-logged-in.png' });
            console.log('✅ Logged in successfully\n');

            // Step 4: Navigate to Booking
            console.log('🏠 Step 4: Starting new booking...');
            await page.waitForSelector('text=Book a Cleaning', { timeout: 10000 });
            await page.click('text=Book a Cleaning');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/05-booking-started.png' });
            console.log('✅ Booking flow started\n');

            // Step 5: Select Property
            console.log('🏡 Step 5: Selecting property...');
            // Wait for property cards to load
            await page.waitForSelector('button:has-text("bed")', { timeout: 10000 });
            await page.waitForTimeout(500);

            // Click the first property card
            const propertyCards = await page.$$('button');
            for (const card of propertyCards) {
                const text = await card.textContent();
                if (text.includes('bed') && text.includes('bath')) {
                    await card.click();
                    break;
                }
            }

            await page.waitForTimeout(500);
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/06-property-selected.png' });
            console.log('✅ Property selected\n');

            // Step 6: Select Service Type
            console.log('✨ Step 6: Selecting service type...');
            await page.waitForSelector('button:has-text("Regular")', { timeout: 10000 });
            await page.click('button:has-text("Regular")');
            await page.waitForTimeout(500);
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/07-service-selected.png' });
            console.log('✅ Service selected\n');

            // Step 7: Add-ons (skip)
            console.log('🎁 Step 7: Skipping add-ons...');
            await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/08-addons-skipped.png' });
            console.log('✅ Add-ons skipped\n');

            // Step 8: Select Date & Time
            console.log('📅 Step 8: Selecting date and time...');
            await page.waitForTimeout(1000);

            // Click first available date
            const dateButtons = await page.$$('button');
            for (const btn of dateButtons) {
                const text = await btn.textContent();
                const isDisabled = await btn.isDisabled();
                if (text.trim().match(/^\d+$/) && !isDisabled) {
                    await btn.click();
                    await page.waitForTimeout(500);
                    break;
                }
            }

            // Select morning time slot
            await page.waitForTimeout(500);
            const timeButtons = await page.$$('button');
            for (const btn of timeButtons) {
                const text = await btn.textContent();
                if (text.includes('Morning') || text.includes('🌅')) {
                    await btn.click();
                    await page.waitForTimeout(500);
                    break;
                }
            }

            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/09-datetime-selected.png' });
            console.log('✅ Date and time selected\n');

            // Step 9: Special Notes
            console.log('📝 Step 9: Adding special notes...');
            const textarea = await page.$('textarea');
            if (textarea) {
                await textarea.fill('Please focus on the kitchen. Automated test booking.');
            }
            await page.waitForTimeout(500);
            await page.click('button:has-text("Continue")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/10-notes-added.png' });
            console.log('✅ Notes added\n');

            // Step 10: Payment
            console.log('💳 Step 10: Completing payment...');
            await page.waitForTimeout(1000);

            // Fill payment form
            const inputs = await page.$$('input');
            for (const input of inputs) {
                const placeholder = await input.getAttribute('placeholder');
                if (placeholder) {
                    const p = placeholder.toLowerCase();
                    if (p.includes('card') || p.includes('number')) {
                        await input.fill('4242424242424242');
                    } else if (p.includes('expir') || p.includes('mm')) {
                        await input.fill('1225');
                    } else if (p.includes('cvc') || p.includes('cvv')) {
                        await input.fill('123');
                    } else if (p.includes('zip') || p.includes('postal')) {
                        await input.fill('75201');
                    }
                }
            }

            await page.screenshot({ path: 'test-results/11-payment-form.png' });
            await page.waitForTimeout(500);

            // Complete booking
            console.log('💰 Submitting payment...');
            await page.click('button:has-text("Complete Booking")');
            await page.waitForTimeout(4000); // Wait for payment processing

            await page.screenshot({ path: 'test-results/12-payment-submitted.png' });
            console.log('✅ Payment submitted\n');

            // Step 11: Check for confirmation
            console.log('✅ Step 11: Verifying booking confirmation...');
            await page.waitForTimeout(2000);

            const pageContent = await page.content();
            const hasConfirmation = pageContent.includes('Booking Confirmed') ||
                pageContent.includes('Success') ||
                pageContent.includes('BKG-');

            await page.screenshot({ path: 'test-results/13-confirmation.png' });

            if (hasConfirmation) {
                console.log('🎉 SUCCESS! Booking confirmed!\n');

                // Try to find and log booking ID
                const bookingIdMatch = pageContent.match(/BKG-[A-Z0-9]+/);
                if (bookingIdMatch) {
                    console.log(`📋 Booking ID: ${bookingIdMatch[0]}\n`);
                }
            } else {
                console.log('⚠️  Booking completed but confirmation not clearly visible\n');
            }

            console.log('✅ Automation completed successfully!');
            console.log('📸 Screenshots saved to test-results/ directory\n');

            // Assert success
            expect(hasConfirmation).toBeTruthy();

        } catch (error) {
            console.error('\n❌ Error during automation:', error.message);
            await page.screenshot({ path: 'test-results/ERROR-screenshot.png' });
            throw error;
        }
    });
});
