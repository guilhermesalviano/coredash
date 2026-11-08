import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

const envPath = resolve(".env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const nextBin = resolve("node_modules/next/dist/bin/next");
const args = [nextBin, "dev", ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
