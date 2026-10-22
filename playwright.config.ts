import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/neuro3d",
  timeout: 45000,
  use: {
    serviceWorkers: "block",
    baseURL: process.env.ATLAS_BASE_URL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.ATLAS_CHROMIUM_PATH,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.ATLAS_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: true,
      },
});
