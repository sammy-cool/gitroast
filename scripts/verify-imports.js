// Usage (from repo root):  node scripts/verify-imports.js
// Lists every relative require()/import (and the "@/" alias in client/src) that points to a file that does not exist.
const fs = require("fs");
const path = require("path");

const roots = [
  { dir: "server", alias: null },
  { dir: "shared", alias: null },
  { dir: "client/src", alias: { prefix: "@/", base: "client/src" } },
];
const EXT = ["", ".js", ".jsx", ".mjs", ".json", ".css", "/index.js", "/index.jsx"];
const exists = (p) => EXT.some((e) => fs.existsSync(p + e) && (e !== "" || fs.statSync(p).isFile()));
let missing = 0;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "coverage"].includes(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

for (const { dir, alias } of roots) {
  for (const file of walk(dir)) {
    const src = fs.readFileSync(file, "utf8");
    const re = /(?:require\(\s*|from\s+|import\s+|import\(\s*)['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      let target = null;
      if (spec.startsWith("./") || spec.startsWith("../")) target = path.resolve(path.dirname(file), spec);
      else if (alias && spec.startsWith(alias.prefix)) target = path.resolve(alias.base, spec.slice(alias.prefix.length));
      if (target && !exists(target)) {
        missing += 1;
        console.log(`MISSING  ${file.replace(/\\/g, "/")}  ->  ${spec}`);
      }
    }
  }
}
console.log(missing ? `\n${missing} missing file(s). Extract gitroast-COMPLETE-all-changes.zip again.` : "OK: every relative import resolves.");
process.exit(missing ? 1 : 0);
