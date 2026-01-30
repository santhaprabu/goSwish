
// Verification Script for Pricing Rounding Logic

function calculatePrice(sqft, rate) {
    const rawBase = sqft * rate;
    console.log(`Raw Base: ${rawBase}`);

    // The Logic we implemented
    const roundedBase = Math.ceil(rawBase / 10) * 10;
    console.log(`Rounded Base: ${roundedBase}`);

    return roundedBase;
}

// Test Case 1: Odd number
const t1 = calculatePrice(1857, 0.10); // 185.7 -> 190
if (t1 !== 190) console.error("Test 1 Failed");
else console.log("Test 1 Passed");

// Test Case 2: Exact 10
const t2 = calculatePrice(2000, 0.10); // 200 -> 200
if (t2 !== 200) console.error("Test 2 Failed");
else console.log("Test 2 Passed");

// Test Case 3: Just over 10
const t3 = calculatePrice(1010, 0.10); // 101 -> 110
if (t3 !== 110) console.error("Test 3 Failed");
else console.log("Test 3 Passed");
