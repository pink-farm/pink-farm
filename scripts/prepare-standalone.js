/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicSrc = path.join(rootDir, "public");
const publicDest = path.join(standaloneDir, "public");
const staticSrc = path.join(rootDir, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");

if (!fs.existsSync(standaloneDir)) {
  console.log("[prepare-standalone] .next/standalone does not exist, skipping asset copy.");
  process.exit(0);
}

try {
  if (fs.existsSync(publicSrc)) {
    console.log("[prepare-standalone] Copying public/ -> .next/standalone/public/ ...");
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  if (fs.existsSync(staticSrc)) {
    console.log("[prepare-standalone] Copying .next/static/ -> .next/standalone/.next/static/ ...");
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  console.log("[prepare-standalone] Standalone build prepared successfully! Ready for Hostinger deployment.");
} catch (err) {
  console.error("[prepare-standalone] Error copying assets:", err);
  process.exit(1);
}
