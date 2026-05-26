const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://www.saucedemo.com';

// Test data
const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  problem: { username: 'problem_user', password: 'secret_sauce' },
  performance: { username: 'performance_glitch_user', password: 'secret_sauce' },
};

// Helper: Perform login
async function login(page, username, password) {
  await page.goto(BASE_URL);
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

// ============================================================
// LOGIN TESTS
// ============================================================

test.describe('Login Module', () => {
  
  test('TC-LG-001: Successful login with valid credentials', async ({ page }) => {
    await login(page, USERS.standard.username, USERS.standard.password);
    
    // Verify redirect to inventory page
    await expect(page).toHaveURL(/.*inventory/);
    await expect(page.locator('.title')).toHaveText('Products');
    await expect(page.locator('.inventory_item')).toHaveCount(6);
  });

  test('TC-LG-002: Failed login with invalid credentials', async ({ page }) => {
    await login(page, 'invalid_user', 'wrong_password');
    
    // Verify error message
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Username and password do not match');
    
    // Verify still on login page
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('TC-LG-003: Locked out user sees error message', async ({ page }) => {
    await login(page, USERS.locked.username, USERS.locked.password);
    
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('locked out');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('TC-LG-004: Empty username shows validation error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Username is required');
  });

  test('TC-LG-005: Empty password shows validation error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('[data-test="username"]', 'standard_user');
    await page.click('[data-test="login-button"]');
    
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Password is required');
  });

  test('TC-LG-006: Successful logout redirects to login page', async ({ page }) => {
    await login(page, USERS.standard.username, USERS.standard.password);
    
    // Open sidebar menu and logout
    await page.click('#react-burger-menu-btn');
    await page.waitForSelector('#logout_sidebar_link');
    await page.click('[data-test="logout-sidebar-link"]');
    
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });

  test('TC-LG-007: Password field masks input', async ({ page }) => {
    await page.goto(BASE_URL);
    const passwordField = page.locator('[data-test="password"]');
    
    // Check input type is password (masked)
    const inputType = await passwordField.getAttribute('type');
    expect(inputType).toBe('password');
  });
});

// ============================================================
// PRODUCT BROWSING TESTS
// ============================================================

test.describe('Product Browsing', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.standard.username, USERS.standard.password);
  });

  test('TC-PB-001: Product list displays 6 items', async ({ page }) => {
    const items = page.locator('.inventory_item');
    await expect(items).toHaveCount(6);
    
    // Verify each item has name, description, price, image
    for (let i = 0; i < 6; i++) {
      await expect(items.nth(i).locator('.inventory_item_name')).toBeVisible();
      await expect(items.nth(i).locator('.inventory_item_desc')).toBeVisible();
      await expect(items.nth(i).locator('.inventory_item_price')).toBeVisible();
      await expect(items.nth(i).locator('img.inventory_item_img')).toBeVisible();
    }
  });

  test('TC-PB-002: Sort products by price low to high', async ({ page }) => {
    await page.selectOption('[data-test="product-sort-container"]', 'lohi');
    
    const prices = await page.locator('.inventory_item_price').allTextContents();
    const priceNums = prices.map(p => parseFloat(p.replace('$', '')));
    
    // Verify ascending order
    for (let i = 1; i < priceNums.length; i++) {
      expect(priceNums[i]).toBeGreaterThanOrEqual(priceNums[i - 1]);
    }
  });

  test('TC-PB-003: Product details accessible via click', async ({ page }) => {
    await page.click('.inventory_item_name');
    
    await expect(page).toHaveURL(/.*inventory-item/);
    await expect(page.locator('.inventory_details_name')).toBeVisible();
    await expect(page.locator('[data-test="add-to-cart"]')).toBeVisible();
  });
});

// ============================================================
// CART MANAGEMENT TESTS
// ============================================================

test.describe('Cart Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.standard.username, USERS.standard.password);
  });

  test('TC-CM-001: Add single item to cart', async ({ page }) => {
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    
    // Verify cart badge
    const badge = page.locator('.shopping_cart_badge');
    await expect(badge).toHaveText('1');
    
    // Verify button changed to Remove
    await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toBeVisible();
  });

  test('TC-CM-002: Add multiple items to cart', async ({ page }) => {
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]');
    
    const badge = page.locator('.shopping_cart_badge');
    await expect(badge).toHaveText('3');
  });

  test('TC-CM-003: Remove item from cart', async ({ page }) => {
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="remove-sauce-labs-backpack"]');
    
    // Badge should disappear
    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
  });

  test('TC-CM-006: Continue shopping from cart', async ({ page }) => {
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    
    // On cart page
    await expect(page).toHaveURL(/.*cart/);
    
    // Click continue shopping
    await page.click('[data-test="continue-shopping"]');
    
    // Back on inventory
    await expect(page).toHaveURL(/.*inventory/);
    
    // Cart still has item
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });
});

// ============================================================
// CHECKOUT FLOW TESTS
// ============================================================

test.describe('Checkout Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.standard.username, USERS.standard.password);
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('[data-test="checkout"]');
  });

  test('TC-CH-001: Complete checkout with valid data', async ({ page }) => {
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');
    
    // Verify overview page
    await expect(page).toHaveURL(/.*checkout-step-two/);
    
    // Complete order
    await page.click('[data-test="finish"]');
    
    // Verify confirmation
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    
    // Cart should be empty
    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
  });

  test('TC-CH-002: Checkout with empty fields shows errors', async ({ page }) => {
    await page.click('[data-test="continue"]');
    
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('First Name is required');
  });

  test('TC-CH-003: Checkout with empty first name', async ({ page }) => {
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');
    
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('First Name is required');
  });

  test('TC-CH-005: Cancel checkout returns to cart', async ({ page }) => {
    await page.fill('[data-test="firstName"]', 'John');
    await page.click('[data-test="cancel"]');
    
    await expect(page).toHaveURL(/.*cart/);
  });
});

// ============================================================
// VISUAL BUG TESTS (Problem User)
// ============================================================

test.describe('Visual Tests - Problem User', () => {
  
  test('TC-VU-001: Problem user shows broken images - BUG DETECTED', async ({ page }) => {
    await login(page, USERS.problem.username, USERS.problem.password);
    
    // Get all product image srcs
    const images = page.locator('img.inventory_item_img');
    const count = await images.count();
    
    const srcs = [];
    for (let i = 0; i < count; i++) {
      srcs.push(await images.nth(i).getAttribute('src'));
    }
    
    const uniqueSrcs = new Set(srcs);
    
    // This test deliberately exposes the bug on problem_user:
    // All 6 products show the SAME broken image (1 unique src) 
    // instead of 6 different product images
    console.log(`⚠️  BUG: Found ${uniqueSrcs.size} unique image(s) out of ${count} products`);
    console.log('Image sources:', srcs);
    
    // Assert the bug exists — all images have the same src
    expect(uniqueSrcs.size).toBe(1);
    // In production, this should be: expect(uniqueSrcs.size).toBe(count);
  });
});
