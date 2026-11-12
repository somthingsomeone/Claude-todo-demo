import "./env.ts";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getDb, UPLOAD_DIR } from "./db.ts";
import { api } from "./routes.ts";
import { requireAuth } from "./auth.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.APP_PASSWORD) {
  console.error("\n  APP_PASSWORD is not set. Set it in your hosting dashboard so only you can open the app.\n");
  process.exit(1);
}

getDb();
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use("/api", express.json({ limit: "12mb" }), api);
app.use("/files", requireAuth, express.static(UPLOAD_DIR, { maxAge: "365d", immutable: true, fallthrough: false }));

const dist = path.resolve(here, "../dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api|\/files).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Storyloom running on http://localhost:${port}${process.env.APP_PASSWORD ? "" : "  (no APP_PASSWORD set: open access, local use only)"}`);
});
