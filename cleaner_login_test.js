
import { chromium } from 'playwright';

(async () => {
    // Launch Chrome
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100 // Slow down actions by 100ms for visibility
    });

    try {
        const page = await browser.newPage();

        // 1. Go to localhost
        console.log('Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173');

        // Wait for page to load
        await page.waitForTimeout(2000);

        // 2. Refresh to ensure we have fresh state
        await page.reload();
        await page.waitForTimeout(2000);

        // 3. Handle existing session or "Welcome Back"
        const welcomeBack = await page.$('text=Welcome back');
        if (welcomeBack) {
            console.log('Detected existing session or Welcome Back screen. Checking context...');
            // If we are already logged in, we might see the dashboard.
            // If we are on AuthScreen (login mode), "Welcome back" is the title.
            // We need to differentiate logged in state vs login screen.

            // Check if we are logged in (look for logout option or profile)
            const profileTab = await page.$('text=Profile');
            if (profileTab) {
                console.log('Already logged in. Logging out...');
                await profileTab.click();
                await page.waitForTimeout(500);
                await page.click('text=Log out');
                await page.waitForTimeout(1000);
            }
        }

        // 4. Role Selection Screen
        // Look for "I'm a Cleaner" button
        console.log('Looking for role selection...');
        try {
            const cleanerBtn = await page.waitForSelector('text=I\'m a Cleaner', { timeout: 5000 });
            if (cleanerBtn) {
                console.log('Found Role Selection. Clicking "I\'m a Cleaner"...');
                await cleanerBtn.click();
            }
        } catch (e) {
            console.log('Role selection button not found immediately. Maybe already on Auth screen?');
        }

        await page.waitForTimeout(1000);

        // 5. Auth Screen
        // Should see "Welcome back" or "Sign up"
        console.log('Waiting for login form...');

        // Ensure we are in "Login" mode (Title: Welcome back)
        // If Title is "Sign up", click "Already have an account? Sign in"
        const signUpTitle = await page.$('h1:has-text("Sign up")');
        if (signUpTitle) {
            console.log('On Sign Up screen. Switching to Login...');
            await page.click('text=Already have an account? Sign in');
            await page.waitForTimeout(500);
        }

        // Fill inputs
        console.log('Filling credentials...');
        await page.fill('input[placeholder="Email"]', 'cleaner1@goswish.com');
        await page.fill('input[placeholder="Password"]', 'Cleaner123!');

        // Click Continue
        console.log('Submitting...');
        await page.click('button:has-text("Continue")');

        await page.waitForTimeout(3000);

        // 6. Verification
        // Check for Cleaner Dashboard elements (e.g. "Jobs" tab)
        const jobsTab = await page.$('text=Jobs'); // Cleaner tab usually has "Jobs"

        if (jobsTab) {
            console.log('✅ SUCCESS: Logged in as Cleaner!');
        } else {
            // Check for error message
            const errorMsg = await page.$eval('.text-red-800', el => el.textContent).catch(() => null);
            if (errorMsg) {
                console.error(`❌ FAILURE: Login failed with error: "${errorMsg}"`);
            } else {
                console.error('❌ FAILURE: Could not verify cleaner login. Dashboard not found.');
            }
            // Take screenshot of failure
            await page.screenshot({ path: 'login_failure.png' });
        }

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        await browser.close();
    }
})();
