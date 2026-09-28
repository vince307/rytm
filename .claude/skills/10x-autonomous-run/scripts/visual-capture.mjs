#!/usr/bin/env node
// Playwright FALLBACK for the visual gate (the first choice is Claude-in-Chrome —
// see references/visual-gate.md). Drives headless system Chrome, needs no human.
//
// Playwright is not a repo dependency; install it outside the repo:
//   npm i --prefix "$TMPDIR/pw" playwright@1.55
//   PW_DIR="$TMPDIR/pw" node .claude/skills/10x-autonomous-run/scripts/visual-capture.mjs spec.json
//
// spec.json (keep it OUTSIDE the repo, e.g. $TMPDIR):
// {
//   "baseUrl": "http://localhost:4399",
//   "outDir": "context/changes/<id>/screenshots",
//   "viewports": [1440, 400],                        // widths; height 900 (desktop) / 812 (<=600)
//   "auth": { "register": true },                    // fresh account via /register (default), or
//   // "auth": { "email": "test@rytm.local", "password": "Rytm-Test-Passw0rd!" }   -> /login
//   "setup": [ { "goto": "/imports/new" }, { "upload": "input[type=file]", "file": "test/fixtures/ing/Lista_transakcji_nr_0000123456_010926.csv" }, ... ],
//   "shots": [
//     { "name": "lista", "path": "/patterns", "fullPage": true },
//     { "name": "dialog-open", "path": "/imports", "actions": [ { "click": "text=Usuń import" }, { "waitFor": "[role=dialog]" } ] },
//     { "name": "kit-lista", "url": "file:///abs/path/design/rytm-os/prototype/views/patterns.html" }
//   ]
// }
// Actions: goto, click, fill {fill, value}, press {press: "Tab"|"Enter"|…}, upload {upload, file},
// waitFor (selector), wait (ms). Setup runs once per viewport context, before the shots.
// Output: <outDir>/<name>-desktop.png (width > 600) or <name>-mobile.png. Prints one line per file.
// A shot that throws is reported as NOT CAPTURED — never replaced by anything else.

import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const require = createRequire(join(process.env.PW_DIR ?? process.cwd(), "noop.js"));
const { chromium } = require("playwright");

const spec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const base = spec.baseUrl.replace(/\/$/, "");
mkdirSync(spec.outDir, { recursive: true });

async function run(page, steps = []) {
  for (const s of steps) {
    if (s.goto) await page.goto(base + s.goto, { waitUntil: "networkidle" });
    else if (s.click) await page.click(s.click);
    else if (s.fill) await page.fill(s.fill, s.value ?? "");
    else if (s.press) await page.keyboard.press(s.press);
    else if (s.upload) await page.setInputFiles(s.upload, resolve(s.file));
    else if (s.waitFor) await page.waitForSelector(s.waitFor);
    else if (s.wait) await page.waitForTimeout(s.wait);
  }
}

async function signIn(page) {
  const a = spec.auth ?? { register: true };
  if (a.register) {
    const email = `visual-${Date.now()}-${Math.floor(Math.random() * 1e4)}@rytm.local`;
    await page.goto(`${base}/register`, { waitUntil: "networkidle" });
    if (await page.$("#name")) await page.fill("#name", "Visual Gate");
    await page.fill("#email", email);
    await page.fill("#password", "Visual-Gate-Passw0rd!");
    await Promise.all([page.waitForLoadState("networkidle"), page.click("button[type=submit]")]);
    return email;
  }
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", a.email);
  await page.fill("#password", a.password);
  await Promise.all([page.waitForLoadState("networkidle"), page.click("button[type=submit]")]);
  return a.email;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
let failed = 0;
try {
  for (const width of spec.viewports ?? [1440, 400]) {
    const mobile = width <= 600;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 812 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const who = await signIn(page);
    console.log(`# ${width}px signed in as ${who} -> ${page.url()}`);
    await run(page, spec.setup);
    for (const shot of spec.shots) {
      const file = join(spec.outDir, `${shot.name}-${mobile ? "mobile" : "desktop"}.png`);
      try {
        await page.goto(shot.url ?? base + shot.path, { waitUntil: "networkidle" });
        await run(page, shot.actions);
        await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
        console.log(`OK ${file}`);
      } catch (e) {
        failed++;
        console.log(`NOT CAPTURED ${file} — ${e.message.split("\n")[0]}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
