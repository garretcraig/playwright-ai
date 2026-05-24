# Playwright AI

A command-line tool that writes and runs Playwright browser tests from plain English descriptions using Claude AI.

## What It Does

Describe what you want to test — Claude writes the Playwright script, you review it, and the tool runs it against your chosen browser. On failure, a screenshot is automatically captured.

Supports Chromium, Firefox, and WebKit (Safari engine) for cross-browser coverage.

**Key features:**
- Natural language → runnable Playwright test script
- Cross-browser support: Chromium, Firefox, WebKit
- Optional visible browser window to watch the test run live
- Automatic failure screenshot capture
- Scripts saved to disk for reuse or inspection

## Requirements

- Node.js v18+
- Anthropic API key

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/garretcraig/playwright-ai.git
cd playwright-ai
```

**2. Install dependencies**
```bash
npm install
```

**3. Install browsers**
```bash
npx playwright install
```

**4. Create a `.env` file** (copy from `.env.example`)
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**5. Run**
```bash
node index.js
```

## Usage

```
╔══════════════════════════════════════════════╗
║           Playwright AI  v1.0                ║
╚══════════════════════════════════════════════╝

URL to test:
> https://example.com

Browser:
  1. Chromium
  2. Firefox
  3. WebKit (Safari)

Choose (1-3):
> 1

→ Using: Chromium

Show browser window while running? (y/n):
> y

Describe what to test:
> Navigate to the page, verify the heading says "Example Domain", and confirm there is a link to more information
```

Claude generates and displays the Playwright script, then asks if you want to run it. Pass/fail is reported in the terminal. On failure, a screenshot is saved to `screenshots/failure.png`.

Generated scripts are saved to the `tests/` folder with a timestamp so you can rerun or modify them at any time.

## Tech Stack

Node.js · Claude API (Anthropic) · Playwright
