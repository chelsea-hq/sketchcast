import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

// Next loads .env.local automatically. Explicit empty values keep Community
// browser tests independent of any developer's paid-service configuration.
const communityEnv = Object.fromEntries(
  [...readFileSync(new URL("./.env.example", import.meta.url), "utf8").matchAll(/^([A-Z][A-Z0-9_]*)=/gm)]
    .map((match) => [match[1], ""]),
);
const production = process.env.SKETCHCAST_E2E_PRODUCTION === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./output/playwright/test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3338",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  webServer: {
    command: `npm run ${production ? "start" : "dev"} -- --hostname 127.0.0.1 --port 3338`,
    url: "http://127.0.0.1:3338/studio",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...communityEnv, NEXT_TELEMETRY_DISABLED: "1" },
  },
});
