/**
 * GoSwish Home Owner Booking Automation
 * 
 * This script automates the complete homeowner journey:
 * 1. Role selection
 * 2. Login with test credentials
 * 3. Navigation to "My Properties"
 * 4. Clicking "Book a Clean" on a property
 * 5. Completing the booking flow
 * 
 * Usage: Open browser console and paste this entire script, then run:
 * await automateHomeOwnerBooking();
 */

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clickByText = (text, description) => {
    console.log(`🖱️  Clicking: ${description} ("${text}")`);
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(btn => btn.textContent.includes(text));
    if (!button) {
        // Try searching in all elements if button search fails
        const allElements = Array.from(document.querySelectorAll('*'));
        const element = allElements.find(el => el.textContent.trim() === text && el.onclick);
        if (element) {
            element.click();
            return wait(500);
        }
        throw new Error(`Element not found with text: ${text} (${description})`);
    }
    button.click();
    return wait(500);
};

const fillInput = (selector, value, description) => {
    console.log(`⌨️  Filling: ${description} = ${value}`);
    const input = document.querySelector(selector);
    if (!input) {
        throw new Error(`Input not found: ${selector} (${description})`);
    }

    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return wait(300);
};

async function automateHomeOwnerBooking() {
    console.log('🚀 Starting GoSwish Home Owner Booking Automation...\n');

    try {
        // Step 1: Role Selection
        console.log('📋 Step 1: Selecting Home Owner Role');
        await clickByText("I'm a Customer", 'Home Owner role button');
        await wait(1000);

        // Step 2: Login
        console.log('\n🔐 Step 2: Logging in as Home Owner');
        await fillInput('input[type="email"]', 'customer1@goswish.com', 'Email');
        await fillInput('input[type="password"]', 'Customer123!', 'Password');
        await clickByText('Continue', 'Login button');
        await wait(2500);

        // Step 3: Go to My Properties (optional if already there)
        console.log('\n🏠 Step 3: Navigating to My Properties');
        try {
            // Updated to click "Houses" tab or "View Houses"
            const housesTab = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.textContent.includes('Houses') || btn.textContent.includes('Properties')
            );
            if (housesTab) {
                housesTab.click();
                await wait(1000);
            }
        } catch (e) {
            console.log('ℹ️  Already on properties screen or using fallback');
        }

        // Step 4: Click Book a Clean on first property
        console.log('\n🏡 Step 4: Clicking "Book a Clean" for the first property');
        await clickByText('Book a Clean', 'Book button on property card');
        await wait(1500);

        // Step 5: Service Selection (Auto-advanced past property selection)
        console.log('\n✨ Step 5: Selecting Regular Clean');
        await clickByText('Regular Clean', 'Service type');
        await clickByText('Continue', 'Continue to Add-ons');
        await wait(1000);

        // Step 6: Add-ons
        console.log('\n🎁 Step 6: Skipping Add-ons');
        await clickByText('Continue', 'Skip add-ons');
        await wait(1000);

        // Step 7: Date & Time
        console.log('\n📅 Step 7: Selecting Date and Time');
        const dateBtn = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim().match(/^\d+$/) && !btn.disabled && btn.className.includes('hover')
        );
        if (dateBtn) {
            dateBtn.click();
            await wait(500);

            const afternoonSlot = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.textContent.includes('Afternoon') || btn.textContent.includes('☀️')
            );
            if (afternoonSlot) afternoonSlot.click();
            else {
                const anySlot = Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent.includes('Morning') || btn.textContent.includes('Evening')
                );
                if (anySlot) anySlot.click();
            }
        }
        await clickByText('Continue', 'Confirm Date/Time');
        await wait(1000);

        // Step 8: Instructions
        console.log('\n📝 Step 8: Adding special instructions');
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.value = 'Home Owner automated test booking. Please watch out for the cat.';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await clickByText('Continue', 'Complete info');
        await wait(1000);

        // Step 9: Finalize
        console.log('\n💳 Step 9: Finalizing booking');
        const cardInput = document.querySelector('input[placeholder*="Card"]');
        if (cardInput) {
            await fillInput('input[placeholder*="Card"]', '4242 4242 4242 4242', 'Card Number');
            await fillInput('input[placeholder*="MM/YY"]', '12/26', 'Expiry');
            await fillInput('input[placeholder*="CVC"]', '123', 'CVC');
            await fillInput('input[placeholder*="ZIP"]', '75201', 'ZIP');
        }
        await clickByText('Complete Booking', 'Submit button');

        console.log('\n⏳ Processing payment... please wait');
        await wait(5000);

        // Step 10: Verification
        console.log('\n🏁 Step 10: Checking for confirmation');
        const pageText = document.body.innerText;
        if (pageText.includes('Confirmed') || pageText.includes('Success') || pageText.includes('BKG-')) {
            console.log('🎉 SUCCESS! Home Owner booking created!');
        } else {
            console.log('⚠️  Booking submitted - verify screen for confirmation');
        }

        console.log('\n✅ Automation finished!');

    } catch (error) {
        console.error('\n❌ Automation error:', error.message);
    }
}

console.log('✅ Home Owner Booking Script Loaded!');
console.log('Run: await automateHomeOwnerBooking()');
