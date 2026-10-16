import { expect, test } from "@playwright/test";
const route = "/#/tools/neuro3d";
test("Mentice catalogue is filterable and only embeds a selected video after an explicit click", async ({
  page,
}) => {
  const videoRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("youtube-nocookie")) videoRequests.push(r.url());
  });
  await page.route("https://www.youtube-nocookie.com/**", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: "<p>External player stub for UI testing</p>",
    }),
  );
  await page.goto(route);
  await page
    .getByRole("button", { name: "Vídeos Mentice", exact: true })
    .click();
  await expect(page.locator(".n3-videogrid article")).toHaveCount(55);
  expect(videoRequests).toHaveLength(0);
  await page
    .getByLabel("Buscar vídeos", { exact: true })
    .fill("Brain Aneurysm Coiling Demo");
  await expect(page.locator(".n3-videogrid article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Selecionar vídeo", exact: true })
    .click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Carregar vídeo do YouTube", exact: true })
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie.com\/embed\/BpPYaBwrbT8/,
  );
  await expect(
    page.getByRole("link", { name: "Abrir no YouTube ↗", exact: true }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=BpPYaBwrbT8");
});
test("simulation requires checks, handles an event and saves a debrief", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await expect(page.locator(".n3-cases button")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Iniciar exercício", exact: true })
    .click();
  await expect(page.getByTestId("device-3d").locator("canvas")).toBeVisible();
  await page
    .getByLabel("Família de dispositivo", { exact: true })
    .selectOption("coil");
  await page
    .getByRole("button", { name: "Continuar etapa", exact: true })
    .click();
  await page.getByLabel("Posição na trajetória", { exact: true }).fill("80");
  await expect(
    page.getByRole("button", { name: "Continuar etapa", exact: true }),
  ).toBeDisabled();
  for (const label of [
    "Examinei o alvo e a anatomia vinculada",
    "Comparei duas projeções esquemáticas",
    "Reconheci a função e os limites da família de dispositivo",
  ])
    await page.getByLabel(label, { exact: true }).check();
  await page
    .getByRole("button", {
      name: "Treinar intercorrência: projeção ambígua",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Comparei duas projeções esquemáticas", { exact: true }),
  ).not.toBeChecked();
  await page
    .getByLabel("Comparei duas projeções esquemáticas", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Continuar etapa", exact: true })
    .click();
  await page
    .getByLabel("Progresso do dispositivo", { exact: true })
    .fill("100");
  await page
    .getByRole("button", { name: "Continuar etapa", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "A. Ocupação do saco por espirais",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Salvar revisão", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Revisão salva", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await expect(page.locator(".n3-cases button").first()).toContainText(
    "Revisão registrada",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("the MMA case opens its linked videos and anatomical variant", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await page
    .locator(".n3-cases button")
    .filter({ hasText: "Meníngea média" })
    .click();
  await page
    .getByRole("button", { name: "Vídeos deste exercício", exact: true })
    .click();
  await expect(page.locator(".n3-videogrid article")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Explorar anatomia vinculada", exact: true })
    .click();
  await expect(page.locator(".n3-sceneheading h2")).toHaveText(
    "Anastomoses ECA–ACI–oftálmica",
  );
  await expect(
    page.getByRole("button", {
      name: "Suprimento meningo-oftálmico",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("resizing an already loaded 3D task to a phone keeps the layout within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  await page.getByRole("button", { name: "Simulação", exact: true }).click();
  await page
    .getByRole("button", { name: "Iniciar exercício", exact: true })
    .click();
  await expect(page.getByTestId("device-3d").locator("canvas")).toBeVisible();
  await page.setViewportSize({ width: 393, height: 852 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});
