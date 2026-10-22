import { test, expect } from '@playwright/test';

test('the video-based guide changes study phases independently and resets with the case', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', { name: 'Simulação', exact: true }).click();
  await expect(page.getByLabel('Biplano', { exact: true })).not.toBeChecked();
  await expect(page.getByTestId('fluoro-B')).toHaveCount(0);
  await page.getByLabel('Caso clínico', { exact: true }).selectOption('m1');
  const guide = page.getByTestId('video-workflow-guide');
  await expect(guide).toContainText('Etapa de estudo 1 de 6');
  await expect(guide).toContainText('2:40');
  await guide.getByRole('button', { name: 'Próxima etapa de estudo', exact: true }).click();
  await expect(guide).toContainText('Etapa de estudo 2 de 6');
  await expect(guide).toContainText('4:54');
  await page.getByRole('button', { name: 'Reiniciar caso', exact: true }).click();
  await expect(guide).toContainText('Etapa de estudo 1 de 6');
  await page.getByLabel('Caso clínico', { exact: true }).selectOption('saccular');
  await expect(guide).toContainText('Etapa de estudo 1 de 5');
  await guide.getByRole('button', { name: '3 · Planejamento tridimensional', exact: true }).click();
  await expect(guide).toContainText('ainda não estão implementadas');
  await page.getByLabel('Biplano', { exact: true }).check();
  await expect(page.getByTestId('fluoro-B')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
