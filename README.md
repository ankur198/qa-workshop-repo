# QA Workshop Demo - Swag Labs Test Suite

This repo contains automated tests for [saucedemo.com](https://www.saucedemo.com) — a demo e-commerce app for QA practice.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm test

# Run tests with browser visible
npm run test:headed

# View test report
npm run test:report
```

## 🧪 Test App: Swag Labs

**URL:** https://www.saucedemo.com

| Username | Password | Purpose |
|----------|----------|---------|
| `standard_user` | `secret_sauce` | Normal user - everything works |
| `locked_out_user` | `secret_sauce` | Locked account - tests error handling |
| `problem_user` | `secret_sauce` | Visual bugs - broken images, UI issues |
| `performance_glitch_user` | `secret_sauce` | Slow loading - tests performance |

## 📁 Project Structure

```
├── .github/workflows/
│   └── tests.yml          # GitHub Actions CI
├── tests/
│   └── login.spec.js      # Playwright test specs
├── playwright.config.js   # Playwright configuration
├── package.json
└── README.md
```

## 🔗 Connected Tools

- **Jira:** Bug tracking and test management
- **Testomat:** Test case management and execution
- **GitHub Actions:** Automated test runs on every PR
