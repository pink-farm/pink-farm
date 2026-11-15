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

  const prismaSrc = path.join(rootDir, "node_modules", ".prisma");
  const prismaDest = path.join(standaloneDir, "node_modules", ".prisma");
  if (fs.existsSync(prismaSrc)) {
    console.log("[prepare-standalone] Copying node_modules/.prisma -> .next/standalone/node_modules/.prisma ...");
    fs.cpSync(prismaSrc, prismaDest, { recursive: true });
  }

  const DIRECT_ATLAS_URL = "mongodb://pinkfarmofficial_db_user:YJOzGQB0Uw0fTh74@ac-keqggmu-shard-00-00.6cnomix.mongodb.net:27017,ac-keqggmu-shard-00-01.6cnomix.mongodb.net:27017,ac-keqggmu-shard-00-02.6cnomix.mongodb.net:27017/pinkfarm?ssl=true&replicaSet=atlas-fwl6da-shard-0&authSource=admin&retryWrites=true&w=majority";

  // Ensure .env is present in standalone directory so runtime server.js has all environment variables
  const rootEnv = path.join(rootDir, ".env");
  const standaloneEnv = path.join(standaloneDir, ".env");

  const envDefaults = {
    DATABASE_URL: DIRECT_ATLAS_URL,
    SESSION_SECRET: "jEnN6VuJ_oZhhOGp1hk5clXsZEL6dNS1WErW_qp70hX6eKGEpopbXw_qb-nXw1gg",
    ADMIN_EMAIL: "pinkfarmofficial@gmail.com",
    ADMIN_PASSWORD: "Pinkfarm@123",
    TRUST_PROXY: "1",
  };

  const envVars = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "BREVO_API_KEY",
    "BREVO_FROM_EMAIL",
    "BREVO_FROM_NAME",
    "TRUST_PROXY",
  ];

  const lines = [];
  for (const key of envVars) {
    let val = process.env[key] || envDefaults[key];
    if (key === "DATABASE_URL" && val) {
      if (val.startsWith("mongodb+srv:") || val.includes("YJOzGQBOwOfTh74")) {
        val = DIRECT_ATLAS_URL;
      }
    }
    if (val) {
      lines.push(`${key}="${val}"`);
    }
  }

  if (fs.existsSync(rootEnv)) {
    console.log("[prepare-standalone] Copying .env -> .next/standalone/.env ...");
    fs.copyFileSync(rootEnv, standaloneEnv);
  } else if (lines.length > 0) {
    console.log(`[prepare-standalone] Writing ${lines.length} environment variables to .next/standalone/.env ...`);
    fs.writeFileSync(standaloneEnv, lines.join("\n") + "\n", "utf8");
  }

  // Inject a lightweight .env loader into the top of server.js if not already present
  const serverJsPath = path.join(standaloneDir, "server.js");
  if (fs.existsSync(serverJsPath)) {
    let serverCode = fs.readFileSync(serverJsPath, "utf8");
    if (!serverCode.includes("__PINKFARM_ENV_LOADED__")) {
      const envLoader = `// __PINKFARM_ENV_LOADED__
(function() {
  const fs = require('fs');
  const path = require('path');
  const candidates = [path.join(__dirname, '.env'), path.resolve(__dirname, '..', '..', '.env'), path.resolve(process.cwd(), '.env')];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const lines = fs.readFileSync(p, 'utf8').split('\\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const k = trimmed.slice(0, eq).trim();
            let v = trimmed.slice(eq + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            if (!process.env[k]) process.env[k] = v;
          }
        }
      } catch {}
    }
  }
})();
`;
      serverCode = envLoader + serverCode;
      fs.writeFileSync(serverJsPath, serverCode, "utf8");
      console.log("[prepare-standalone] Injected environment loader into .next/standalone/server.js");
    }
  }

  console.log("[prepare-standalone] Standalone build prepared successfully! Ready for Hostinger deployment.");
} catch (err) {
  console.error("[prepare-standalone] Error copying assets:", err);
  process.exit(1);
}
