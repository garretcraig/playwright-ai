const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto('https://vms-staging.forgedsports.io/login');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Continue to Sign In' }).click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('textbox', { name: 'Email' }).fill('garret+test-venue-staging5@forgedsports.co');
        await page.getByRole('textbox', { name: 'Password' }).fill('ForgedSports1!');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.getByRole('link', { name: 'Settings' }).click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('tab', { name: 'Bookings' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Reset to 60 first so we always start from a known state
        await page.getByRole('textbox', { name: 'Slot increment minutes' }).fill('60');
        await page.getByRole('button', { name: 'Save product pricing' }).click();
        await page.getByRole('button', { name: 'Confirm save' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Now change to 30 and save — this is the fix we are testing
        await page.getByRole('textbox', { name: 'Slot increment minutes' }).fill('30');
        await page.getByRole('button', { name: 'Save product pricing' }).click();
        await page.getByRole('button', { name: 'Confirm save' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check the field — if the fix worked it should show 30, not snap back to 60
        const value = await page.getByRole('textbox', { name: 'Slot increment minutes' }).inputValue();
        if (value !== '30') throw new Error(`Slot increment minutes did not persist. Expected 30, got ${value}`);

        console.log('PASS: FS-270 - Slot increment minutes persisted correctly after save');
        await browser.close();
        process.exit(0);
    } catch (error) {
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
        await page.screenshot({ path: path.join(screenshotsDir, 'fs-270-failure.png') });
        console.error('FAIL:', error.message);
        await browser.close();
        process.exit(1);
    }
})();