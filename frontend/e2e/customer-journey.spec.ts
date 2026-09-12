import { test, expect, Page } from '@playwright/test';

/**
 * Black-box browser verification of the REAL customer journey that exists in
 * this frontend. NOTE: the frontend has NO customer login, profile, or
 * favorites features (only the seller portal + admin hub have auth), so the
 * generic LOGIN -> PROFILE -> FAVORITES steps are N/A here.
 *
 * Real journey exercised:
 *   HOME -> SEARCH -> FILTER -> DETAILS -> ENQUIRY(test drive) -> BOOKING(reserve) -> CONFIRMATION
 *
 * Verification goal: after the backend was hardened (admin-only GET/PATCH on
 * /leads, /test-drives, /orders), the customer flow still works end-to-end and
 * never trips a 401/403.
 */

const API_PREFIX_RE = /\/api\/v1\//;

function futureDate(days = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Close an open modal by clicking its top-right X (no accessible name). */
async function closeModal(page: Page): Promise<void> {
  await page
    .locator('div[class*="z-50"] button:has(svg.lucide-x)')
    .first()
    .click();
}

test('customer journey: HOME->SEARCH->FILTER->DETAILS->ENQUIRY->BOOKING->CONFIRMATION', async ({ page }) => {
  // Record every backend call so we can prove the customer flow got through
  // without hitting (or being blocked by) the newly admin-guarded routes.
  const apiCalls: string[] = [];
  page.on('response', (r) => {
    const u = r.url();
    if (API_PREFIX_RE.test(u)) {
      apiCalls.push(`${r.request().method()} ${u.replace(/^.*\/api\/v1\//, '/api/v1/')} -> ${r.status()}`);
    }
  });

  // Modals window.open() a wa.me WhatsApp chat on success; auto-close those popups.
  page.on('popup', (p) => p.close().catch(() => {}));

  const phone = '98' + String(Date.now()).slice(4, 14); // unique 12-digit-safe -> 10 digits
  const isten = phone.slice(0, 10);

  // ---- HOME ----
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.getByText(/Maruti Swift/).first()).toBeVisible({ timeout: 30_000 });
  const cards = page.locator('h3');
  expect(await cards.count()).toBeGreaterThanOrEqual(1);

  // ---- SEARCH (desktop navbar search) ----
  const search = page.getByPlaceholder(/Search make, model/);
  await search.fill('Thar');
  await expect(page.getByText(/Mahindra Thar/).first()).toBeVisible();
  await expect(page.getByText('Maruti Swift')).toHaveCount(0);
  await search.fill('');
  await expect(page.getByText('Maruti Swift').first()).toBeVisible();

  // ---- FILTER (FilterSidebar: Fuel = PETROL, then Reset) ----
  await page.getByRole('button', { name: 'PETROL', exact: true }).click();
  await expect(page.getByText('Mahindra Thar')).toHaveCount(0);
  await expect(page.getByText('Maruti Swift').first()).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByText('Mahindra Thar').first()).toBeVisible();

  // ---- DETAILS (car detail page) ----
  await page.getByRole('link', { name: /Maruti Swift/ }).first().click();
  await page.waitForURL(/\/cars\/?\?id=/); // trailingSlash:true -> /cars/?id=
  await expect(page.getByText(/Maruti Swift/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Book Free Home Test Drive/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByText(/Maruti Swift/).first()).toBeVisible();

  // ---- ENQUIRY (Test Drive modal -> POST /test-drives) ----
  await page.getByRole('button', { name: 'Test Drive', exact: true }).first().click();
  await page.getByPlaceholder('e.g. Manoj').fill('Journey Tester');
  await page.getByPlaceholder('9876543210').fill(isten);
  await page.getByRole('button', { name: /Visit Hub/ }).click();
  await page.locator('input[type="date"]').fill(futureDate());
  await page.getByRole('button', { name: 'Confirm Free Test Drive', exact: true }).click();
  await expect(page.getByText('Test Drive Confirmed!')).toBeVisible({ timeout: 20_000 });
  await closeModal(page);

  // ---- BOOKING + CONFIRMATION (Reserve modal -> POST /test-drives hub viewing) ----
  await page.getByRole('button', { name: 'Reserve', exact: true }).first().click();
  await page.getByPlaceholder('e.g. Manoj').fill('Journey Buyer');
  await page.getByPlaceholder('9876543210').fill(isten);
  await page.getByPlaceholder('user@example.com').fill('journey@example.com');
  await page.locator('input[type="date"]').fill(futureDate(3));
  await page.getByRole('button', { name: /Schedule Viewing & Request Call/ }).click();
  await expect(page.getByText('Request Sent Successfully!')).toBeVisible({ timeout: 20_000 });

  // ---- Backend verification ----
  // 1. The customer booking writes landed as 2xx (public endpoints, not hardened).
  const bookingPosts = apiCalls.filter((c) => c.startsWith('POST /api/v1/test-drives'));
  expect(bookingPosts.length).toBeGreaterThanOrEqual(2);
  for (const c of bookingPosts) expect(c).toMatch(/ 2\d\d$/);

  // 2. Customer reads (catalog + detail + inspection) still succeed.
  const detailReads = apiCalls.filter((c) => /^GET \/api\/v1\/cars\/[0-9a-f-]+/.test(c));
  expect(detailReads.length).toBeGreaterThanOrEqual(1);
  expect(detailReads.every((c) => / 2\d\d$/.test(c))).toBe(true);

  // 3. The customer flow never hit the hardened admin-only routes (no 401/403).
  const denied = apiCalls.filter((c) => / 401| 403/.test(c));
  expect(denied).toHaveLength(0);

  // pass/fail-agnostic warning if any call was a client/backend error
  const errored = apiCalls.filter((c) => / 4\d\d| 5\d\d/.test(c));
  if (errored.length > 0) {
    test.info().annotations.push({ type: 'warning', description: `errored calls: ${errored.join(' | ')}` });
  }

  console.log('\n== Customer journey backend calls ==\n' + apiCalls.join('\n'));
});