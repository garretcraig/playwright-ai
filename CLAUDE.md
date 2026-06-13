# Playwright AI

A Node.js command-line tool that turns plain English test descriptions into runnable Playwright browser tests using the Claude API.

## How to Run

```
node index.js
```

The tool walks you through: URL → browser choice → headless mode → plain English test description. Claude generates the script, you review it, then choose whether to run it.

## Dependencies

- `playwright` — controls Chromium, Firefox, and WebKit browsers
- `@anthropic-ai/sdk` — sends prompts to Claude and gets responses back

Install them with: `npm install`

## Project Structure

```
index.js          ← the entire tool lives here (one file)
tests/            ← generated test scripts are saved here with timestamps
screenshots/      ← failure screenshots land here as failure.png
.env              ← holds your ANTHROPIC_API_KEY (never commit this)
```

## Environment Setup

Requires a `.env` file with:
```
ANTHROPIC_API_KEY=your_key_here
```

Copy from `.env.example` if starting fresh.

## How the Code Works

1. Prompts user for URL, browser, headless preference, and test description
2. Sends that info to `claude-sonnet-4-6` with a system prompt that enforces Playwright patterns
3. Saves the generated script to `tests/test-<timestamp>.js`
4. Optionally runs the script immediately via `node`
5. On test failure, a screenshot saves to `screenshots/failure.png`

## Key Details

- Uses vanilla Playwright (not `@playwright/test` — no test runner, no config file)
- Uses CommonJS (`require()`) not ES modules (`import`)
- No build step — runs directly with Node.js
- Model: `claude-sonnet-4-6` (update here if switching models)
