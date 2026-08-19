import { defineConfig, devices } from "@playwright/test";

const runtimeEnv = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};
const apiPort = runtimeEnv.RHC_E2E_API_PORT ?? "8000";
const frontendPort = runtimeEnv.RHC_E2E_FRONTEND_PORT ?? "5173";
const apiBaseUrl = runtimeEnv.RHC_E2E_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const frontendBaseUrl = runtimeEnv.RHC_E2E_FRONTEND_BASE_URL ?? `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: frontendBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `node ../scripts/dev/run-backend.mjs --port ${apiPort}`,
      url: `${apiBaseUrl}/health`,
      cwd: ".",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...runtimeEnv,
        RHC_CORS_ORIGINS: JSON.stringify([frontendBaseUrl]),
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      url: frontendBaseUrl,
      cwd: ".",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...runtimeEnv,
        VITE_API_BASE_URL: apiBaseUrl,
      },
    },
  ],
});
