import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryDir = resolve(scriptDir, "..", "..");
const backendDir = join(repositoryDir, "backend");
const python = process.env.RHC_PYTHON || (process.platform === "win32"
  ? join(backendDir, ".venv", "Scripts", "python.exe")
  : join(backendDir, ".venv", "bin", "python"));
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? process.argv[portIndex + 1] : "8000";

if (!existsSync(python)) {
  console.error(`Backend Python was not found at ${python}. Run the setup steps first.`);
  process.exit(1);
}

const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", port], {
  cwd: backendDir,
  env: {
    ...process.env,
    RHC_DATABASE_URL: process.env.RHC_DATABASE_URL || `sqlite:///${join(repositoryDir, ".demo", "e2e.db").replaceAll("\\", "/")}`,
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 1));
