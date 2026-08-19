import { existsSync, rmSync } from "node:fs";
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
const demoDir = join(repositoryDir, ".demo");
const defaultDbPath = join(demoDir, `e2e-${process.pid}.db`);
const defaultUploadDir = join(demoDir, `e2e-uploads-${process.pid}`);
const ownsTemporaryData = !process.env.RHC_DATABASE_URL && !process.env.RHC_UPLOAD_DIR;
const {
  OPENAI_API_KEY: _ignoredOpenAIKey,
  RHC_OPENAI_API_KEY: _ignoredRhcKey,
  ...cleanEnvironment
} = process.env;

if (!existsSync(python)) {
  console.error(`Backend Python was not found at ${python}. Run the setup steps first.`);
  process.exit(1);
}

const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", port], {
  cwd: backendDir,
  env: {
    ...cleanEnvironment,
    RHC_AI_ENABLED: "false",
    RHC_DATABASE_URL: process.env.RHC_DATABASE_URL || `sqlite:///${defaultDbPath.replaceAll("\\", "/")}`,
    RHC_UPLOAD_DIR: process.env.RHC_UPLOAD_DIR || defaultUploadDir,
  },
  stdio: "inherit",
});

function cleanupTemporaryData() {
  if (!ownsTemporaryData) return;
  for (const path of [defaultDbPath, `${defaultDbPath}-wal`, `${defaultDbPath}-shm`, defaultUploadDir]) {
    rmSync(path, { force: true, recursive: path === defaultUploadDir });
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
process.on("exit", cleanupTemporaryData);
child.on("exit", (code) => {
  cleanupTemporaryData();
  process.exit(code ?? 1);
});
