import { test, expect } from '@playwright/test';

test('selection and generic variants cannot reveal embryonic arteries without the explicit checkbox', async ({ page }) => {
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  await page.getByRole('button', { name: 'Estruturas', exact: true }).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('trigeminal persistente');
  await page.locator('.nda-list button').first().click();
  const stage = page.getByTestId('detailed-atlas-canvas');
  await expect(stage).not.toHaveAttribute('data-illustrative-visible', /persistent_/);
  await page.getByLabel('Incluir variantes ilustrativas').check();
  await expect(stage).not.toHaveAttribute('data-illustrative-visible', /persistent_/);
  await page.getByLabel('Artérias embrionárias', { exact: true }).check();
  await expect(stage).toHaveAttribute('data-illustrative-visible', /persistent_trigeminal/);
  await page.getByLabel('Artérias embrionárias', { exact: true }).uncheck();
  await expect(stage).not.toHaveAttribute('data-illustrative-visible', /persistent_/);
});

test('explores the chosen side, preserves missing branches, and clears the route', async ({ page }) => {
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  await page.getByRole('button', { name: 'Anastomoses', exact: true }).click();
  await page.getByLabel('Lado das anastomoses').selectOption('r');
  await page.getByRole('button', { name: 'Explorar vasos desta via', exact: true }).first().click();
  const stage = page.getByTestId('detailed-atlas-canvas');
  await expect(stage).toHaveAttribute('data-dangerous-connection', 'mma-orbit:r');
  await expect(stage).not.toHaveAttribute('data-illustrative-visible', /_l(,|$)|persistent_/);
  await page.getByRole('button', { name: 'Mostrar rede vascular completa', exact: true }).click();
  await expect(stage).toHaveAttribute('data-dangerous-connection', '');
  await page.getByLabel('Buscar anastomose').fill('falcotentorial');
  await expect(page.getByText(/Sem representação individual/)).toBeVisible();
  await page.getByRole('button', { name: 'Restaurar visão', exact: true }).click();
  await expect(page.getByLabel('Artérias embrionárias', { exact: true })).not.toBeChecked();
});

test('immediately hides the old 2D frame while a changed visibility request is held', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    const gate = window as unknown as { hold: boolean; frames: Array<() => void> };
    gate.hold = false; gate.frames = [];
    window.Worker = class {
      inner: Worker;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      constructor(url: string | URL, options?: WorkerOptions) {
        this.inner = new NativeWorker(url, options);
        this.inner.onmessage = event => {
          const deliver = () => this.onmessage?.(event);
          if (gate.hold) gate.frames.push(deliver); else deliver();
        };
        this.inner.onerror = event => this.onerror?.(event);
      }
      postMessage(message: unknown, transfers: Transferable[] = []) { this.inner.postMessage(message, transfers); }
      terminate() { this.inner.terminate(); }
    } as unknown as typeof Worker;
  });
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  await page.getByLabel('Artérias embrionárias', { exact: true }).check();
  const image = page.getByTestId('atlas-angiography');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  await expect(image).toHaveCSS('visibility', 'visible');
  await page.evaluate(() => { (window as unknown as { hold: boolean }).hold = true; });
  await page.getByLabel('Artérias embrionárias', { exact: true }).uncheck();
  await expect(image).toHaveCSS('visibility', 'hidden');
  await page.evaluate(() => {
    const gate = window as unknown as { hold: boolean; frames: Array<() => void> };
    gate.hold = false; gate.frames.splice(0).forEach(deliver => deliver());
  });
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  await expect(image).toHaveCSS('visibility', 'visible');
});
