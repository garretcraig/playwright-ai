const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// RBAC Test: Venue Manager (FS-253)
// Should have: Dashboard, Bays, Players, Waivers, Settings
// Settings tabs: Account, Organization, Venue, Integrations, Bookings (all visible, some read-only)
// Should NOT have: Billing

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://vms-staging.forgedsports.io/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Continue to Sign In' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Email').fill('garret+test-venue-staging@forgedsports.co');
    await page.getByLabel('Password').fill('ForgedSports1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Dashboard loaded:', page.url());

    // Scope nav checks to the sidebar only (Dashboard also appears in breadcrumb)
    const sidebar = page.locator('[data-slot="sidebar"]');

    // Verify core nav items are visible
    const expectedNav = ['Dashboard', 'Bays', 'Players', 'Waivers', 'Settings'];
    for (const item of expectedNav) {
      const visible = await sidebar.getByRole('link', { name: item }).isVisible();
      if (!visible) throw new Error(`Expected nav item "${item}" to be visible`);
    }
    console.log('✓ Core nav items visible');

    // Navigate to Settings
    await sidebar.getByRole('link', { name: 'Settings' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Venue Manager should NOT see Billing tab
    const billingVisible = await page.getByRole('tab', { name: 'Billing' }).isVisible();
    if (billingVisible) throw new Error('Billing tab should be hidden for Venue Manager but it is visible');
    console.log('✓ Billing tab correctly hidden for Venue Manager');

    // Venue Manager should see all settings tabs (some read-only, verified manually 2026-06-12)
    const expectedTabs = ['Account', 'Organization', 'Venue', 'Integrations', 'Bookings'];
    for (const tab of expectedTabs) {
      const visible = await page.getByRole('tab', { name: tab }).isVisible();
      if (!visible) throw new Error(`Expected settings tab "${tab}" to be visible for Venue Manager`);
    }
    console.log('✓ Settings tabs visible: Account, Organization, Venue, Integrations, Bookings');

    console.log('\n✓ PASS: Venue Manager role permissions verified (FS-253)');
    await browser.close();
    process.exit(0);
  } catch (error) {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotsDir, 'rbac-venue-manager-failure.png') });
    console.error('✗ FAIL:', error.message);
    await browser.close();
    process.exit(1);
  }
})();
