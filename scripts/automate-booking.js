/**
 * GoSwish Automated Customer Booking Flow
 * 
 * This script automates the complete customer journey:
 * 1. Role selection (Customer)
 * 2. Login with test credentials
 * 3. Navigate to booking
 * 4. Select property
 * 5. Select service type
 * 6. Select add-ons (optional)
 * 7. Select date and time
 * 8. Add special notes (optional)
 * 9. Complete payment
 * 10. View confirmation
 * 
 * Usage: Open browser console and paste this entire script, then run:
 * await automateCustomerBooking();
 */

// Utility functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clickElement = (selector, description) => {
    console.log(`🖱️  Clicking: ${description}`);
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector} (${description})`);
    }
    element.click();
    return wait(500); // Wait for UI to update
};

const clickByText = (text, description) => {
    console.log(`🖱️  Clicking button with text: ${description}`);
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(btn => btn.textContent.includes(text));
    if (!button) {
        throw new Error(`Button not found with text: ${text} (${description})`);
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

    // Set value and trigger input event
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return wait(300);
};

const clickFirstVisibleButton = (containsText) => {
    console.log(`🖱️  Clicking first button containing: ${containsText}`);
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(btn =>
        btn.textContent.includes(containsText) &&
        btn.offsetParent !== null // Check if visible
    );
    if (!button) {
        throw new Error(`No visible button found containing: ${containsText}`);
    }
    button.click();
    return wait(500);
};

// Main automation function
async function automateCustomerBooking() {
    console.log('🚀 Starting GoSwish Customer Booking Automation...\n');

    try {
        // Step 1: Select Customer Role
        console.log('📋 Step 1: Selecting Customer Role');
        await clickByText("I'm a Customer", 'Customer role button');
        await wait(1000);

        // Step 2: Login
        console.log('\n🔐 Step 2: Logging in as customer1@goswish.com');
        await fillInput('input[type="email"]', 'customer1@goswish.com', 'Email field');
        await fillInput('input[type="password"]', 'Customer123!', 'Password field');
        await clickByText('Continue', 'Login button');
        await wait(2000); // Wait for login to complete

        // Step 3: Navigate to Booking
        console.log('\n🏠 Step 3: Navigating to booking');
        await clickByText('Book a Cleaning', 'Book cleaning button');
        await wait(1000);

        // Step 4: Select Property (first house)
        console.log('\n🏡 Step 4: Selecting property');
        const propertyCards = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.includes('sqft') || btn.querySelector('.lucide-home')
        );
        if (propertyCards.length > 0) {
            propertyCards[0].click();
            await wait(500);
        }
        await clickByText('Continue', 'Continue after property selection');
        await wait(1000);

        // Step 5: Select Service Type (Regular Clean)
        console.log('\n✨ Step 5: Selecting service type');
        const serviceButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.includes('Regular') ||
            btn.textContent.includes('Deep') ||
            btn.textContent.includes('Move')
        );
        if (serviceButtons.length > 0) {
            serviceButtons[0].click(); // Click first service (usually Regular Clean)
            await wait(500);
        }
        await clickByText('Continue', 'Continue after service selection');
        await wait(1000);

        // Step 6: Skip or Select Add-ons
        console.log('\n🎁 Step 6: Handling add-ons');
        // Just click continue to skip add-ons
        await clickByText('Continue', 'Skip add-ons');
        await wait(1000);

        // Step 7: Select Date & Time
        console.log('\n📅 Step 7: Selecting date and time');

        // Click tomorrow's date (find a date that's not disabled)
        const dateButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.trim();
            return text.match(/^\d+$/) && !btn.disabled && btn.className.includes('hover');
        });

        if (dateButtons.length > 0) {
            console.log('   Clicking date...');
            dateButtons[0].click();
            await wait(500);

            // Select Morning time slot
            console.log('   Selecting time slot...');
            const timeSlotButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent.includes('Morning') || btn.textContent.includes('🌅')
            );
            if (timeSlotButtons.length > 0) {
                timeSlotButtons[0].click();
                await wait(500);
            }
        }

        await clickByText('Continue', 'Continue after date/time selection');
        await wait(1000);

        // Step 8: Special Notes (optional)
        console.log('\n📝 Step 8: Adding special notes');
        const notesArea = document.querySelector('textarea');
        if (notesArea) {
            notesArea.value = 'Please focus on the kitchen. Automated booking test.';
            notesArea.dispatchEvent(new Event('input', { bubbles: true }));
            await wait(300);
        }
        await clickByText('Continue', 'Continue after notes');
        await wait(1000);

        // Step 9: Payment
        console.log('\n💳 Step 9: Completing payment');

        // Fill payment details
        const cardInputs = document.querySelectorAll('input');
        for (const input of cardInputs) {
            const placeholder = input.placeholder?.toLowerCase() || '';

            if (placeholder.includes('card') || placeholder.includes('number')) {
                input.value = '4242 4242 4242 4242';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await wait(200);
            } else if (placeholder.includes('expir') || placeholder.includes('mm')) {
                input.value = '12/25';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await wait(200);
            } else if (placeholder.includes('cvc') || placeholder.includes('cvv')) {
                input.value = '123';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await wait(200);
            } else if (placeholder.includes('zip') || placeholder.includes('postal')) {
                input.value = '75201';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await wait(200);
            }
        }

        await wait(500);

        // Complete booking
        console.log('   Submitting payment...');
        await clickByText('Complete Booking', 'Complete booking button');
        await wait(3000); // Wait for payment processing

        // Step 10: Confirmation
        console.log('\n✅ Step 10: Viewing confirmation');
        await wait(2000);

        // Check for success
        const successElements = document.querySelectorAll('*');
        let foundSuccess = false;
        for (const el of successElements) {
            if (el.textContent.includes('Booking Confirmed') ||
                el.textContent.includes('Success') ||
                el.textContent.includes('BKG-')) {
                foundSuccess = true;
                break;
            }
        }

        if (foundSuccess) {
            console.log('\n🎉 SUCCESS! Booking completed successfully!');
            console.log('📋 Check the screen for booking confirmation and ID');
        } else {
            console.log('\n⚠️  Booking submitted - check screen for confirmation');
        }

        console.log('\n✅ Automation completed!');
        return { success: true, message: 'Booking flow completed' };

    } catch (error) {
        console.error('\n❌ Error during automation:', error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

// Export for console use
console.log('✅ GoSwish Booking Automation Script Loaded!');
console.log('');
console.log('To run the automation, execute:');
console.log('  await automateCustomerBooking()');
console.log('');
console.log('Make sure you are on: http://localhost:5173/');
console.log('');

// Auto-run if on the correct page
if (window.location.href.includes('localhost:5173')) {
    console.log('✅ Correct page detected!');
    console.log('Run: await automateCustomerBooking()');
}
