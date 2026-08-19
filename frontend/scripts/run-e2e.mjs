import { readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(scriptDirectory, "..");
const repositoryDirectory = resolve(frontendDirectory, "..");
const demoDirectory = join(repositoryDirectory, ".demo");
const playwrightCli = join(frontendDirectory, "node_modules", "@playwright", "test", "cli.js");

function cleanupE2EResidue() {
  let entries = [];
  try {
    entries = readdirSync(demoDirectory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const isOwnedFile = entry.isFile() && /^e2e-\d+\.db(?:-wal|-shm)?$/.test(entry.name);
    const isOwnedDirectory = entry.isDirectory() && /^e2e-uploads-\d+$/.test(entry.name);
    if (!isOwnedFile && !isOwnedDirectory) continue;
    rmSync(join(demoDirectory, entry.name), { force: true, recursive: isOwnedDirectory });
  }
}

cleanupE2EResidue();
const result = spawnSync(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
  cwd: frontendDirectory,
  env: process.env,
  stdio: "inherit",
});
cleanupE2EResidue();
process.exit(result.status ?? 1);
