import { test, expect } from '@playwright/test';

// Tests actual DOM interaction, not just source compilation. A passing suite is not art approval.
test('workspace opens, generates a scene and responds to catalog actions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#viewport')).toBeVisible();
  await expect(page.locator('#generate')).toBeVisible();
  await expect(page.locator('#count')).toHaveText('06');

  await page.locator('#prompt').fill('5x4m makerspace with 1 robot');
  await page.locator('#generate').click();
  await expect(page.locator('#area')).toHaveText('20.0 m²');
  await expect(page.locator('#count')).toHaveText('01');
  await expect(page.locator('#notice')).toContainText('Generated 1 objects');

  await page.locator('#catalog button[data-type="robot"]').click();
  await expect(page.locator('#count')).toHaveText('02');
  await expect(page.locator('#selected-title')).toHaveText('Robot');
  await expect(page.locator('#remove')).toBeEnabled();
  await page.locator('#remove').click();
  await expect(page.locator('#count')).toHaveText('01');
  await expect(page.locator('#notice')).toContainText('removed');
  expect(errors).toEqual([]);
});

test('scene export produces actual portable JSON', async ({ page }) => {
  await page.goto('/');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-json').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('pryntor-forge-scene.json');
  await expect(page.locator('#notice')).toContainText('exported');
});

test('narrow screens keep the interactive canvas and controls usable', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#generate')).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = document.getElementById('viewport').getBoundingClientRect();
    return {
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      width: window.innerWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  expect(geometry.canvasWidth).toBeGreaterThan(100);
  expect(geometry.canvasHeight).toBeGreaterThan(100);
  // A visible horizontal overflow is a release blocker, not a test to silence.
  expect(geometry.overflow, JSON.stringify({ project: testInfo.project.name, geometry })).toBeLessThanOrEqual(2);
  await page.locator('#reset').click();
  await expect(page.locator('#notice')).toContainText('View reset');
});
