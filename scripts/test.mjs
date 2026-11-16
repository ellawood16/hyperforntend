import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "hyperapp-tests-"));
try {
  const outfile = join(directory, "tests.cjs");
  await build({ entryPoints: ["tests/index.ts"], bundle: true, platform: "node", format: "cjs", define: { "import.meta.env": JSON.stringify({ DEV: false, VITE_API_BASE: "https://example.invalid" }) }, outfile, alias: { "@": resolve("src") } });
  process.exitCode = spawnSync(process.execPath, ["--test", "--test-isolation=none", outfile], { stdio: "inherit" }).status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
