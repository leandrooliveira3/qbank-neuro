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
