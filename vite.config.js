import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { chatMiddleware } from './server/chat.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const middleware = chatMiddleware(env.ENGLISH_AI_KEY || process.env.ENGLISH_AI_KEY);
  const standalone = mode === 'standalone';
  const browserOnly = mode === 'static' || standalone;
  const avatarImage = standalone ? `data:image/png;base64,${readFileSync(new URL('./public/avatars/conversation-partner.png', import.meta.url)).toString('base64')}` : './avatars/conversation-partner.png';
  const avatarSprite = standalone ? `data:image/png;base64,${readFileSync(new URL('./public/avatars/emma-speaking.png', import.meta.url)).toString('base64')}` : './avatars/emma-speaking.png';
  return {
    base: browserOnly ? './' : '/',
    publicDir: standalone ? false : 'public',
    define: { 'import.meta.env.VITE_STATIC_PREVIEW': JSON.stringify(browserOnly ? 'true' : 'false'), __AVATAR_IMAGE__: JSON.stringify(avatarImage), __AVATAR_SPRITE__: JSON.stringify(avatarSprite) },
    build: standalone ? { rollupOptions: { output: { inlineDynamicImports: true } } } : undefined,
    plugins: [{ name: 'english-conversation', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); } }],
  };
});
