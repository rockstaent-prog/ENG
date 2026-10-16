import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function writeMobileWorker(directory) {
  const files = [];
  async function visit(relative = '') {
    for (const item of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const file = path.posix.join(relative, item.name);
      if (item.isDirectory()) await visit(file);
      else if (item.name !== 'sw.js' && /\.(html|js|css|png|svg|webmanifest)$/.test(item.name)) files.push(file);
    }
  }
  await visit(); files.sort();
  const hash = createHash('sha256');
  for (const file of files) { hash.update(file); hash.update(await readFile(path.join(directory, file))); }
  const version = hash.digest('hex').slice(0, 16);
  await writeFile(path.join(directory, 'sw.js'), `// Complete app versions are saved together, so offline starts never mix releases.
const PREFIX = 'komorebi-' + new URL(self.registration.scope).pathname + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(files)}.map(file => new URL(file, self.registration.scope).href);
const INDEX = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})));
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(INDEX)) || fetch(event.request)));
  } else if (ASSETS.includes(url.origin + url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.origin + url.pathname)) || fetch(event.request)));
  }
});
`);
}
