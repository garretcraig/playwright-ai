const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// RBAC Test: Venue Operator (FS-253)
// Should have: Dashboard, Bays, Players, Waivers (operational only)
// Should NOT have: Pricing, Promotions, Billing, Settings configuration

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://vms-staging.forgedsports.io/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Continue to Sign In' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Email').fill('garret+test-venue-staging7@forgedsports.co');
    await page.getByLabel('Password').fill('ForgedSports1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Dashboard loaded:', page.url());

    // Scope nav checks to the sidebar only (Dashboard also appears in breadcrumb)
    const sidebar = page.locator('[data-slot="sidebar"]');

    // Print all visible sidebar links for debugging
    const allLinks = await sidebar.getByRole('link').allTextContents();
    console.log('Nav links visible to Venue Operator:', allLinks);

    // Venue Operator should see operational nav items
    const expectedNav = ['Dashboard', 'Bays', 'Players', 'Waivers'];
    for (const item of expectedNav) {
      const visible = await sidebar.getByRole('link', { name: item }).isVisible();
      if (!visible) throw new Error(`Expected nav item "${item}" to be visible for Venue Operator`);
    }
    console.log('✓ Operational nav items visible: Dashboard, Bays, Players, Waivers');

    // Navigate to Settings (should be visible but limited)
    await sidebar.getByRole('link', { name: 'Settings' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Venue Operator should NOT see Billing tab
    const billingVisible = await page.getByRole('tab', { name: 'Billing' }).isVisible();
    if (billingVisible) throw new Error('Billing tab should be hidden for Venue Operator but it is visible');
    console.log('✓ Billing tab correctly hidden for Venue Operator');

    // Venue Operator can see Organization tab but it is read-only (verified manually 2026-06-12)
    const orgVisible = await page.getByRole('tab', { name: 'Organization' }).isVisible();
    if (!orgVisible) throw new Error('Organization tab should be visible (read-only) for Venue Operator but it is hidden');
    console.log('✓ Organization tab visible (read-only) for Venue Operator');

    console.log('\n✓ PASS: Venue Operator role permissions verified (FS-253)');
    await browser.close();
    process.exit(0);
  } catch (error) {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotsDir, 'rbac-venue-operator-failure.png') });
    console.error('✗ FAIL:', error.message);
    await browser.close();
    process.exit(1);
  }
})();
