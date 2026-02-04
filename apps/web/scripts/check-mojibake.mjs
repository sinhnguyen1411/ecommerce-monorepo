import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
const ignoreDirs = new Set([".next", "node_modules", "dist", "build", ".git"]);
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md"]);

const mojibakeMarkers = ["Ã", "Â", "Ä", "Å", "Æ", "á»", "áº", "�"];
const literalRegex = /("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g;
const inlineBadRegex = /[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]/;

const issues = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) {
        continue;
      }
      await walk(path.join(dir, entry.name));
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (!includeExt.has(path.extname(entry.name))) {
      continue;
    }
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        continue;
      }
      const content = await readFile(filePath, "utf8");
      checkFile(filePath, content);
    } catch {
      // Ignore unreadable files.
    }
  }
}

function checkFile(filePath, content) {
  for (const marker of mojibakeMarkers) {
    if (content.includes(marker)) {
      issues.push({
        filePath,
        reason: `Contains mojibake marker "${marker}".`
      });
      break;
    }
  }

  for (const match of content.matchAll(literalRegex)) {
    const literal = match[0];
    if (!literal.includes("?")) {
      continue;
    }
    if (literal.includes("http://") || literal.includes("https://")) {
      continue;
    }
    if (literal.includes("\\?")) {
      continue;
    }
    if (inlineBadRegex.test(literal)) {
      issues.push({
        filePath,
        reason: "Suspicious '?' inside a string literal.",
        snippet: literal.slice(0, 200)
      });
      break;
    }
  }
}

await walk(root);

if (issues.length) {
  console.error("Mojibake check failed. Possible encoding issues detected:");
  for (const issue of issues) {
    console.error(`- ${issue.filePath}: ${issue.reason}`);
    if (issue.snippet) {
      console.error(`  ${issue.snippet}`);
    }
  }
  process.exit(1);
}

console.log("Mojibake check passed.");
