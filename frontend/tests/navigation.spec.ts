import { test, expect } from '@playwright/test';

test.describe('Navigation and empty states', () => {
  test('vendors page loads and shows empty state', async ({ page }) => {
    await page.goto('/vendors');
    await expect(page.getByRole('heading', { level: 1, name: 'Vendors' })).toBeVisible();
    await expect(page.getByText('No vendors found. Add your first vendor to get started.').first()).toBeVisible();
  });

  test('contracts page loads and shows empty state', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();
    await expect(page.getByText('No contracts found. Upload your first contract to get started.').first()).toBeVisible();
  });

  test('invoices page loads and shows empty state', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByText('No invoices found. Upload your first invoice to get started.').first()).toBeVisible();
  });
});


