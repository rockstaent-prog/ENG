import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve('dist-standalone');
let html = await readFile(path.join(root, 'index.html'), 'utf8');
async function asset(url) {
  const file = path.resolve(root, url);
  if (!file.startsWith(root + path.sep)) throw new Error('Build asset must stay in dist-standalone');
  return readFile(file, 'utf8');
}
const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
if (scriptTags.length !== 1) throw new Error('Expected one JavaScript bundle for standalone app');
for (const [tag, src] of scriptTags) {
  const js = (await asset(src)).replace(/<\/script/gi, '<\\/script');
  html = html.replace(tag, () => `<script type="module">${js}</script>`);
}
for (const [tag, href] of [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)]) {
  const css = (await asset(href)).replace(/<\/style/gi, '<\\/style');
  html = html.replace(tag, () => `<style>${css}</style>`);
}
html = html.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, '');
html = html.replace(/^[ \t]*<link\b[^>]*\brel="(?:manifest|apple-touch-icon)"[^>]*>[ \t]*\r?\n?/gm, '');
html = html.replace(/<title>[^<]+<\/title>/, '<title>こもれび — 英語学習アプリ お試し版</title>');
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\brel="stylesheet"/i.test(html)) throw new Error('Standalone app still depends on external scripts or styles');
await mkdir('preview', {recursive: true});
await writeFile('preview/komorebi.html', html);
console.log(`Saved preview/komorebi.html (${Buffer.byteLength(html).toLocaleString()} bytes). Open this single file in a desktop browser; no server or API key is needed.`);
execFileSync('python3', ['scripts/package-download.py'], { stdio: 'inherit' });
