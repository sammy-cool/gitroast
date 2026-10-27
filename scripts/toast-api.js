// Usage (from repo root, after `npm install` in client/):  node scripts/toast-api.js
// Prints the installed customizable-toast-notification version and every icon-related line in its
// TypeScript definitions, so the exact option names can be wired into client/src/utils/toastOptions.js.
const fs = require("fs");
const path = require("path");

const pkgDir = ["client/node_modules/customizable-toast-notification", "node_modules/customizable-toast-notification"]
  .map((p) => path.resolve(p))
  .find((p) => fs.existsSync(path.join(p, "package.json")));

if (!pkgDir) {
  console.log("Package not found. Run `npm install` inside client/ first.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
console.log(`customizable-toast-notification@${pkg.version}`);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.d\.(ts|mts|cts)$/.test(name)) out.push(full);
  }
  return out;
}

const files = walk(pkgDir);
if (!files.length) console.log("No .d.ts files found in the package.");
let hits = 0;
for (const f of files) {
  const rel = path.relative(pkgDir, f).replace(/\\/g, "/");
  fs.readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
    if (/icon/i.test(line)) {
      hits += 1;
      console.log(`${rel}:${i + 1}: ${line.trim()}`);
    }
  });
}
// CSS custom properties exposed by the package stylesheet (for the theme/CSS-variable cleanup).
const cssVars = new Set();
(function walkCss(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkCss(full);
    else if (name.endsWith(".css")) {
      for (const m of fs.readFileSync(full, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/gi)) cssVars.add(`${path.relative(pkgDir, full).replace(/\\/g, "/")}  ${m[1]}`);
    }
  }
})(pkgDir);
if (cssVars.size) console.log("\nCSS variables:\n" + [...cssVars].sort().join("\n"));

console.log(hits ? `\n${hits} icon-related line(s). Paste this output back and the icons get wired exactly.` : "\nNo icon-related typings found (check the README for the option name).");
