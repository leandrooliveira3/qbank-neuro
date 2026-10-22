import { expect, test } from "@playwright/test";
const route = "/#/tools/neuro3d";
test("the simulator is a workstation rather than a video library, with four selectable clinical cases", async ({
  page,
}) => {
  await page.goto(route);
  await expect(
    page.getByRole("button", { name: "Vídeos Mentice", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Console da hemodinâmica", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Caso clínico", { exact: true }).locator("option"),
  ).toHaveCount(4);
  await page.getByLabel("Caso clínico", { exact: true }).selectOption("m1");
  await expect(page.locator(".nvs-case")).toContainText("oclusão proximal");
  await page
    .getByLabel("Dispositivo terapêutico", { exact: true })
    .selectOption("retriever");
  await page
    .getByRole("button", { name: "Carregar dispositivo", exact: true })
    .click();
  await expect(page.locator(".nvs-device")).toContainText("Stent retriever");
  await expect(page.locator("iframe")).toHaveCount(0);
});
test("wire and catheter are controlled separately, DSA produces contrast and a captured roadmap becomes stale after C-arm rotation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await page
    .getByLabel("Passo de manipulação", { exact: true })
    .selectOption("1.2");
  await page.getByRole("button", { name: "↑ Avançar", exact: true }).click();
  await page.getByRole("button", { name: "↑ Avançar", exact: true }).click();
  await page
    .getByRole("button", { name: "2 · Cateter-guia", exact: true })
    .click();
  await page.getByRole("button", { name: "↑ Avançar", exact: true }).click();
  await page.getByRole("button", { name: "DSA", exact: true }).click();
  await page.getByRole("button", { name: /Injetar contraste virtual/ }).click();
  await expect(page.locator(".nvs-events")).toContainText("Contraste virtual");
  await page.getByRole("button", { name: /Capturar roadmap/ }).click();
  await expect(page.locator(".nvs-events")).toContainText(
    "Máscara de roadmap capturada",
  );
  await page.getByLabel("RAO / LAO", { exact: true }).fill("30");
  await expect(
    page.getByRole("status").filter({ hasText: "roadmap desalinhado" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("the pedal is momentary, machine controls affect live imaging, and mobile layout stays in bounds", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await page
    .getByLabel("Manipulador virtual: arraste para avançar e girar", {
      exact: true,
    })
    .focus();
  await page.keyboard.down("Space");
  await expect(page.locator(".nvs-rx")).toContainText("ATIVO");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Space");
  await expect(page.locator(".nvs-rx")).toContainText("PAUSADO");
  await page.getByText("Mesa, imagem e osso", { exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".nvs-rx")).toContainText("PAUSADO");
  await page.getByLabel("Magnificação", { exact: true }).fill("3");
  await expect(page.getByLabel("Magnificação", { exact: true })).toHaveValue(
    "3",
  );
  await page.getByLabel("Colimação", { exact: true }).fill("55");
  await page.setViewportSize({ width: 393, height: 852 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await expect(page.getByTestId("fluoro-A")).toBeVisible();
});
test("a session can be exported and ended without claiming proficiency", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar sessão", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain("neuro3d_sessao_");
  await page
    .getByRole("button", { name: "Encerrar e registrar sessão", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Sessão registrada");
  await expect(page.locator(".nvs-outcome")).toContainText(
    "Objetivo ainda incompleto",
  );
});

test('source arch entry reaches the left ICA and supports an interactive angiographic 3D assistant', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', {name: 'Simulação', exact: true}).click();
  await page.getByLabel('Entrada da simulação', {exact: true}).selectOption('arch');
  const tip = page.getByTestId('station-tip');
  await expect(tip).toHaveAttribute('data-edge', 'access');
  await page.getByText('Anatomia 3D e assistência', {exact:true}).click();
  await page.getByLabel('Representação 3D da estação', {exact: true}).selectOption('angiographic');
  await expect(page.getByTestId('station-3d')).toHaveAttribute('data-representation', 'angiography-3d');
  await expect(page.getByTestId('station-3d').locator('canvas')).toHaveAttribute('data-station3d-rendered', 'true');
  const advance = page.getByRole('button', {name: '↑ Avançar', exact: true});
  await page.getByLabel('Passo de manipulação', {exact: true}).selectOption('0.15');
  for (let i = 0; i < 40 && await tip.getAttribute('data-edge') === 'access'; i++) await advance.click();
  await expect(tip).toHaveAttribute('data-edge', 'ref-ARCH-1');
  const rotate = page.getByRole('button', {name: '↷ Girar +30°', exact: true});
  for(let i=0;i<6;i++) await rotate.click();
  for(let i=0;i<8 && await tip.getAttribute('data-edge') === 'ref-ARCH-1';i++) await advance.click();
  await expect(tip).toHaveAttribute('data-edge', 'ref-CCA-L');
  for(let i=0;i<6;i++) await rotate.click();
  await page.getByLabel('Passo de manipulação', {exact: true}).selectOption('1.2');
  for(let i=0;i<12 && await tip.getAttribute('data-edge') === 'ref-CCA-L';i++) await advance.click();
  await expect(tip).toHaveAttribute('data-edge', /ref-ICA-L/);
  await page.screenshot({path: `test-results/source-arch-navigation-${test.info().project.name}.png`, fullPage: true});
  expect(errors).toEqual([]);
});

test('body entries and didactic arch profiles render with a bounded device catalogue and exported provenance', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await page.getByRole('button', {name: 'Simulação', exact: true}).click();
  await page.getByText('Anatomia 3D e assistência', {exact:true}).click();
  for (const entry of ['femoral', 'radial']) {
    await page.getByLabel('Entrada da simulação', {exact: true}).selectOption(entry);
    await page.getByLabel('Perfil do arco', {exact: true}).selectOption('III');
    await expect(page.getByTestId('station-tip')).toHaveAttribute('data-edge', 'access');
    await expect(page.locator('.nvs-hint').filter({hasText: 'Perfil III'})).toContainText('2.50');
    await page.getByLabel('Representação 3D da estação', {exact: true}).selectOption('angiographic');
    await expect(page.getByTestId('station-3d').locator('canvas')).toHaveAttribute('data-station3d-rendered', 'true');
    await page.getByRole('button', {name: '↑ Avançar', exact: true}).click();
    await page.screenshot({path: `test-results/${entry}-III-${test.info().project.name}.png`, fullPage: true});
  }
  await page.locator('.nvs-catalogue > summary').click();
  await page.getByLabel('Buscar dispositivo no catálogo').fill('Onyx');
  await expect(page.getByTestId('catalogue-device')).toContainText('comportamento específico pendente');
  await expect(page.getByRole('button', {name: 'Usar representação genérica', exact: true})).toHaveCount(0);
  await page.getByRole('button', {name: 'Adicionar à bancada', exact: true}).click();
  await expect(page.getByLabel('Dispositivos na bancada')).toContainText('Onyx');
  await page.getByLabel('Buscar dispositivo no catálogo').fill('Solitaire');
  await page.getByRole('button', {name: 'Usar representação genérica', exact: true}).click();
  await expect(page.locator('.nvs-device')).toContainText('Solitaire');
  await page.getByRole('button', {name: 'Preparar bancada deste kit', exact: true}).click();
  await expect(page.getByTestId('prepared-kit')).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Exportar sessão', exact: true}).click();
  const download = await pending;
  const fs = await import('node:fs/promises');
  const report = JSON.parse(await fs.readFile((await download.path())!, 'utf8'));
  expect(report.state.referenceEntry).toBe('radial'); expect(report.state.archProfile).toBe('III');
  expect(report.state.catalogueTray).toHaveLength(2); expect(report.state.preparedKit).toBeTruthy();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
