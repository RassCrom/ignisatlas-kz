// Prints files in public/ that no source refers to, one per line.
// Usage: node scripts/find-unused-public.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findUnusedPublic } from './lib/unused-public.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(path));
    else result.push(path);
  }
  return result;
}

const toPosix = (path) => path.split(sep).join('/');
const hasExt = (path, exts) => exts.some((ext) => path.endsWith(ext));

const publicDir = join(root, 'public');
const publicFiles = walk(publicDir);

const sourcePaths = [
  ...walk(join(root, 'src')).filter((p) => hasExt(p, ['.js', '.jsx', '.scss', '.css'])),
  ...publicFiles.filter((p) => hasExt(p, ['.json', '.css', '.html'])),
  join(root, 'index.html'),
  join(root, 'vite.config.js'),
].filter((p) => existsSync(p));

const files = publicFiles.map((p) => toPosix(relative(publicDir, p)));
const sources = sourcePaths.map((p) => readFileSync(p, 'utf8'));

for (const file of findUnusedPublic(files, sources)) console.log(file);
