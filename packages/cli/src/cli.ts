#!/usr/bin/env tsx
import { runCli } from "./commands";

// Piping to tools like `head` closes stdout early; exit cleanly instead of crashing.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") {
    process.exit(0);
  }
  throw error;
});

const exitCode = await runCli(process.argv.slice(2), {
  writeOut: (line) => process.stdout.write(`${line}\n`),
  writeErr: (line) => process.stderr.write(`${line}\n`),
});
process.exitCode = exitCode;
