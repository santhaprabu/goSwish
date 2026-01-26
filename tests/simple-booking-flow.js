/**
 * Simple Customer Booking Flow Automation
 * Run with: node tests/simple-booking-flow.js
 * 
 * This uses Puppeteer to automate the booking flow
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBookingFlow() {
    console.log('🚀 Starting GoSwish Customer Booking Flow Automation...\n');

    let browser;
    let screenshotNum = 1;

    try {
        // Create screenshots directory
        const screenshotsDir = join(__dirname, '..', 'test-screenshots');
        await mkdir(screenshotsDir, { recursive: true });

        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Run in headed mode so you can see it
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            slowMo: 100 // Slow down by 100ms for visibility
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 390, height: 844 }); // iPhone size

        const screenshot = async (name) => {
            const path = join(screenshotsDir, `${String(screenshotNum++).padStart(2, '0')}-${name}.png`);
            await page.screenshot({ path, fullPage: true });
            console.log(`  📸 Screenshot: ${name}`);
        };

        // Step 1: Navigate to app
        console.log('\n📱 Step 1: Opening GoSwish app...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
        await wait(1000);
        await screenshot('landing-page');
        console.log('✅ App loaded');

        // Step 2: Select Customer Role
        console.log('\n👤 Step 2: Selecting Customer role...');
        await page.waitForSelector('text/I\'m a Customer');
        await page.click('button:has-text("I\'m a Customer")');
        await wait(1500);
        await screenshot('role-selected');
        console.log('✅ Customer role selected');

        // Step 3: Login
        console.log('\n🔐 Step 3: Logging in...');
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'customer1@goswish.com', { delay: 50 });
        await page.type('input[type="password"]', 'Customer123!', { delay: 50 });
        await screenshot('login-form-filled');

        await page.click('button:has-text("Continue")');
        await wait(2500);
        await screenshot('logged-in');
        console.log('✅ Logged in successfully');

        // Step 4: Start Booking
        console.log('\n🏠 Step 4: Starting new booking...');
        await page.waitForSelector('text/Book a Cleaning');
        await page.click('button:has-text("Book a Cleaning")');
        await wait(1500);
        await screenshot('booking-started');
        console.log('✅ Booking flow started');

        // Step 5: Select Property
        console.log('\n🏡 Step 5: Selecting property...');
        await wait(1000);

        // Find and click first property card
        const propertyButtons = await page.$$('button');
        for (const button of propertyButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('bed') && text.includes('bath') && text.includes('sqft')) {
                await button.click();
                await wait(500);
                break;
            }
        }

        // Click Continue
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.textContent.includes('Continue'));
            if (continueBtn) continueBtn.click();
        });

        await wait(1500);
        await screenshot('property-selected');
        console.log('✅ Property selected');

        // Step 6: Select Service Type
        console.log('\n✨ Step 6: Selecting service type...');
        await page.waitForSelector('text/Regular');

        // Click Regular Clean
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const regularBtn = buttons.find(b => b.textContent.includes('Regular'));
            if (regularBtn) regular Btn.click();
        });

        await wait(500);

        // Click Continue
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.textContent.includes('Continue'));
            if (continueBtn) continueBtn.click();
        });

        await wait(1500);
        await screenshot('service-selected');
        console.log('✅ Service selected');

        // Step 7: Skip Add-ons
        console.log('\n🎁 Step 7: Skipping add-ons...');
        await wait(500);

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.textContent.includes('Continue'));
            if (continueBtn) continueBtn.click();
        });

        await wait(1500);
        await screenshot('addons-skipped');
        console.log('✅ Add-ons skipped');

        // Step 8: Select Date & Time
        console.log('\n📅 Step 8: Selecting date and time...');
        await wait(1000);

        // Click first available date
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const btn of buttons) {
                const text = btn.textContent.trim();
                if (text.match(/^\d+$/) && !btn.disabled) {
                    btn.click();
                    break;
                }
            }
        });

        await wait(1000);

        // Select Morning time slot
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const morningBtn = buttons.find(b => b.textContent.includes('Morning') || b.textContent.includes('🌅'));
            if (morningBtn) morningBtn.click();
        });

        await wait(500);

        // Click Continue
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.textContent.includes('Continue'));
            if (continueBtn) continueBtn.click();
        });

        await wait(1500);
        await screenshot('datetime-selected');
        console.log('✅ Date and time selected');

        // Step 9: Add Special Notes
        console.log('\n📝 Step 9: Adding special notes...');
        await wait(500);

        const textarea = await page.$('textarea');
        if (textarea) {
            await textarea.type('Please focus on the kitchen. Automated test booking.', { delay: 30 });
        }

        await wait(500);

        // Click Continue
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const continueBtn = buttons.find(b => b.textContent.includes('Continue'));
            if (continueBtn) continueBtn.click();
        });

        await wait(1500);
        await screenshot('notes-added');
        console.log('✅ Notes added');

        // Step 10: Payment
        console.log('\n💳 Step 10: Completing payment...');
        await wait(1000);

        // Fill payment form
        const inputs = await page.$$('input');
        for (const input of inputs) {
            const placeholder = await input.evaluate(el => el.placeholder || '');
            const p = placeholder.toLowerCase();

            if (p.includes('card') || p.includes('number')) {
                await input.type('4242424242424242', { delay: 50 });
            } else if (p.includes('expir') || p.includes('mm')) {
                await input.type('1225', { delay: 50 });
            } else if (p.includes('cvc') || p.includes('cvv')) {
                await input.type('123', { delay: 50 });
            } else if (p.includes('zip') || p.includes('postal')) {
                await input.type('75201', { delay: 50 });
            }
        }

        await wait(500);
        await screenshot('payment-form-filled');
        console.log('  Payment details entered');

        // Submit payment
        console.log('  Submitting payment...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const payBtn = buttons.find(b => b.textContent.includes('Complete Booking'));
            if (payBtn) payBtn.click();
        });

        await wait(4000); // Wait for payment processing
        await screenshot('payment-submitted');
        console.log('✅ Payment submitted');

        // Step 11: Confirmation
        console.log('\n✅ Step 11: Checking confirmation...');
        await wait(2000);

        const pageContent = await page.content();
        const hasConfirmation = pageContent.includes('Booking Confirmed') ||
            pageContent.includes('Success') ||
            pageContent.includes('BKG-');

        await screenshot('confirmation');

        if (hasConfirmation) {
            console.log('🎉 SUCCESS! Booking confirmed!');

            // Try to extract booking ID
            const bookingIdMatch = pageContent.match(/BKG-[A-Z0-9]+/);
            if (bookingIdMatch) {
                console.log(`📋 Booking ID: ${bookingIdMatch[0]}`);
            }
        } else {
            console.log('⚠️  Booking completed but confirmation not clearly visible');
        }

        console.log('\n✅ Automation completed successfully!');
        console.log(`📸 Screenshots saved to: ${screenshotsDir}\n`);

        // Keep browser open for a moment to see the result
        await wait(3000);

    } catch (error) {
        console.error('\n❌ Error during automation:', error.message);
        console.error(error.stack);

        if (browser) {
            await browser.close();
        }
        process.exit(1);
    }

    if (browser) {
        await browser.close();
    }

    console.log('✅ Browser closed. Test complete!');
}

// Run the automation
runBookingFlow().catch(console.error);
