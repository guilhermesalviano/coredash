import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import dotenv from "dotenv";

const envPath = resolve(".env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const serverPath = resolve(".next/standalone/server.js");

if (!existsSync(serverPath)) {
  console.error("CoreDash production build not found. Building it before startup...");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npmCommand, ["run", "build"], {
    stdio: "inherit",
    env: process.env,
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

// Standalone output does not include static assets; Next.js requires copying
// them in manually after every build or the client bundles 404 and pages
// render blank.
const staticSource = resolve(".next/static");
const staticTarget = resolve(".next/standalone/.next/static");
if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true });
}

const publicSource = resolve("public");
const publicTarget = resolve(".next/standalone/public");
if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true });
}

const server = spawn(process.execPath, [serverPath], {
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
