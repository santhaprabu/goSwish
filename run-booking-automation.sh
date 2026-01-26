#!/bin/bash

# GoSwish Customer Booking Flow - Complete Automation Script
# This script runs the entire booking flow using browser automation

echo "🚀 GoSwish Customer Booking Flow Automation"
echo "==========================================="
echo ""

# Check if dev server is running
echo "📋 Step 1: Checking if dev server is running..."
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Dev server is not running!"
    echo "   Please run 'npm run dev' in another terminal"
    exit 1
fi
echo "✅ Dev server is running"
echo ""

# Open browser
echo "📱 Step 2: Opening browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Google Chrome" "http://localhost:5173"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:5173"
fi
echo "✅ Browser opened"
echo ""

# Display automation instructions
echo "📋 AUTOMATION INSTRUCTIONS:"
echo "==========================================="
echo ""
echo "The browser has been opened. Now follow these steps:"
echo ""
echo "1. Open DevTools: Press F12 (or Cmd+Option+I on Mac)"
echo "2. Go to the Console tab"
echo "3. Copy and paste the following code:"
echo ""
echo "------- COPY FROM HERE -------"
cat << 'EOF'
// GoSwish Booking Flow Automation
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function completeBookingFlow() {
  console.log('🚀 Starting automation...\n');
  
  try {
    // Step 1: Click Customer
    console.log('👤 Step 1: Selecting Customer role...');
    document.querySelector('button:has-text("I\'m a Customer")')?.click() || 
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes("I'm a Customer"))?.click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 2: Login
    console.log('🔐 Step 2: Logging in...');
    document.querySelector('input[type="email"]').value = 'customer1@goswish.com';
    document.querySelector('input[type="email"]').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('input[type="password"]').value = 'Customer123!';
    document.querySelector('input[type="password"]').dispatchEvent(new Event('input', { bubbles: true }));
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(2500);
    console.log('✅ Done\n');
    
    // Step 3: Start Booking
    console.log('🏠 Step 3: Starting booking...');
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Book a Cleaning')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 4: Select Property
    console.log('🏡 Step 4: Selecting property...');
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('bed') && b.textContent.includes('bath')).click();
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 5: Select Service
    console.log('✨ Step 5: Selecting service...');
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Regular')).click();
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 6: Skip Add-ons
    console.log('🎁 Step 6: Skipping add-ons...');
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 7: Select Date & Time
    console.log('📅 Step 7: Selecting date and time...');
    const dateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().match(/^\d+$/) && !b.disabled);
    if (dateBtn) dateBtn.click();
    await wait(1000);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Morning') || b.textContent.includes('🌅'))?.click();
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 8: Add Notes
    console.log('📝 Step 8: Adding notes...');
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = 'Please focus on the kitchen. Automated test.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue')).click();
    await wait(1500);
    console.log('✅ Done\n');
    
    // Step 9: Payment
    console.log('💳 Step 9: Completing payment...');
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      const p = (input.placeholder || '').toLowerCase();
      if (p.includes('card') || p.includes('number')) {
        input.value = '4242424242424242';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (p.includes('expir') || p.includes('mm')) {
        input.value = '1225';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (p.includes('cvc') || p.includes('cvv')) {
        input.value = '123';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (p.includes('zip') || p.includes('postal')) {
        input.value = '75201';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await wait(500);
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete Booking')).click();
    await wait(4000);
    console.log('✅ Done\n');
    
    // Step 10: Check Confirmation
    console.log('✅ Step 10: Checking confirmation...');
    const hasConfirmation = document.body.textContent.includes('Booking Confirmed') || 
                           document.body.textContent.includes('BKG-');
    if (hasConfirmation) {
      console.log('🎉 SUCCESS! Booking confirmed!');
      const match = document.body.textContent.match(/BKG-[A-Z0-9]+/);
      if (match) console.log(`📋 Booking ID: ${match[0]}`);
    }
    
    console.log('\n✅ Automation completed!');
    return {success: true};
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return {success: false, error: error.message};
  }
}

// Run it
completeBookingFlow();
EOF
echo "------- COPY TO HERE -------"
echo ""
echo "4. Press Enter to execute"
echo ""
echo "The automation will run and complete the entire booking flow!"
echo ""
echo "✨ Ready to go!"
