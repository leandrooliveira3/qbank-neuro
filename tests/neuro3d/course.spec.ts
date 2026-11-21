import { expect, test } from '@playwright/test';

test('navega entre teoria, revisão e questões de todos os módulos e registra a resposta', async ({ page }) => {
  await page.goto('/#/tools/neuro3d?tab=curso');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  await expect(course.getByRole('heading', { name: /1A · Carótida externa/ })).toBeVisible();
  await expect(course.locator('article')).toBeVisible();
  expect(await course.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
    await course.evaluate((node) => node.clientWidth + 1),
  );
  await course.getByRole('searchbox', { name: 'Buscar módulos' }).fill('markowski');
  await course.getByRole('button', { name: /2K ·? ?Vascularização medular/ }).click();
  await expect(course.getByRole('heading', { name: /2K · Vascularização medular/ })).toBeVisible();
  await course.getByRole('button', { name: 'Revisão de prova' }).click();
  await expect(course.locator('article')).toHaveCount(0);
  await expect(course.getByRole('table')).toContainText('Markowski');
  await course.getByRole('button', { name: 'Questões', exact: true }).click();
  await course.getByRole('button', { name: 'Praticar o bloco inteiro' }).click();
  await expect(course.getByRole('combobox', { name: 'Selecionar questão' }).locator('option')).toHaveCount(100);
  await expect(course.getByText(/Gabarito [A-E]/)).toHaveCount(0);
  await course.getByRole('radio').nth(2).check();
  await course.getByRole('button', { name: 'Conferir resposta' }).click();
  await expect(course.getByText(/Gabarito [A-E]/)).toBeVisible();
  await page.reload();
  await expect(course.getByText(/1\/100 respondidas/)).toBeVisible();
  await expect(course.getByText(/Gabarito [A-E]/)).toBeVisible();
  expect(await course.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
    await course.evaluate((node) => node.clientWidth + 1),
  );
});

test('importa JSON válido e rejeita arquivos conflitantes sem remover questões salvas', async ({ page }) => {
  await page.goto('/#/tools/neuro3d?tab=curso&bloco=8&modulo=8A&estudo=questoes');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  await course.getByText('Importar questões JSON').click();
  const entry = {
    id: 'test-clinico', lesson: '8A', prompt: 'Qual escala mede déficit neurológico agudo?',
    options: ['mRS', 'NIHSS', 'ELAPSS', 'UIATS', 'PHASES'], answer: 1,
    explanation: 'A NIHSS mede o déficit neurológico.',
  };
  async function upload(item: unknown) {
    await course.locator('input[type=file]').setInputFiles({
      name: 'questoes.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ questions: [item] })),
    });
  }
  await upload(entry);
  await expect(course.getByText('1 questão incorporada neste navegador.')).toBeVisible();
  const questionSelect = course.getByRole('combobox', { name: 'Selecionar questão' });
  await questionSelect.selectOption(await questionSelect.locator('option').last().getAttribute('value') ?? '0');
  await expect(course.getByText(entry.prompt)).toBeVisible();
  await upload({ ...entry, answer: 3 });
  await expect(course.getByText(/Importação interrompida/)).toBeVisible();
  await page.reload();
  await questionSelect.selectOption(await questionSelect.locator('option').last().getAttribute('value') ?? '0');
  await expect(course.getByText(entry.prompt)).toBeVisible();
});

test('aplica a paleta do QBank, restaura a tabela e exibe o esquema da aula 13.7', async ({ page }) => {
  await page.goto('/#/tools/neuro3d?tab=curso&bloco=13&modulo=13.7');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  const mainNavigation = page.getByRole('navigation', { name: 'Seções do atlas' });
  for (const section of ['Módulos', 'Questões', 'Matriz', 'Progresso']) {
    await expect(mainNavigation.getByRole('button', { name: section, exact: true })).toHaveCount(0);
  }
  await expect(course.locator('.nri-course-main')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const illustration = course.getByRole('img', { name: /PHASES estima ruptura/ });
  await illustration.scrollIntoViewIfNeeded();
  await expect(illustration).toBeVisible();
  await expect.poll(() => illustration.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(500);
  const comparison = course.locator('table').filter({ has: page.getByRole('columnheader', { name: 'UIATS', exact: true }) }).first();
  await expect(comparison.getByRole('row').filter({ hasText: 'Desfecho' })).toContainText('Recomendação de manejo');
  await course.getByText('Nesta aula', { exact: true }).click();
  await course.getByRole('button', { name: /Três modelos, três perguntas diferentes/ }).click();
  await expect(course.getByRole('heading', { name: /Três modelos, três perguntas diferentes/ })).toBeFocused();
});

test('recorta a aula original a partir do PDF vinculado e mantém o vínculo após recarregar', async ({ page }) => {
  const path = process.env.NRI_TRANSCRIPT_PDF;
  test.skip(!path, 'O PDF original deve estar disponível localmente.');
  await page.goto('/#/tools/neuro3d?tab=curso&bloco=13&modulo=13.7&leitura=original');
  const source = page.getByRole('region', { name: 'Páginas originais' });
  await expect(source.getByText(/páginas 313–323/)).toBeVisible();
  await source.locator('input[type=file]').setInputFiles(path!);
  const first = source.getByRole('img', { name: 'Página 313 da aula na exportação original' });
  await expect(first).toBeVisible();
  expect(await first.evaluate((node: HTMLCanvasElement) => node.height)).toBeLessThan(400);
  await source.getByRole('button', { name: 'Próxima página' }).click();
  const next = source.getByRole('img', { name: 'Página 314 da aula na exportação original' });
  await expect(next).toBeVisible();
  const height = await next.evaluate((node: HTMLCanvasElement) => node.height);
  expect(height).toBeGreaterThan(1500);
  await page.reload();
  await expect(first).toBeVisible();
});
