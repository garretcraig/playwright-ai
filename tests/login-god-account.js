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
        await page.getByLabel('Email').fill('garret@forgedsports.co');
        await page.getByLabel('Password').fill('ForgedSports1!');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const sidebar = page.locator('[data-slot="sidebar"]');
        const dashboardLink = await sidebar.getByRole('link', { name: 'Dashboard' }).isVisible();
        if (!dashboardLink) throw new Error('Dashboard link not visible after login');

        console.log('PASS: God account login verified - Dashboard visible');
        await browser.close();
        process.exit(0);
    } catch (error) {
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
        await page.screenshot({ path: path.join(screenshotsDir, 'login-god-account-failure.png') });
        console.error('FAIL:', error.message);
        await browser.close();
        process.exit(1);
    }
})();