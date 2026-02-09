import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import * as ts from "typescript";

const root = path.resolve(process.cwd());
const ignoreDirs = new Set([".next", "node_modules", "dist", "build", ".git"]);
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md"]);
const scriptExt = new Set([".ts", ".tsx", ".js", ".jsx"]);

const mojibakeMarkers = [
  "Ã",
  "Ä",
  "Ãƒ",
  "Ã‚",
  "Ã„",
  "Ã…",
  "Ã†",
  "Ã¡Â»",
  "Ã¡Âº",
  "\uFFFD",
  "ï¿½"
];
const inlineBadRegex = /\p{L}\?\p{L}/u;

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
  const ext = path.extname(filePath);

  if (!scriptExt.has(ext)) {
    for (const marker of mojibakeMarkers) {
      if (content.includes(marker)) {
        issues.push({
          filePath,
          reason: `Contains mojibake marker "${marker}".`
        });
        break;
      }
    }
    return;
  }

  const scriptKind =
    ext === ".tsx"
      ? ts.ScriptKind.TSX
      : ext === ".jsx"
        ? ts.ScriptKind.JSX
        : ext === ".js"
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const maybeFlag = (value) => {
    if (!value || !value.includes("?")) {
      return false;
    }
    if (value.includes("http://") || value.includes("https://")) {
      return false;
    }
    return inlineBadRegex.test(value);
  };

  const hasMojibake = (value) =>
    mojibakeMarkers.some((marker) => value.includes(marker));

  let reported = false;
  const visit = (node) => {
    if (reported) {
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = node.text;
      if (hasMojibake(value)) {
        issues.push({
          filePath,
          reason: "Contains mojibake marker inside a string literal.",
          snippet: value.slice(0, 200)
        });
        reported = true;
        return;
      }
      if (maybeFlag(value)) {
        issues.push({
          filePath,
          reason: "Suspicious '?' inside a string literal.",
          snippet: value.slice(0, 200)
        });
        reported = true;
        return;
      }
    } else if (ts.isJsxText(node)) {
      const value = node.getText(sourceFile);
      if (hasMojibake(value)) {
        issues.push({
          filePath,
          reason: "Contains mojibake marker inside JSX text.",
          snippet: value.slice(0, 200)
        });
        reported = true;
        return;
      }
      if (maybeFlag(value)) {
        issues.push({
          filePath,
          reason: "Suspicious '?' inside JSX text.",
          snippet: value.slice(0, 200)
        });
        reported = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
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
