import { expect, test } from "@playwright/test";
const route = "/#/tools/neuro3d";
test("renders GLB, selects structures, searches variants and changes stages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const model = page.waitForResponse(
    (r) => r.url().includes("/neuro3d/models/arch_normal.glb") && r.ok(),
  );
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QBank-Neuro 3D" }),
  ).toBeVisible();
  await model;
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-atlas-rendered",
    /arch_normal.glb/,
  );
  await page
    .getByRole("button", { name: "Tronco braquiocefálico", exact: true })
    .click();
  await expect(page.locator(".n3-dossier h3")).toHaveText(
    "Tronco braquiocefálico",
  );
  await page.getByLabel("Busca livre em todas as cenas").fill("c6");
  await page.locator(".n3-results button").first().click();
  await expect(page.locator(".n3-dossier")).toContainText("anel dural distal");
  await page.getByLabel("Busca livre em todas as cenas").fill("proatlântica");
  await expect(page.locator(".n3-results button").first()).toBeVisible();
  await page.locator(".n3-results button").first().click();
  await expect(page.locator(".n3-dossier h3")).toContainText("Proatlântica");
  await page
    .locator(".n3-scenes button")
    .filter({ hasText: "Embriologia vascular inicial" })
    .click();
  await page.getByLabel("Estágio embrionário").fill("3");
  await expect(page.locator(".n3-timeline")).toContainText("Estágio 4/4");
  await expect(page.locator(".n3-warning").first()).toContainText(
    "não homologada",
  );
  expect(errors).toEqual([]);
});
test("quiz explanations, progress survives reload, matrix and curriculum remain honest", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await page.getByRole("button", { name: "Questões", exact: true }).click();
  await page
    .getByRole("button", { name: "B. Anel dural distal", exact: true })
    .click();
  await expect(page.locator(".n3-explanation")).toContainText("Correto");
  await page.reload();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.locator(".n3-panel")).toContainText(
    "1/25 questões respondidas",
  );
  await page.getByRole("button", { name: "Matriz", exact: true }).click();
  await expect(page.locator(".n3-registry article")).toHaveCount(126);
  await page.getByLabel("Filtrar matriz").fill("DEV-A05");
  await expect(page.locator(".n3-registry article")).toHaveCount(1);
  await page.getByRole("button", { name: "Módulos", exact: true }).click();
  await expect(page.locator(".n3-modules article")).toHaveCount(16);
  await expect(page.locator(".n3-panel")).toContainText("conteúdo parcial");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("compatible projection works without WebGL and failed GLB is recoverable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type, ...args);
    } as typeof original;
  });
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await expect(page.getByTestId("compatible-view")).toBeVisible();
  await page.getByRole("button", { name: "Arco aórtico", exact: true }).click();
  await expect(page.locator(".n3-dossier h3")).toHaveText("Arco aórtico");
  await page.getByLabel("Artérias", { exact: true }).uncheck();
  await expect(page.locator(".n3-objectlist")).toContainText(
    "Nenhuma estrutura",
  );
});
test("failed model request displays fallback instead of losing atlas", async ({
  page,
}) => {
  await page.route("**/neuro3d/models/*.glb", (route) => route.abort());
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await expect(page.getByTestId("compatible-view")).toBeVisible();
  await expect(page.locator(".n3-scenes button")).toHaveCount(12);
});

test("compares variants and keeps layer controls scoped to both models", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await page.getByLabel("Comparar configurações", { exact: true }).check();
  await expect(page.locator(".n3-viewer")).toHaveCount(2);
  await expect(page.locator("canvas").nth(1)).toHaveAttribute(
    "data-atlas-rendered",
    /arch_common.glb/,
  );
  await page
    .getByLabel("Segunda configuração", { exact: true })
    .selectOption("aberrantR");
  await expect(page.locator("canvas").nth(1)).toHaveAttribute(
    "data-atlas-rendered",
    /arch_aberrantR.glb/,
  );
  await page.getByLabel("Artérias", { exact: true }).uncheck();
  await expect(page.locator(".n3-objectlist")).toContainText(
    "Nenhuma estrutura",
  );
});

test("invalid progress import preserves earlier answers", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Atlas", exact: true }).click();
  await page.getByRole("button", { name: "Embriologia e variantes conceituais", exact: true }).click();
  await page.getByRole("button", { name: "Questões", exact: true }).click();
  await page
    .getByRole("button", { name: "B. Anel dural distal", exact: true })
    .click();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await page
    .getByLabel("Importar progresso", { exact: true })
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await expect(page.getByRole("status")).toContainText(
    "dados anteriores foram preservados",
  );
  await expect(page.locator(".n3-panel")).toContainText(
    "1/25 questões respondidas",
  );
});
