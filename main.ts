// Leonida Trophy Atlas — the hand-in program for gta6-trophy-guide-01.
//
// This entry is a static web app under app/: a guide and tracker for the 55
// PlayStation 5 trophies of Grand Theft Auto VI, written for this bounty in
// the entrant's own words, plus 3 or 4 screenshots of it under screenshots/.
// The app runs from plain files with the network off; nothing is installed
// and there is no build step.
//
// This program copies app/ and screenshots/ from beside this file into the
// grader's output directory (or $MAKEFUN_OUTPUT_DIR outside the grader) and
// writes /output/dossier.json with the vendored make.fun library, so the
// judge can read the screenshots, the first load's files and bytes, and the
// source outline. It refuses to hand in a broken snapshot: it checks the
// entry's own caps first (plain files only, screenshots whole and small
// enough, index.html under its cap) and fails loudly instead of shipping
// something the scorer would refuse.
//
// Run it from the repository root:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the two outputs must be byte-identical.

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Where this program lives, and where the hand-in goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The scorer's caps for this bounty (RULES.txt, The gate).
const MAX_APP_FILES = 993;
const MAX_APP_BYTES = 48 * 1024 * 1024;
const MAX_INDEX_BYTES = 1024 * 1024;
const MIN_SHOTS = 3;
const MAX_SHOTS = 4;
const MAX_SHOT_BYTES = 256 * 1024;
const MAX_DOSSIER_BYTES = 1536 * 1024;

function fail(message: string): never {
  throw new Error(`leonida-trophy-atlas: ${message}`);
}

// Walk a directory and count plain files and directories, refusing anything
// that is not one (a symbolic link would break the scorer's app_files row).
function countPlainTree(root: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) fail(`symbolic link in the hand-in: ${path}`);
      if (info.isDirectory()) {
        stack.push(path);
      } else if (info.isFile()) {
        files += 1;
        bytes += info.size;
      } else {
        fail(`special file in the hand-in: ${path}`);
      }
    }
  }
  return { files, bytes };
}

// The trophy file is the entry's heart: it must parse, hold all 55 official
// trophies, and give every one of them a non-blank guide. Checking it here
// means a broken data file fails the hand-in instead of the gate.
function checkTrophyFile(path: string): number {
  if (!existsSync(path)) fail('app/data/trophies.json is missing');
  if (statSync(path).size > 2 * 1024 * 1024) fail('app/data/trophies.json is over its 2 MiB cap');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail('app/data/trophies.json does not parse as JSON');
  }
  const list = (parsed as { trophies?: unknown[] }).trophies;
  if (!Array.isArray(list)) fail('app/data/trophies.json holds no trophies array');
  if (list.length !== 55) fail(`app/data/trophies.json holds ${list.length} trophies, need 55`);
  for (const [index, trophy] of list.entries()) {
    const entry = trophy as { name?: unknown; guide?: unknown };
    if (typeof entry.name !== 'string' || entry.name.trim() === '') {
      fail(`trophy ${index + 1} has no name`);
    }
    if (typeof entry.guide !== 'string' || entry.guide.trim() === '') {
      fail(`trophy ${entry.name} has no guide`);
    }
  }
  return list.length;
}

// A whole PNG starts 89 50 4E 47 and a whole JPEG starts FF D8 FF.
function isWholeImage(bytes: Buffer): boolean {
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return png || jpeg;
}

// screenshots/ holds 3 or 4 whole PNG or JPEG images, each at most 256 KiB.
function checkScreenshots(dir: string): string[] {
  if (!existsSync(dir)) fail('screenshots/ is missing from the repository');
  const names = readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .sort();
  if (names.length < MIN_SHOTS || names.length > MAX_SHOTS) {
    fail(`screenshots/ holds ${names.length} images, need ${MIN_SHOTS} to ${MAX_SHOTS}`);
  }
  for (const name of names) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith('-')) {
      fail(`screenshot name not allowed: ${name}`);
    }
    const path = join(dir, name);
    if (!lstatSync(path).isFile()) fail(`screenshot is not a regular file: ${name}`);
    const bytes = readFileSync(path);
    if (bytes.length > MAX_SHOT_BYTES) {
      fail(`screenshot over 256 KiB: ${name} (${bytes.length} bytes)`);
    }
    if (!isWholeImage(bytes)) fail(`screenshot is not a whole PNG or JPEG: ${name}`);
  }
  return names;
}

// Copy one tree into another and say how many files it carried.
function copyCounted(from: string, to: string): number {
  const before = countPlainTree(from);
  cpSync(from, to, { recursive: true });
  return before.files;
}

function handIn(): void {
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');

  const indexPath = join(appDir, 'index.html');
  if (!existsSync(indexPath)) fail('app/index.html is missing');
  if (statSync(indexPath).size > MAX_INDEX_BYTES) {
    fail('app/index.html is over its 1 MiB cap');
  }
  const app = countPlainTree(appDir);
  if (app.files > MAX_APP_FILES) fail(`app/ holds ${app.files} files, cap ${MAX_APP_FILES}`);
  if (app.bytes > MAX_APP_BYTES) fail(`app/ is ${app.bytes} bytes, cap ${MAX_APP_BYTES}`);
  const trophyCount = checkTrophyFile(join(appDir, 'data', 'trophies.json'));
  const shotNames = checkScreenshots(shotsDir);

  mkdirSync(outputDir, { recursive: true });
  const appFiles = copyCounted(appDir, join(outputDir, 'app'));
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shotFiles = copyCounted(shotsDir, join(outputDir, 'screenshots'));

  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SHOTS, max_bytes: MAX_SHOT_BYTES },
    app_max_files: MAX_APP_FILES,
    app_max_bytes: MAX_APP_BYTES,
  });
  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  if (statSync(dossierPath).size > MAX_DOSSIER_BYTES) {
    fail(`dossier.json is over its 1.5 MiB cap`);
  }

  console.log(
    `handed in ${appFiles} app files (${trophyCount} trophies) and ${shotFiles} screenshots ` +
      `(${shotNames.join(', ')}) to ${outputDir}; ` +
      `dossier.json ${statSync(dossierPath).size} bytes`,
  );
}

try {
  handIn();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
