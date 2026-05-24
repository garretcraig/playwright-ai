const Anthropic = require('@anthropic-ai/sdk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const client = new Anthropic();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

const BROWSERS      = { '1': 'chromium', '2': 'firefox', '3': 'webkit' };
const BROWSER_NAMES = { 'chromium': 'Chromium', 'firefox': 'Firefox', 'webkit': 'WebKit (Safari)' };

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           Playwright AI  v1.0                ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── URL ──
  const url = (await ask('URL to test:\n> ')).trim();

  // ── Browser ──
  console.log('\nBrowser:');
  console.log('  1. Chromium');
  console.log('  2. Firefox');
  console.log('  3. WebKit (Safari)');
  const browserChoice = (await ask('\nChoose (1-3):\n> ')).trim();
  const browser       = BROWSERS[browserChoice] || 'chromium';
  console.log(`\n→ Using: ${BROWSER_NAMES[browser]}\n`);

  // ── Headless ──
  const showWindow = (await ask('Show browser window while running? (y/n):\n> ')).trim().toLowerCase();
  const headless   = showWindow !== 'y';

  // ── Test description ──
  const description = await ask('\nDescribe what to test:\n> ');

  console.log('\nGenerating test script...\n');

  // ── Generate via Claude ──
  const systemPrompt = `You are an expert QA automation engineer specializing in Playwright. Generate a complete, runnable Playwright Node.js script based on the user's test description.

REQUIREMENTS:
- Use vanilla Playwright (NOT @playwright/test)
- First line: const { ${browser} } = require('playwright');
- Launch options: { headless: ${headless} }
- Navigate to the provided URL as the first action
- Implement exactly what the user describes — no extra steps
- Use robust selectors: prefer getByRole, getByText, getByLabel over CSS classes or XPath
- Add page.waitForLoadState('networkidle') after navigation
- Wrap everything in a try/catch
- On failure: save a screenshot to screenshots/failure.png (create the folder if it doesn't exist), log the error, close the browser, call process.exit(1)
- On success: log "✓ PASS: [brief description of what passed]", close the browser, call process.exit(0)
- Close the browser in BOTH the success and failure paths

OUTPUT: Return ONLY the raw JavaScript code. No markdown, no code fences, no explanation.`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: `URL: ${url}\n\nTest: ${description}` }]
  });

  const input  = response.usage.input_tokens;
  const output = response.usage.output_tokens;
  const cost   = (input / 1_000_000 * 3.00) + (output / 1_000_000 * 15.00);

  // Strip code fences if Claude included them anyway
  const script = response.content[0].text
    .replace(/^```(?:javascript|js)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  // ── Save script ──
  const testsDir = path.resolve('tests');
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir);

  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const scriptName = `test-${timestamp}.js`;
  const scriptPath = path.join(testsDir, scriptName);
  fs.writeFileSync(scriptPath, script);

  // ── Show script ──
  console.log('─'.repeat(60));
  console.log(script);
  console.log('─'.repeat(60));
  console.log(`\n[Cost: $${cost.toFixed(6)}]`);
  console.log(`Script saved: tests/${scriptName}\n`);

  // ── Run? ──
  const runChoice = (await ask('Run this test? (y/n):\n> ')).trim().toLowerCase();
  if (runChoice !== 'y') {
    console.log(`\nRun it anytime with: node ${scriptPath}`);
    rl.close();
    return;
  }

  console.log('\nRunning test...\n');
  const result = spawnSync('node', [scriptPath], { stdio: 'inherit' });
  console.log('');

  if (result.status === 0) {
    console.log('Result: PASSED');
  } else {
    console.log('Result: FAILED');
    const failShot = path.join(screenshotsDir, 'failure.png');
    if (fs.existsSync(failShot)) {
      console.log(`Screenshot saved: screenshots/failure.png`);
    }
  }

  console.log('\nDone!');
  rl.close();
}

main().catch(console.error);
