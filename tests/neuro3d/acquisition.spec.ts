import { test, expect } from '@playwright/test';

test('cold geometry blocks injection from the button and keyboard until source surfaces are available', async ({page}) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/reference-surfaces.bin', async route => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/#/tools/neuro3d');
    await page.getByRole('button', {name:'Simulação',exact:true}).click();
    const injection = page.getByRole('button', {name:/Injetar contraste virtual/});
    await expect(injection).toBeDisabled();
    await expect(page.getByTestId('station-geometry-status')).toContainText('Preparando');
    await page.keyboard.press('i');
    await expect(page.getByTestId('reference-angiogram')).toHaveCount(0);
    release();
    await expect(injection).toBeEnabled({timeout:30000});
    await expect(page.getByTestId('station-geometry-status')).toHaveCount(0);
  } finally { release(); }
});
