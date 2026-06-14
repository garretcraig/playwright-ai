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
        await page.getByRole('textbox', { name: 'Email' }).fill('garret@forgedsports.co');
        await page.getByRole('textbox', { name: 'Password' }).fill('ForgedSports1!');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.getByRole('link', { name: 'Settings' }).click();
        await page.waitForLoadState('networkidle');

        // Confirm the toggle is gone
        const toggleVisible = await page.getByText('Hide sensitive data on dashboard').isVisible();
        if (toggleVisible) throw new Error('FS-268: "Hide sensitive data on dashboard" toggle is still visible — should have been removed');

        console.log('PASS: FS-268 - "Hide sensitive data on dashboard" toggle successfully removed from Settings > Account');
        await browser.close();
        process.exit(0);
    } catch (error) {
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
        await page.screenshot({ path: path.join(screenshotsDir, 'fs-268-failure.png') });
        console.error('FAIL:', error.message);
        await browser.close();
        process.exit(1);
    }
})();