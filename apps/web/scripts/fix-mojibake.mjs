import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import * as ts from "typescript";

const root = path.resolve(process.cwd());
const ignoreDirs = new Set([".next", "node_modules", "dist", "build", ".git", ".ignored"]);
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx"]);

const mojibakeMarkers = [
  "\u00C3",
  "\u00C4",
  "\u00C5",
  "\u00C6",
  "\u00C2",
  "\u00E1\u00BB",
  "\u00E1\u00BA",
  "\u00C6\u00B0",
  "\u00C4\u2018",
  "\u00E2\u20AC",
  "\u00EF\u00BF\u00BD",
  "\uFFFD"
];

const cp1252ReverseMap = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f]
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mojibakeRegex = new RegExp(`(?:${mojibakeMarkers.map(escapeRegExp).join("|")})`);
const mojibakeMarkerRegex = new RegExp(`(?:${mojibakeMarkers.map(escapeRegExp).join("|")})`, "g");
const suspiciousQuestionRegex = /\p{L}\?{1,2}\p{L}/u;
const replacementCharRegex = /(?:\uFFFD|\u00EF\u00BF\u00BD)/g;
const controlCharRegex = /[\u0000-\u001F\u007F]/g;

const looksBroken = (value) =>
  mojibakeRegex.test(value) || replacementCharRegex.test(value) || suspiciousQuestionRegex.test(value);

const scoreCandidate = (value) => {
  const markerCount = (value.match(mojibakeMarkerRegex) || []).length;
  const replacementCount = (value.match(replacementCharRegex) || []).length;
  const controlCount = (value.match(controlCharRegex) || []).length;
  const suspiciousQuestionCount = suspiciousQuestionRegex.test(value) ? 1 : 0;

  return markerCount * 6 + replacementCount * 8 + controlCount * 10 + suspiciousQuestionCount * 4;
};

const toSingleByteBytes = (value, useCp1252) => {
  const bytes = [];

  for (const char of value) {
    const codepoint = char.codePointAt(0);
    if (typeof codepoint !== "number") {
      return null;
    }

    if (codepoint <= 0xff) {
      bytes.push(codepoint);
      continue;
    }

    if (useCp1252) {
      const mapped = cp1252ReverseMap.get(codepoint);
      if (typeof mapped === "number") {
        bytes.push(mapped);
        continue;
      }
    }

    return null;
  }

  return Uint8Array.from(bytes);
};

const decodeFromSingleByte = (value, useCp1252) => {
  const bytes = toSingleByteBytes(value, useCp1252);
  if (!bytes) {
    return value;
  }
  return Buffer.from(bytes).toString("utf8");
};

const fixMojibake = (value) => {
  if (!value || !looksBroken(value)) {
    return value;
  }

  let best = value;
  let bestScore = scoreCandidate(value);

  const tryCandidate = (candidate) => {
    if (!candidate || candidate === best) {
      return;
    }

    const candidateScore = scoreCandidate(candidate);
    if (candidateScore < bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  };

  try {
    const decoded = decodeFromSingleByte(value, true);
    tryCandidate(decoded);
    tryCandidate(decodeFromSingleByte(decoded, true));
  } catch {
    // Best effort.
  }

  try {
    const decoded = decodeFromSingleByte(value, false);
    tryCandidate(decoded);
    tryCandidate(decodeFromSingleByte(decoded, false));
  } catch {
    // Best effort.
  }

  return best;
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
        const quote = sourceFile.text[start] === "'" ? "'" : '"';
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
    next = next.slice(0, replacement.start) + replacement.text + next.slice(replacement.end);
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
      if (!mojibakeRegex.test(content) && !suspiciousQuestionRegex.test(content)) {
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
