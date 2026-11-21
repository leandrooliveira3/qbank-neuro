import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Block } from '../../features/neuro3d/course/model';

const manifest: Block[] = JSON.parse(readFileSync(
  new URL('../../features/neuro3d/course/content/index.json', import.meta.url), 'utf8',
));

test('navega entre teoria, revisão e questões de todos os módulos e registra a resposta', async ({ page }) => {
  await page.goto('/#/tools/nri');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  await expect(course.getByRole('heading', { name: 'Blocos do curso' })).toBeVisible();
  await expect(course.locator('.nri-course-catalog a')).toHaveCount(13);
  await course.getByRole('link', { name: 'Começar pela aula 1A' }).click();
  await expect(course.getByRole('heading', { name: /1A · Carótida externa/ })).toBeVisible();
  await expect(course.locator('article')).toBeVisible();
  expect(await course.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
    await course.evaluate((node) => node.clientWidth + 1),
  );
  await course.getByRole('searchbox', { name: 'Buscar aulas' }).fill('markowski');
  await course.getByRole('link', { name: /2K.*Vascularização medular/ }).click();
  await expect(course.getByRole('heading', { name: /2K · Vascularização medular/ })).toBeVisible();
  await course.getByRole('link', { name: 'Revisão de prova' }).click();
  await expect(course.locator('article')).toHaveCount(0);
  await expect(course.getByRole('table')).toContainText('Markowski');
  await course.getByRole('link', { name: 'Questões', exact: true }).click();
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
  await page.goto('/#/tools/nri?bloco=8&modulo=8A&estudo=questoes');
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
  await page.goto('/#/tools/nri?bloco=13&modulo=13.7');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: /QBank-Neuro/ })).toHaveAttribute('href', '#/');
  await expect(course.locator('.nri-course-main')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const illustration = course.getByRole('img', { name: /PHASES estima ruptura/ });
  await illustration.scrollIntoViewIfNeeded();
  await expect(illustration).toBeVisible();
  await expect.poll(() => illustration.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(500);
  const comparison = course.locator('table').filter({ has: page.getByRole('columnheader', { name: 'UIATS', exact: true }) }).first();
  await expect(comparison.getByRole('row').filter({ hasText: 'Desfecho' })).toContainText('Recomendação de manejo');
  await course.getByText('Sumário da aula', { exact: true }).click();
  await course.getByRole('button', { name: /Três modelos, três perguntas diferentes/ }).click();
  await expect(course.getByRole('heading', { name: /Três modelos, três perguntas diferentes/ })).toBeFocused();
});

test('abre a aula pela URL antiga e segue entre blocos sem escolher arquivos', async ({ page }) => {
  await page.goto('/#/tools/neuro3d?tab=curso&bloco=1&modulo=1F&leitura=original');
  const course = page.getByRole('region', { name: 'Curso NRI 2027' });
  await expect(course.getByRole('article', { name: 'Conteúdo da aula' })).toBeVisible();
  await expect(page).toHaveURL(/#\/tools\/nri\?bloco=1&modulo=1F$/);
  await expect(course.locator('input[accept*="pdf"]')).toHaveCount(0);
  await course.getByRole('link', { name: 'Próxima aula · 2A' }).click();
  await expect(course.getByRole('heading', { name: /^2A ·/ })).toBeVisible();
  await expect(course.getByRole('article', { name: 'Conteúdo da aula' })).toBeVisible();
});

for (const block of manifest) {
  test(`bloco ${block.id}: cada aula tem leitura nativa e o bloco oferece 100 questões`, async ({ page }) => {
    const route = `/#/tools/nri?bloco=${block.id}`;
    await page.goto(route);
    const course = page.getByRole('region', { name: 'Curso NRI 2027' });
    await expect(course.locator('.nri-block-index .nri-lesson-list a')).toHaveCount(block.lessons.length);
    const text = course.getByRole('article', { name: 'Conteúdo da aula' });
    for (const lesson of block.lessons) {
      await page.goto(`${route}&modulo=${lesson.id}`);
      await expect(course.getByRole('heading', { name: `${lesson.id} · ${lesson.title}`, exact: true })).toBeVisible();
      await expect(text).toBeVisible();
      expect((await text.innerText()).length).toBeGreaterThan(1_000);
    }
    for (const lesson of block.lessons) {
      await page.goto(`${route}&modulo=${lesson.id}&estudo=revisao`);
      await expect.poll(() => course.getByRole('table').getByRole('row').count()).toBeGreaterThanOrEqual(8);
    }
    await page.goto(`${route}&modulo=todos&estudo=questoes`);
    await expect(course.getByRole('combobox', { name: 'Selecionar questão' }).locator('option')).toHaveCount(100);
  });
}

test('o Atlas mantém a preparação e o Curso NRI tem acesso independente', async ({ page }) => {
  await page.goto('/#/tools/neuro3d');
  const nav = page.getByRole('navigation', { name: 'Seções do atlas' });
  await expect(nav.getByRole('button', { name: 'Preparação NRI 2027' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Curso NRI 2027' })).toHaveCount(0);
});
