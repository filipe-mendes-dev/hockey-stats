import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "benchline-chronology-"));
const entries = {
  matchEventOrder: "tests/domain/matches/matchEventOrder.test.ts",
  matchChronology: "tests/domain/matches/matchChronology.test.ts",
  playingTime: "tests/domain/matches/playingTime.test.ts",
};
try {
  await build({
    entryPoints: entries,
    outdir: directory,
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
  });
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      ...Object.keys(entries).map((name) => join(directory, `${name}.mjs`)),
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
