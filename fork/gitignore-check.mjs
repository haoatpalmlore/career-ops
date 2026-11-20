/** Pure root-.gitignore evaluator for fixed repository test probes. */
import { readFileSync } from 'fs';
import { join } from 'path';

function matches(pattern, path) {
  const p = pattern.replace(/^\//, '');
  if (p.endsWith('/**')) return path === p.slice(0, -3) || path.startsWith(p.slice(0, -2));
  if (p.endsWith('/*')) return path.startsWith(p.slice(0, -1));
  if (p.endsWith('/')) return path === p.slice(0, -1) || path.startsWith(p);
  if (!p.includes('*')) return path === p;
  const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]*');
  return new RegExp(`^${escaped}$`).test(path);
}

export function checkGitignore(path, root = process.cwd()) {
  try {
    let ignored = false;
    for (const raw of readFileSync(join(root, '.gitignore'), 'utf8').split(/\r?\n/)) {
      const line = raw.trimEnd();
      if (!line || line.startsWith('#')) continue;
      const negate = line.startsWith('!');
      const pattern = negate ? line.slice(1) : line;
      if (matches(pattern, path)) ignored = !negate;
    }
    return { status: ignored ? 'ignored' : 'not-ignored' };
  } catch (error) {
    return { status: 'error', detail: error.message };
  }
}
