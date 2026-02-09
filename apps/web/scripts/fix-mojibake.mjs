import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import * as ts from "typescript";

const root = path.resolve(process.cwd());
const ignoreDirs = new Set([".next", "node_modules", "dist", "build", ".git", ".ignored"]);
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx"]);
const mojibakeRegex = /[ÃÄ\uFFFD]/;

const fixMojibake = (value) => {
  if (!value || !mojibakeRegex.test(value)) {
    return value;
  }
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
};

const escapeStringLiteral = (value, quote) => {
  let escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  if (quote === "'") {
    escaped = escaped.replace(/'/g, "\\'");
  } else {
    escaped = escaped.replace(/\"/g, "\\\"");
  }

  return `${quote}${escaped}${quote}`;
};

const escapeTemplateLiteral = (value) => {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
  return `\`${escaped}\``;
};

const getScriptKind = (filePath) => {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
};

const collectReplacements = (sourceFile) => {
  const replacements = [];

  const visit = (node) => {
    if (ts.isStringLiteral(node)) {
      const fixed = fixMojibake(node.text);
      if (fixed !== node.text) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const quote = sourceFile.text[start] === "'" ? "'" : "\"";
        replacements.push({ start, end, text: escapeStringLiteral(fixed, quote) });
      }
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      const fixed = fixMojibake(node.text);
      if (fixed !== node.text) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        replacements.push({ start, end, text: escapeTemplateLiteral(fixed) });
      }
    } else if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      const fixed = fixMojibake(raw);
      if (fixed !== raw) {
        replacements.push({ start: node.getStart(sourceFile), end: node.getEnd(), text: fixed });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return replacements;
};

const applyReplacements = (content, replacements) => {
  if (!replacements.length) return content;
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let next = content;
  for (const replacement of sorted) {
    next =
      next.slice(0, replacement.start) +
      replacement.text +
      next.slice(replacement.end);
  }
  return next;
};

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
      if (!mojibakeRegex.test(content)) {
        continue;
      }

      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        getScriptKind(filePath)
      );
      const replacements = collectReplacements(sourceFile);
      if (!replacements.length) {
        continue;
      }

      const next = applyReplacements(content, replacements);
      if (next !== content) {
        await writeFile(filePath, next, "utf8");
        console.log(`fixed: ${path.relative(root, filePath)}`);
      }
    } catch {
      // Ignore unreadable files.
    }
  }
}

await walk(root);
