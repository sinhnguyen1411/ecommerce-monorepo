import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
const ignoreDirs = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "backup"
]);
const includeExt = new Set([
  ".sql",
  ".go",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".jsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".env",
  ".css",
  ".scss",
  ".html",
  ".ps1",
  ".sh"
]);
const allowlist = new Set([
  "apps/api/internal/seed/seed_test.go",
  "apps/web/lib/format.ts",
  "apps/web/scripts/check-mojibake.mjs",
  "apps/web/scripts/fix-mojibake.mjs"
]);
const mojibakeMarkers = [
  "\u00C3",
  "\u00C4",
  "\u00E1\u00BB",
  "\u00E1\u00BA",
  "\u00C6\u00B0",
  "\u00C4\u2018",
  "\u00E2\u20AC",
  "\uFFFD"
];
const controlCharRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const issues = [];

function toRelativePosix(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) {
        continue;
      }
      await walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!includeExt.has(ext)) {
      continue;
    }

    const relativePath = toRelativePosix(fullPath);
    if (allowlist.has(relativePath)) {
      continue;
    }

    let content;
    try {
      content = await readFile(fullPath, "utf8");
    } catch {
      issues.push({
        file: relativePath,
        reason: "Unable to read file as UTF-8."
      });
      continue;
    }

    const controlMatch = content.match(controlCharRegex);
    if (controlMatch) {
      const index = controlMatch.index ?? 0;
      const line = content.slice(0, index).split("\n").length;
      const charCode = controlMatch[0].charCodeAt(0).toString(16).toUpperCase();
      issues.push({
        file: relativePath,
        reason: `Contains control character U+${charCode.padStart(4, "0")} at line ${line}.`
      });
      continue;
    }

    for (const marker of mojibakeMarkers) {
      const index = content.indexOf(marker);
      if (index < 0) {
        continue;
      }
      const line = content.slice(0, index).split("\n").length;
      issues.push({
        file: relativePath,
        reason: `Contains mojibake marker at line ${line}.`
      });
      break;
    }
  }
}

await walk(root);

if (issues.length > 0) {
  console.error("Repository mojibake check failed:");
  for (const issue of issues) {
    console.error(`- ${issue.file}: ${issue.reason}`);
  }
  process.exit(1);
}

console.log("Repository mojibake check passed.");
